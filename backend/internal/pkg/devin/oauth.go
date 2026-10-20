package devin

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"net/url"
	"strings"
)

const (
	AuthorizeURL = "https://app.devin.ai/auth/cli/continue"
	TokenURL     = "https://api.devin.ai/auth/cli/token"
	ProfileURL   = "https://api.devin.ai/v3/self"
	TokenPrefix  = "devin-session-token$"
)

// NewSecret returns an unguessable PKCE verifier, state, or session identifier.
func NewSecret() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b[:]), nil
}

// AuthorizationURL uses Devin's manual CLI flow, so remote deployments do not
// need a listener on the administrator's loopback interface.
func AuthorizationURL(verifier, state string) string {
	sum := sha256.Sum256([]byte(verifier))
	return AuthorizeURL + "?state=" + url.QueryEscape(state) +
		"&prompt=select_account&code_challenge=" + base64.RawURLEncoding.EncodeToString(sum[:]) +
		"&code_challenge_method=S256&cli_pkce_marker=1"
}

func NormalizeToken(token string) string {
	token = strings.TrimSpace(token)
	if strings.HasPrefix(token, "eyJ") {
		return TokenPrefix + token
	}
	return token
}

// ParseAuthorizationInput accepts the manual code or a pasted callback URL.
// A callback must carry its own state; callers must compare it to the session.
func ParseAuthorizationInput(input string) (code, state string, err error) {
	input = strings.Trim(strings.TrimSpace(input), "\"'")
	if strings.Contains(input, "://") {
		u, parseErr := url.Parse(input)
		if parseErr != nil || (u.Scheme != "http" && u.Scheme != "https") {
			return "", "", errors.New("invalid callback URL")
		}
		q := u.Query()
		if q.Get("error") != "" {
			return "", "", errors.New("Devin authorization was denied")
		}
		code, state = q.Get("code"), q.Get("state")
		if state == "" {
			return "", "", errors.New("callback state is required")
		}
	} else {
		code = input
	}
	if code == "" || len(code) > 8192 || strings.ContainsAny(code, " \r\n\t") || strings.HasPrefix(code, TokenPrefix) || strings.HasPrefix(code, "eyJ") {
		return "", "", errors.New("enter a Devin authorization code")
	}
	return code, state, nil
}

type TokenInfo struct {
	AccessToken string `json:"access_token"`
	UserName    string `json:"user_name,omitempty"`
	UserID      string `json:"user_id,omitempty"`
	OrgID       string `json:"org_id,omitempty"`
}
