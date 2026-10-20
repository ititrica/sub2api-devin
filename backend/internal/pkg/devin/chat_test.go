package devin

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/binary"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
	"google.golang.org/protobuf/encoding/protowire"
)

func strField(n protowire.Number, value string) []byte {
	return protowire.AppendString(protowire.AppendTag(nil, n, protowire.BytesType), value)
}
func intField(n protowire.Number, value uint64) []byte {
	return protowire.AppendVarint(protowire.AppendTag(nil, n, protowire.VarintType), value)
}
func frame(fields ...[]byte) []byte { return WrapConnectEnvelope(bytes.Join(fields, nil)) }
func eos() []byte {
	return WrapConnectEnvelopeWithFlag(ConnectFlagEndStream, []byte(`{"metadata":{}}`))
}
func testResponse(data []byte) *http.Response {
	return &http.Response{StatusCode: 200, Header: http.Header{}, Body: io.NopCloser(bytes.NewReader(data))}
}
func fieldString(t *testing.T, data []byte, target protowire.Number) string {
	t.Helper()
	for len(data) > 0 {
		n, typ, size := protowire.ConsumeTag(data)
		require.Greater(t, size, 0)
		data = data[size:]
		if n == target && typ == protowire.BytesType {
			v, k := protowire.ConsumeString(data)
			require.Greater(t, k, 0)
			return v
		}
		k := protowire.ConsumeFieldValue(n, typ, data)
		require.Greater(t, k, 0)
		data = data[k:]
	}
	return ""
}

func TestDevinBuildRequestPreservesSystemToolsAndModel(t *testing.T) {
	body := []byte(`{"model":"swe-2","messages":[{"role":"system","content":"Keep this exact instruction."},{"role":"user","content":"test"},{"role":"assistant","tool_calls":[{"id":"call_1","type":"function","function":{"name":"lookup","arguments":"{}"}}]},{"role":"tool","tool_call_id":"call_1","content":"ok"}],"tools":[{"type":"function","function":{"name":"lookup","description":"do not rewrite","parameters":{"type":"object"}}}]}`)
	req, err := BuildChatRequest(context.Background(), body, "eyJ.test.token")
	require.NoError(t, err)
	require.Equal(t, DevinDefaultBaseURL+DevinChatPath, req.URL.String())
	require.Equal(t, "Basic devin-session-token$eyJ.test.token-devin-session-token$eyJ.test.token", req.Header.Get("Authorization"))
	require.Equal(t, "application/connect+proto", req.Header.Get("Content-Type"))
	_, payload, err := ReadConnectFrame(req.Body)
	require.NoError(t, err)
	require.Equal(t, "Keep this exact instruction.", fieldString(t, payload, 2))
	require.Equal(t, "swe-2-high", fieldString(t, payload, 21))
	require.Contains(t, string(payload), "call_1")
	require.Contains(t, string(payload), "do not rewrite")
	require.Equal(t, "devin-session-token$eyJ.test.token", fieldString(t, []byte(fieldString(t, payload, 1)), 3))
}

func TestDevinRejectUnsupportedPayloadBeforeNetwork(t *testing.T) {
	for _, body := range []string{
		`{"model":"swe-2","messages":[{"role":"user","content":[{"type":"image_url","image_url":{"url":"http://127.0.0.1/secret"}}]}]}`,
		`{"model":"swe-2","messages":[{"role":"user","content":[{"type":"input_audio"}]}]}`,
		`{"model":"swe-2","messages":[{"role":"user","content":"hi"}],"n":2}`,
		`{"model":"swe-2","messages":[{"role":"user","content":"hi"}],"tool_choice":"required"}`,
	} {
		_, err := BuildChatRequest(context.Background(), []byte(body), "token")
		require.Error(t, err)
	}
}

func TestDevinChatResponseTextToolsUsageAndUTF8(t *testing.T) {
	usage := bytes.Join([][]byte{intField(2, 10), intField(3, 4), intField(4, 2), intField(5, 3)}, nil)
	data := bytes.Join([][]byte{
		frame(strField(3, string([]byte{0xe4, 0xbd})), strField(9, "reason")),
		frame(strField(3, string([]byte{0xa0}))),
		frame(strField(6, string(bytes.Join([][]byte{strField(1, "call_1"), strField(2, "lookup"), strField(4, `{"q":`)}, nil)))),
		frame(strField(6, string(strField(4, `"x"}`))), strField(7, string(usage)), intField(5, 10)), eos(),
	}, nil)
	for _, stream := range []bool{false, true} {
		resp, err := AdaptChatResponse(testResponse(data), "swe-2", stream)
		require.NoError(t, err)
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		if stream {
			require.Contains(t, string(body), "你")
			require.Contains(t, string(body), `"finish_reason":"tool_calls"`)
			require.Contains(t, string(body), `"prompt_tokens":13`)
			require.Contains(t, string(body), "data: [DONE]")
		} else {
			require.True(t, json.Valid(body))
			require.Equal(t, "你", gjson.GetBytes(body, "choices.0.message.content").String())
			require.Equal(t, `{"q":"x"}`, gjson.GetBytes(body, "choices.0.message.tool_calls.0.function.arguments").String())
			require.Equal(t, int64(13), gjson.GetBytes(body, "usage.prompt_tokens").Int())
			require.Equal(t, int64(3), gjson.GetBytes(body, "usage.prompt_tokens_details.cached_tokens").Int())
		}
	}
}

func TestDevinErrorsNeverCompleteOrLeakUpstreamSecrets(t *testing.T) {
	trailer := WrapConnectEnvelopeWithFlag(ConnectFlagEndStream, []byte(`{"error":{"code":"resource_exhausted","message":"secret-token"}}`))
	resp, err := AdaptChatResponse(testResponse(trailer), "swe-2", true)
	require.NoError(t, err)
	require.Equal(t, 429, resp.StatusCode)
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	require.NotContains(t, string(body), "secret-token")
	for _, ending := range [][]byte{nil, trailer, WrapConnectEnvelopeWithFlag(ConnectFlagEndStream, []byte(`invalid`))} {
		data := append(frame(strField(3, "partial")), ending...)
		resp, err := AdaptChatResponse(testResponse(data), "swe-2", true)
		require.NoError(t, err)
		body, err := io.ReadAll(resp.Body)
		require.Error(t, err)
		_ = resp.Body.Close()
		require.NotContains(t, string(body), "[DONE]")
		require.NotContains(t, err.Error(), "secret-token")
	}
}

func TestDevinConnectFrameLimitsAndCompression(t *testing.T) {
	var gz bytes.Buffer
	w := gzip.NewWriter(&gz)
	_, err := w.Write(strField(3, "hello"))
	require.NoError(t, err)
	require.NoError(t, w.Close())
	_, payload, err := ReadConnectFrame(bytes.NewReader(WrapConnectEnvelopeWithFlag(ConnectFlagCompressed, gz.Bytes())))
	require.NoError(t, err)
	require.Equal(t, "hello", fieldString(t, payload, 3))
	header := make([]byte, 5)
	binary.BigEndian.PutUint32(header[1:], maxConnectFrameSize+1)
	_, _, err = ReadConnectFrame(bytes.NewReader(header))
	require.ErrorContains(t, err, "exceeds")
	_, _, err = ReadConnectFrame(strings.NewReader("\x04\x00\x00\x00\x00"))
	require.Error(t, err)
}
