package devin

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/tidwall/gjson"
)

// BuildChatRequest translates the common Chat Completions shape at the shared
// gateway boundary. No caller-supplied URL or credential reaches the transport.
func BuildChatRequest(ctx context.Context, body []byte, token string) (*http.Request, error) {
	if !json.Valid(body) {
		return nil, errors.New("invalid chat request JSON")
	}
	root := gjson.ParseBytes(body)
	model := strings.TrimSpace(root.Get("model").String())
	if model == "" || !root.Get("messages").IsArray() {
		return nil, errors.New("model and messages are required")
	}
	if token == "" || strings.ContainsAny(token, "\r\n") {
		return nil, errors.New("missing or invalid Devin session token")
	}
	if n := root.Get("n"); n.Exists() && n.Int() != 1 {
		return nil, errors.New("Devin supports n=1 only")
	}
	for _, key := range []string{"stop", "response_format", "audio", "logprobs", "functions", "function_call"} {
		if v := root.Get(key); v.Exists() && v.Type != gjson.Null && v.Raw != "false" {
			return nil, fmt.Errorf("Devin does not support %s", key)
		}
	}
	choice := root.Get("tool_choice")
	if choice.Exists() && choice.String() != "auto" && choice.String() != "none" {
		return nil, errors.New("Devin supports tool_choice auto or none")
	}
	var system []string
	var prompts []DevinPrompt
	for _, msg := range root.Get("messages").Array() {
		p := DevinPrompt{MessageID: uuid.NewString(), Thinking: msg.Get("reasoning_content").String()}
		switch msg.Get("role").String() {
		case "system", "developer":
			text, images, err := chatContent(msg.Get("content"))
			if err != nil {
				return nil, err
			}
			if len(images) != 0 {
				return nil, errors.New("Devin system messages must contain text")
			}
			system = append(system, text)
			continue
		case "user":
			p.Source = 1
		case "assistant":
			p.Source = 2
		case "tool":
			p.Source, p.ToolCallID = 4, msg.Get("tool_call_id").String()
			if p.ToolCallID == "" {
				return nil, errors.New("tool_call_id is required")
			}
		default:
			return nil, errors.New("unsupported message role")
		}
		var err error
		p.Content, p.Images, err = chatContent(msg.Get("content"))
		if err != nil {
			return nil, err
		}
		for _, tc := range msg.Get("tool_calls").Array() {
			if tc.Get("type").String() != "function" {
				return nil, errors.New("only function tool calls are supported")
			}
			p.ToolCalls = append(p.ToolCalls, DevinToolCall{ID: tc.Get("id").String(), Name: tc.Get("function.name").String(), Arguments: tc.Get("function.arguments").String()})
		}
		if p.Source == 1 && strings.TrimSpace(p.Content) == "" && len(p.Images) == 0 {
			return nil, errors.New("empty user message")
		}
		prompts = append(prompts, p)
	}
	if len(prompts) == 0 {
		return nil, errors.New("at least one conversation message is required")
	}
	var tools []DevinTool
	if choice.String() != "none" {
		for _, t := range root.Get("tools").Array() {
			if t.Get("type").String() != "function" || t.Get("function.name").String() == "" {
				return nil, errors.New("only named function tools are supported")
			}
			parameters := t.Get("function.parameters").Raw
			if parameters == "" {
				parameters = `{"type":"object","properties":{}}`
			}
			tools = append(tools, DevinTool{Name: t.Get("function.name").String(), Description: t.Get("function.description").String(), Parameters: []byte(parameters)})
		}
	}
	maxTokens := int(root.Get("max_completion_tokens").Int())
	if maxTokens <= 0 {
		maxTokens = int(root.Get("max_tokens").Int())
	}
	var temperature *float64
	if v := root.Get("temperature"); v.Exists() {
		f := v.Float()
		temperature = &f
	}
	var topP *float64
	if v := root.Get("top_p"); v.Exists() {
		f := v.Float()
		if f < 0 || f > 1 {
			return nil, errors.New("top_p must be between 0 and 1")
		}
		topP = &f
	}
	uid := ResolveDevinChatModelUID(model, root.Get("reasoning_effort").String(), 0)
	if m := LookupModel(strings.TrimPrefix(model, "devin/")); m != nil && m.MaxCompletionTokens > 0 && (maxTokens <= 0 || maxTokens > m.MaxCompletionTokens) {
		maxTokens = m.MaxCompletionTokens
	}
	payload := BuildDevinGetChatMessageRequest(NormalizeToken(token), "", uid, strings.Join(system, "\n\n"), prompts, tools, temperature, topP, maxTokens, "", "")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, DevinDefaultBaseURL+DevinChatPath, bytes.NewReader(WrapConnectEnvelope(payload)))
	if err != nil {
		return nil, err
	}
	token = NormalizeToken(token)
	req.Header.Set("Authorization", "Basic "+token+"-"+token)
	req.Header.Set("Content-Type", "application/connect+proto")
	req.Header.Set("Connect-Protocol-Version", "1")
	req.Header.Set("Connect-Accept-Encoding", "gzip")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Sentry-Trace", GenerateDevinSentryTrace())
	req.Header["User-Agent"] = []string{""}
	return req, nil
}

func chatContent(content gjson.Result) (string, []DevinImage, error) {
	if content.Type == gjson.String {
		return content.String(), nil, nil
	}
	if !content.Exists() || content.Type == gjson.Null {
		return "", nil, nil
	}
	if !content.IsArray() {
		return "", nil, errors.New("invalid message content")
	}
	var text []string
	var images []DevinImage
	for _, part := range content.Array() {
		switch part.Get("type").String() {
		case "text":
			text = append(text, part.Get("text").String())
		case "image_url":
			value := part.Get("image_url.url").String()
			meta, data, found := strings.Cut(value, ",")
			if !found || !strings.HasPrefix(meta, "data:image/") || !strings.HasSuffix(meta, ";base64") {
				return "", nil, errors.New("Devin requires inline base64 image data; remote image URLs are unsupported")
			}
			if _, err := base64.StdEncoding.DecodeString(data); err != nil {
				return "", nil, errors.New("invalid base64 image")
			}
			images = append(images, DevinImage{Base64Data: data, MimeType: strings.TrimSuffix(strings.TrimPrefix(meta, "data:"), ";base64")})
		default:
			return "", nil, errors.New("unsupported Devin content part; use text or inline images")
		}
	}
	return strings.Join(text, "\n"), images, nil
}

type upstreamError struct{ status int }

func (e *upstreamError) Error() string {
	return fmt.Sprintf("Devin upstream failed (HTTP %d)", e.status)
}

// AdaptChatResponse retains the regular sub2api CC pipeline for streaming,
// protocol compatibility, cancellation, failover and usage accounting.
func AdaptChatResponse(resp *http.Response, model string, stream bool) (*http.Response, error) {
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		_ = resp.Body.Close()
		return chatErrorResponse(resp.StatusCode), nil
	}
	flag, payload, err := ReadConnectFrame(resp.Body)
	if err != nil {
		_ = resp.Body.Close()
		return nil, errors.New("Devin returned an incomplete stream")
	}
	if err := checkFrame(flag, payload); err != nil {
		_ = resp.Body.Close()
		var up *upstreamError
		if errors.As(err, &up) {
			return chatErrorResponse(up.status), nil
		}
		return nil, err
	}
	state := &chatState{id: "chatcmpl-" + uuid.NewString(), model: model, created: time.Now().Unix(), indices: map[string]int{}, lastTool: -1}
	out := &http.Response{StatusCode: http.StatusOK, Header: http.Header{}, Request: resp.Request}
	if stream {
		r, w := io.Pipe()
		out.Header.Set("Content-Type", "text/event-stream")
		out.Body = &chatStreamBody{PipeReader: r, upstream: resp.Body}
		go func() {
			defer func() { _ = resp.Body.Close() }()
			err := state.consume(resp.Body, flag, payload, w)
			_ = w.CloseWithError(err)
		}()
	} else {
		defer func() { _ = resp.Body.Close() }()
		if err := state.consume(resp.Body, flag, payload, nil); err != nil {
			var up *upstreamError
			if errors.As(err, &up) {
				return chatErrorResponse(up.status), nil
			}
			return nil, err
		}
		data, err := json.Marshal(state.completion())
		if err != nil {
			return nil, err
		}
		out.Header.Set("Content-Type", "application/json")
		out.Body = io.NopCloser(bytes.NewReader(data))
	}
	return out, nil
}

type chatStreamBody struct {
	*io.PipeReader
	upstream io.Closer
	once     sync.Once
}

func (b *chatStreamBody) Close() error {
	b.once.Do(func() { _ = b.PipeReader.Close(); _ = b.upstream.Close() })
	return nil
}

func checkFrame(flag byte, payload []byte) error {
	if flag&ConnectFlagEndStream != 0 {
		if status, err := ParseDevinTrailerError(payload); err != nil {
			return &upstreamError{status}
		}
		return nil
	}
	f, err := ParseDevinFrame(payload)
	if err != nil {
		return errors.New("invalid Devin protobuf response")
	}
	if f.Usage != nil && f.Usage.StatusCode >= 400 {
		return &upstreamError{int(f.Usage.StatusCode)}
	}
	return nil
}

func chatErrorResponse(status int) *http.Response {
	if status < 400 || status > 599 {
		status = http.StatusBadGateway
	}
	data, _ := json.Marshal(map[string]any{"error": map[string]any{"type": "upstream_error", "message": fmt.Sprintf("Devin upstream failed (HTTP %d)", status)}})
	return &http.Response{StatusCode: status, Header: http.Header{"Content-Type": []string{"application/json"}}, Body: io.NopCloser(bytes.NewReader(data))}
}

type chatTool struct {
	id, name string
	args     strings.Builder
}
type chatState struct {
	id, model              string
	created                int64
	text, thinking         strings.Builder
	textUTF8, thinkingUTF8 UTF8SplitBuffer
	usage                  DevinUsage
	tools                  []chatTool
	indices                map[string]int
	lastTool               int
	stop                   uint64
	totalBytes             int
}

func (s *chatState) consume(r io.Reader, flag byte, payload []byte, stream io.Writer) error {
	if stream != nil {
		if err := s.chunk(stream, map[string]any{"role": "assistant"}, nil, nil); err != nil {
			return err
		}
	}
	for {
		if err := checkFrame(flag, payload); err != nil {
			return err
		}
		if flag&ConnectFlagEndStream != 0 {
			break
		}
		s.totalBytes += len(payload)
		if s.totalBytes > 64<<20 {
			return errors.New("Devin response exceeds 64 MiB limit")
		}
		f, _ := ParseDevinFrame(payload)
		delta := map[string]any{}
		text := s.textUTF8.Feed([]byte(f.ContentText))
		thinking := s.thinkingUTF8.Feed([]byte(f.ThinkingText))
		if text != "" {
			if stream == nil {
				s.text.WriteString(text)
			}
			delta["content"] = text
		}
		if thinking != "" {
			if stream == nil {
				s.thinking.WriteString(thinking)
			}
			delta["reasoning_content"] = thinking
		}
		if f.StopReason != 0 {
			s.stop = f.StopReason
		}
		if u := f.Usage; u != nil {
			if u.PromptTokens > 0 {
				s.usage.PromptTokens = u.PromptTokens
			}
			if u.CompletionTokens > 0 {
				s.usage.CompletionTokens = u.CompletionTokens
			}
			if u.CachedTokens > 0 {
				s.usage.CachedTokens = u.CachedTokens
			}
			if u.CacheWriteTokens > 0 {
				s.usage.CacheWriteTokens = u.CacheWriteTokens
			}
		}
		if p, c, cache, found := ParseDevinResponseDimensionGroups(f.ResponseDimensionGroups...); found {
			if s.usage.PromptTokens == 0 {
				s.usage.PromptTokens = p
			}
			if s.usage.CompletionTokens == 0 {
				s.usage.CompletionTokens = c
			}
			if s.usage.CachedTokens == 0 {
				s.usage.CachedTokens = cache
			}
		}
		var calls []any
		for _, tc := range f.ToolCallDeltas {
			idx, exists := s.indices[tc.ID]
			if tc.ID == "" && s.lastTool >= 0 {
				idx, exists = s.lastTool, true
			}
			if !exists {
				if len(s.tools) >= 128 {
					return errors.New("too many Devin tool calls")
				}
				idx = len(s.tools)
				id := tc.ID
				if id == "" {
					id = "call_" + uuid.NewString()
				}
				s.tools = append(s.tools, chatTool{id: id, name: tc.Name})
				if tc.ID != "" {
					s.indices[tc.ID] = idx
				}
			}
			s.lastTool = idx
			args := tc.Arguments
			if args == "" {
				args = tc.InvalidJSONStr
			}
			if tc.Name != "" {
				s.tools[idx].name = tc.Name
			}
			s.tools[idx].args.WriteString(args)
			function := map[string]any{"arguments": args}
			call := map[string]any{"index": idx, "function": function}
			if !exists {
				call["id"], call["type"] = s.tools[idx].id, "function"
			}
			if tc.Name != "" {
				function["name"] = tc.Name
			}
			calls = append(calls, call)
		}
		if len(calls) > 0 {
			delta["tool_calls"] = calls
		}
		if stream != nil && len(delta) > 0 {
			if err := s.chunk(stream, delta, nil, nil); err != nil {
				return err
			}
		}
		var err error
		flag, payload, err = ReadConnectFrame(r)
		if err != nil {
			return errors.New("Devin stream ended before its terminal frame")
		}
	}
	if len(s.textUTF8.remainder) != 0 || len(s.thinkingUTF8.remainder) != 0 {
		return errors.New("incomplete UTF-8 in Devin response")
	}
	for _, tc := range s.tools {
		if tc.name == "" || !json.Valid([]byte(tc.args.String())) {
			return errors.New("Devin returned an incomplete tool call")
		}
	}
	if stream != nil {
		if err := s.chunk(stream, map[string]any{}, s.finishReason(), nil); err != nil {
			return err
		}
		if err := s.chunk(stream, nil, nil, s.chatUsage()); err != nil {
			return err
		}
		_, err := io.WriteString(stream, "data: [DONE]\n\n")
		return err
	}
	return nil
}

func (s *chatState) finishReason() string {
	if len(s.tools) > 0 || s.stop == 10 {
		return "tool_calls"
	}
	if s.stop == 1 || s.stop == 3 {
		return "length"
	}
	if s.stop == 11 {
		return "content_filter"
	}
	return "stop"
}

func (s *chatState) chatUsage() map[string]any {
	// Match CLIProxyAPI: prompt input plus cache reads; cache writes are a separate metric.
	prompt := s.usage.PromptTokens + s.usage.CachedTokens
	return map[string]any{"prompt_tokens": prompt, "completion_tokens": s.usage.CompletionTokens, "total_tokens": prompt + s.usage.CompletionTokens, "prompt_tokens_details": map[string]any{"cached_tokens": s.usage.CachedTokens, "cache_creation_tokens": s.usage.CacheWriteTokens}}
}

func (s *chatState) chunk(w io.Writer, delta map[string]any, finish any, usage any) error {
	choices := []any{}
	if delta != nil {
		choices = append(choices, map[string]any{"index": 0, "delta": delta, "finish_reason": finish})
	}
	chunk := map[string]any{"id": s.id, "object": "chat.completion.chunk", "created": s.created, "model": s.model, "choices": choices}
	if usage != nil {
		chunk["usage"] = usage
	}
	data, err := json.Marshal(chunk)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintf(w, "data: %s\n\n", data)
	return err
}

func (s *chatState) completion() map[string]any {
	message := map[string]any{"role": "assistant", "content": s.text.String()}
	if s.thinking.Len() > 0 {
		message["reasoning_content"] = s.thinking.String()
	}
	if len(s.tools) > 0 {
		calls := make([]any, 0, len(s.tools))
		for _, tc := range s.tools {
			calls = append(calls, map[string]any{"id": tc.id, "type": "function", "function": map[string]any{"name": tc.name, "arguments": tc.args.String()}})
		}
		message["tool_calls"] = calls
	}
	return map[string]any{"id": s.id, "object": "chat.completion", "created": s.created, "model": s.model, "choices": []any{map[string]any{"index": 0, "message": message, "finish_reason": s.finishReason()}}, "usage": s.chatUsage()}
}

func isPrintableASCII(b []byte) bool {
	for _, c := range b {
		if c < 32 || c > 126 {
			return false
		}
	}
	return true
}
