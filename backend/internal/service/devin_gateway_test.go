//go:build unit

package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/pkg/devin"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/encoding/protowire"
)

func TestDevinGatewayAllProtocols(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, stream := range []bool{false, true} {
		for _, protocol := range []string{"chat", "responses", "messages"} {
			t.Run(fmt.Sprintf("%s/stream=%v", protocol, stream), func(t *testing.T) {
				var body []byte
				switch protocol {
				case "chat":
					body = []byte(fmt.Sprintf(`{"model":"swe-2","messages":[{"role":"user","content":"hello"}],"stream":%v}`, stream))
				case "responses":
					body = []byte(fmt.Sprintf(`{"model":"swe-2","input":"hello","stream":%v}`, stream))
				case "messages":
					body = []byte(fmt.Sprintf(`{"model":"swe-2","max_tokens":128,"messages":[{"role":"user","content":"hello"}],"stream":%v}`, stream))
				}
				text := protowire.AppendString(protowire.AppendTag(nil, 3, protowire.BytesType), "hello from Devin")
				usage := protowire.AppendVarint(protowire.AppendTag(nil, 2, protowire.VarintType), 10)
				usage = protowire.AppendVarint(protowire.AppendTag(usage, 3, protowire.VarintType), 4)
				text = protowire.AppendBytes(protowire.AppendTag(text, 7, protowire.BytesType), usage)
				wire := append(devin.WrapConnectEnvelope(text), devin.WrapConnectEnvelopeWithFlag(devin.ConnectFlagEndStream, []byte(`{}`))...)
				upstream := &httpUpstreamRecorder{resp: &http.Response{StatusCode: 200, Header: http.Header{"Content-Type": []string{"application/connect+proto"}}, Body: io.NopCloser(bytes.NewReader(wire))}}
				svc := &OpenAIGatewayService{cfg: rawChatCompletionsTestConfig(), httpUpstream: upstream}
				account := &Account{ID: 1, Platform: PlatformDevin, Type: AccountTypeOAuth, Concurrency: 1, Credentials: map[string]any{"access_token": "devin-session-token$test"}}
				rec := httptest.NewRecorder()
				c, _ := gin.CreateTestContext(rec)
				c.Request = httptest.NewRequest("POST", "/v1/"+protocol, bytes.NewReader(body))
				var result *OpenAIForwardResult
				var err error
				switch protocol {
				case "chat":
					result, err = svc.ForwardAsChatCompletions(context.Background(), c, account, body, "", "")
				case "responses":
					result, err = svc.Forward(context.Background(), c, account, body)
				case "messages":
					result, err = svc.ForwardAsAnthropic(context.Background(), c, account, body, "", "")
				}
				require.NoError(t, err, rec.Body.String())
				require.NotNil(t, result)
				require.Equal(t, 10, result.Usage.InputTokens)
				require.Equal(t, 4, result.Usage.OutputTokens)
				require.Equal(t, "server.codeium.com", upstream.lastReq.URL.Host)
				require.Equal(t, devin.DevinChatPath, upstream.lastReq.URL.Path)
				require.Contains(t, rec.Body.String(), "hello from Devin")
				require.NotContains(t, rec.Body.String(), "devin-session-token")
			})
		}
	}
}

func TestDevinRejectsServerSideHistoryBeforeUpstream(t *testing.T) {
	gin.SetMode(gin.TestMode)
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest("POST", "/v1/responses", nil)
	svc := &OpenAIGatewayService{}
	_, err := svc.Forward(context.Background(), c, &Account{Platform: PlatformDevin}, []byte(`{"model":"swe-2","input":"hi","previous_response_id":"resp_old"}`))
	require.ErrorContains(t, err, "full conversation history")
	require.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestDevinAccountProbeUsesNativeRPCAndSSE(t *testing.T) {
	gin.SetMode(gin.TestMode)
	text := protowire.AppendString(protowire.AppendTag(nil, 3, protowire.BytesType), "OK")
	wire := append(devin.WrapConnectEnvelope(text), devin.WrapConnectEnvelopeWithFlag(devin.ConnectFlagEndStream, []byte(`{}`))...)
	upstream := &httpUpstreamRecorder{resp: &http.Response{StatusCode: 200, Header: http.Header{}, Body: io.NopCloser(bytes.NewReader(wire))}}
	svc := &AccountTestService{httpUpstream: upstream}
	account := &Account{ID: 1, Platform: PlatformDevin, Type: AccountTypeOAuth, Concurrency: 1, Credentials: map[string]any{"access_token": "devin-session-token$test"}}
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest("POST", "/test", nil)
	require.NoError(t, svc.testDevinAccountConnection(c, account, "", ""))
	require.Equal(t, "text/event-stream", rec.Header().Get("Content-Type"))
	require.Contains(t, rec.Body.String(), `"success":true`)
	require.Contains(t, rec.Body.String(), `"text":"OK"`)
	require.Equal(t, devin.DevinChatPath, upstream.lastReq.URL.Path)
}
