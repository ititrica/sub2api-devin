package repository

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/devin"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/service"
)

type devinOAuthClient struct{ tokenURL, profileURL string }

func NewDevinOAuthClient() service.DevinOAuthClient {
	return &devinOAuthClient{tokenURL: devin.TokenURL, profileURL: devin.ProfileURL}
}

func (s *devinOAuthClient) ExchangeCode(ctx context.Context, code, verifier, proxyURL string) (*devin.TokenInfo, error) {
	client, err := createOpenAIReqClient(proxyURL)
	if err != nil {
		return nil, infraerrors.BadRequest("DEVIN_INVALID_PROXY", "unable to configure OAuth proxy")
	}
	// The repository client is shared with other providers; configure an isolated clone.
	client = client.Clone().SetTimeout(30 * time.Second)
	defer client.GetClient().CloseIdleConnections()
	// Never forward credentials on redirects, and never return upstream bodies:
	// they can contain the authorization code, verifier, or session token.
	client.SetRedirectPolicy(func(req *http.Request, via []*http.Request) error { return http.ErrUseLastResponse })
	resp, err := client.R().SetContext(ctx).SetHeader("Accept", "application/json").SetBodyJsonMarshal(map[string]string{
		"code": code, "code_verifier": verifier,
	}).Post(s.tokenURL)
	if err != nil || resp == nil || !resp.IsSuccessState() {
		return nil, infraerrors.New(http.StatusBadGateway, "DEVIN_EXCHANGE_FAILED", "Devin token exchange failed; generate a new authorization URL and retry")
	}
	var body struct {
		Token string `json:"token"`
	}
	if len(resp.Bytes()) > 1<<20 || json.Unmarshal(resp.Bytes(), &body) != nil || body.Token == "" {
		return nil, infraerrors.New(http.StatusBadGateway, "DEVIN_INVALID_TOKEN", "Devin returned an invalid token response")
	}
	info := &devin.TokenInfo{AccessToken: devin.NormalizeToken(body.Token)}
	profile, err := client.R().SetContext(ctx).SetHeader("Authorization", "Bearer "+info.AccessToken).Get(s.profileURL)
	if err == nil && profile != nil && profile.IsSuccessState() && len(profile.Bytes()) <= 1<<20 {
		var fields struct {
			UserName string `json:"user_name"`
			UserID   string `json:"user_id"`
			OrgID    string `json:"org_id"`
		}
		if json.Unmarshal(profile.Bytes(), &fields) == nil {
			info.UserName, info.UserID, info.OrgID = fields.UserName, fields.UserID, fields.OrgID
		}
	}
	return info, nil
}
