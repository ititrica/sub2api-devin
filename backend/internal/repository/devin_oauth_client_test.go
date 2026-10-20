package repository

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDevinOAuthExchangeAndProfile(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/token":
			require.Equal(t, "POST", r.Method)
			var body map[string]string
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			require.Equal(t, map[string]string{"code": "code", "code_verifier": "verifier"}, body)
			_, _ = w.Write([]byte(`{"token":"eyJ.test.token"}`))
		case "/self":
			require.Equal(t, "Bearer devin-session-token$eyJ.test.token", r.Header.Get("Authorization"))
			_, _ = w.Write([]byte(`{"user_name":"test","user_id":"u1","org_id":"o1"}`))
		}
	}))
	defer server.Close()
	client := devinOAuthClient{tokenURL: server.URL + "/token", profileURL: server.URL + "/self"}
	info, err := client.ExchangeCode(context.Background(), "code", "verifier", "")
	require.NoError(t, err)
	require.Equal(t, "devin-session-token$eyJ.test.token", info.AccessToken)
	require.Equal(t, "u1", info.UserID)
}

func TestDevinOAuthErrorsAndRedirectsAreRedacted(t *testing.T) {
	for _, status := range []int{400, 500, 302} {
		t.Run(http.StatusText(status), func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Location", "/leak")
				w.WriteHeader(status)
				_, _ = w.Write([]byte("secret-verifier"))
			}))
			defer server.Close()
			client := devinOAuthClient{tokenURL: server.URL, profileURL: server.URL}
			_, err := client.ExchangeCode(context.Background(), "secret-code", "secret-verifier", "")
			require.Error(t, err)
			require.NotContains(t, err.Error(), "secret")
		})
	}
}
