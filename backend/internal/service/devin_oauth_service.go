package service

import (
	"context"
	"crypto/subtle"
	"net/http"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/devin"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

const DevinOAuthSessionTTL = 10 * time.Minute

type DevinOAuthClient interface {
	ExchangeCode(context.Context, string, string, string) (*devin.TokenInfo, error)
}

// Shared storage gives multi-instance deployments the same single-use semantics.
type DevinOAuthSessionStore interface {
	Set(context.Context, string, any) error
	Get(context.Context, string, any) (bool, error)
	TryConsume(context.Context, string) (bool, error)
}

type DevinOAuthService struct {
	proxyRepo ProxyRepository
	client    DevinOAuthClient
	sessions  DevinOAuthSessionStore
}

func NewDevinOAuthService(proxyRepo ProxyRepository, client DevinOAuthClient, sessions DevinOAuthSessionStore) *DevinOAuthService {
	return &DevinOAuthService{proxyRepo: proxyRepo, client: client, sessions: sessions}
}

type devinOAuthSession struct {
	State     string    `json:"state"`
	Verifier  string    `json:"verifier"`
	ProxyURL  string    `json:"proxy_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type DevinAuthURLResult struct {
	AuthURL   string `json:"auth_url"`
	SessionID string `json:"session_id"`
	State     string `json:"state"`
}

func (s *DevinOAuthService) GenerateAuthURL(ctx context.Context, proxyID *int64) (*DevinAuthURLResult, error) {
	proxyURL := ""
	if proxyID != nil {
		if *proxyID <= 0 {
			return nil, infraerrors.BadRequest("DEVIN_INVALID_PROXY", "invalid proxy ID")
		}
		proxy, err := s.proxyRepo.GetByID(ctx, *proxyID)
		if err != nil {
			return nil, err
		}
		if proxy == nil {
			return nil, ErrProxyNotFound
		}
		proxyURL = proxy.URL()
	}
	state, err := devin.NewSecret()
	if err != nil {
		return nil, err
	}
	verifier, err := devin.NewSecret()
	if err != nil {
		return nil, err
	}
	id, err := devin.NewSecret()
	if err != nil {
		return nil, err
	}
	session := devinOAuthSession{State: state, Verifier: verifier, ProxyURL: proxyURL, CreatedAt: time.Now()}
	if err := s.sessions.Set(ctx, id, session); err != nil {
		return nil, infraerrors.New(http.StatusServiceUnavailable, "DEVIN_SESSION_UNAVAILABLE", "OAuth session storage is unavailable")
	}
	return &DevinAuthURLResult{AuthURL: devin.AuthorizationURL(verifier, state), SessionID: id, State: state}, nil
}

func (s *DevinOAuthService) ExchangeCode(ctx context.Context, sessionID, input, state string) (*devin.TokenInfo, error) {
	var session devinOAuthSession
	ok, err := s.sessions.Get(ctx, sessionID, &session)
	if err != nil {
		return nil, infraerrors.New(http.StatusServiceUnavailable, "DEVIN_SESSION_UNAVAILABLE", "OAuth session storage is unavailable")
	}
	if !ok || time.Since(session.CreatedAt) >= DevinOAuthSessionTTL {
		return nil, infraerrors.BadRequest("DEVIN_SESSION_EXPIRED", "OAuth session expired; generate a new authorization URL")
	}
	code, callbackState, err := devin.ParseAuthorizationInput(input)
	if err != nil {
		return nil, infraerrors.BadRequest("DEVIN_INVALID_CODE", err.Error())
	}
	if subtle.ConstantTimeCompare([]byte(state), []byte(session.State)) != 1 ||
		(callbackState != "" && subtle.ConstantTimeCompare([]byte(callbackState), []byte(session.State)) != 1) {
		return nil, infraerrors.BadRequest("DEVIN_INVALID_STATE", "OAuth state does not match")
	}
	ok, err = s.sessions.TryConsume(ctx, sessionID)
	if err != nil {
		return nil, infraerrors.New(http.StatusServiceUnavailable, "DEVIN_SESSION_UNAVAILABLE", "OAuth session storage is unavailable")
	}
	if !ok {
		return nil, infraerrors.BadRequest("DEVIN_SESSION_USED", "OAuth session was already used; generate a new authorization URL")
	}
	// Keep the consumed marker until TTL expiry, including when upstream fails.
	return s.client.ExchangeCode(ctx, code, session.Verifier, session.ProxyURL)
}
