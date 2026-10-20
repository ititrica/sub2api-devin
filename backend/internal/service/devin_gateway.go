package service

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/devin"
	"github.com/gin-gonic/gin"
	"github.com/tidwall/gjson"
)

func (s *OpenAIGatewayService) sendDevinRequest(ctx context.Context, c *gin.Context, account *Account, body []byte, stream bool) (*http.Response, error) {
	req, err := devin.BuildChatRequest(ctx, body, account.GetCredential("access_token"))
	if err != nil {
		writeChatCompletionsError(c, http.StatusBadRequest, "invalid_request_error", err.Error())
		return nil, err
	}
	SetActualOpenAIUpstreamEndpoint(c, devin.DevinChatPath)
	proxyURL := ""
	if account.ProxyID != nil && account.Proxy != nil {
		proxyURL = account.Proxy.URL()
	}
	resp, err := s.httpUpstream.Do(req, proxyURL, account.ID, account.Concurrency)
	if err != nil {
		return nil, s.handleOpenAIUpstreamTransportError(ctx, c, account, err, false)
	}
	adapted, err := devin.AdaptChatResponse(resp, gjson.GetBytes(body, "model").String(), stream)
	if err != nil {
		return nil, s.handleOpenAIUpstreamTransportError(ctx, c, account, err, false)
	}
	return adapted, nil
}

func (s *AccountTestService) testDevinAccountConnection(c *gin.Context, account *Account, model, prompt string) error {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	if strings.TrimSpace(model) == "" {
		model = "swe-2"
	}
	if strings.TrimSpace(prompt) == "" {
		prompt = "Reply with OK."
	}
	s.sendEvent(c, TestEvent{Type: "test_start", Model: model})
	body, _ := json.Marshal(map[string]any{"model": account.GetMappedModel(model), "messages": []any{map[string]string{"role": "user", "content": prompt}}, "max_tokens": 128})
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()
	req, err := devin.BuildChatRequest(ctx, body, account.GetCredential("access_token"))
	if err != nil {
		return s.failDevinTest(c, err)
	}
	proxyURL := ""
	if account.ProxyID != nil && account.Proxy != nil {
		proxyURL = account.Proxy.URL()
	}
	resp, err := s.httpUpstream.Do(req, proxyURL, account.ID, account.Concurrency)
	if err != nil {
		return s.failDevinTest(c, errors.New("Devin connection failed"))
	}
	resp, err = devin.AdaptChatResponse(resp, model, false)
	if err != nil {
		return s.failDevinTest(c, err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return s.failDevinTest(c, errors.New("Devin rejected the request; check account authorization and quota"))
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return s.failDevinTest(c, err)
	}
	s.sendEvent(c, TestEvent{Type: "content", Text: gjson.GetBytes(data, "choices.0.message.content").String()})
	s.sendEvent(c, TestEvent{Type: "test_complete", Success: true})
	return nil
}

func (s *AccountTestService) failDevinTest(c *gin.Context, err error) error {
	s.sendEvent(c, TestEvent{Type: "error", Error: err.Error()})
	return err
}
