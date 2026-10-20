//go:build unit

package service

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"net/url"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/devin"
	"github.com/Wei-Shaw/sub2api/internal/pkg/redissession"
	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

type devinClientStub struct {
	calls           atomic.Int32
	verifier, proxy string
}

func (s *devinClientStub) ExchangeCode(_ context.Context, code, verifier, proxy string) (*devin.TokenInfo, error) {
	s.calls.Add(1)
	s.verifier, s.proxy = verifier, proxy
	return &devin.TokenInfo{AccessToken: "devin-session-token$test"}, nil
}

func newDevinServiceTest(t *testing.T) (*DevinOAuthService, *devinClientStub, *miniredis.Miniredis) {
	t.Helper()
	r := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: r.Addr()})
	t.Cleanup(func() { _ = client.Close() })
	stub := &devinClientStub{}
	return NewDevinOAuthService(nil, stub, redissession.New(client, "test:devin", DevinOAuthSessionTTL)), stub, r
}

func TestDevinOAuthPKCEStateAndSingleUseAcrossInstances(t *testing.T) {
	s, client, _ := newDevinServiceTest(t)
	ctx := context.Background()
	session, err := s.GenerateAuthURL(ctx, nil)
	require.NoError(t, err)
	u, err := url.Parse(session.AuthURL)
	require.NoError(t, err)
	require.Equal(t, "app.devin.ai", u.Host)
	require.Equal(t, "1", u.Query().Get("cli_pkce_marker"))
	require.Empty(t, u.Query().Get("redirect_uri"))
	_, err = s.ExchangeCode(ctx, session.SessionID, "test-code", "wrong")
	require.Error(t, err)
	_, err = s.ExchangeCode(ctx, session.SessionID, "http://127.0.0.1/callback?code=test&state=wrong", session.State)
	require.Error(t, err)
	_, err = s.ExchangeCode(ctx, session.SessionID, "http://127.0.0.1/callback?code=test", session.State)
	require.Error(t, err)
	require.Equal(t, int32(0), client.calls.Load())
	// Two service instances sharing the Redis backend cannot redeem a session twice.
	s2 := NewDevinOAuthService(nil, client, s.sessions)
	var wg sync.WaitGroup
	var successes atomic.Int32
	for i := 0; i < 12; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			service := s
			if i%2 == 0 {
				service = s2
			}
			if _, err := service.ExchangeCode(ctx, session.SessionID, "test-code", session.State); err == nil {
				successes.Add(1)
			}
		}(i)
	}
	wg.Wait()
	require.Equal(t, int32(1), successes.Load())
	require.Equal(t, int32(1), client.calls.Load())
	hash := sha256.Sum256([]byte(client.verifier))
	require.Equal(t, base64.RawURLEncoding.EncodeToString(hash[:]), u.Query().Get("code_challenge"))
	require.NotContains(t, session.AuthURL, client.verifier)
}

func TestDevinOAuthExpiryAndStorageFailure(t *testing.T) {
	s, client, r := newDevinServiceTest(t)
	ctx := context.Background()
	session, err := s.GenerateAuthURL(ctx, nil)
	require.NoError(t, err)
	r.FastForward(11 * time.Minute)
	_, err = s.ExchangeCode(ctx, session.SessionID, "code", session.State)
	require.Error(t, err)
	require.Equal(t, int32(0), client.calls.Load())
	s.sessions = redissession.New(nil, "test", time.Minute)
	_, err = s.GenerateAuthURL(ctx, nil)
	require.ErrorContains(t, err, "unavailable")
}
