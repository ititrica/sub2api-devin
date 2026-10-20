package admin

import (
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type DevinOAuthHandler struct{ oauth *service.DevinOAuthService }

func NewDevinOAuthHandler(oauth *service.DevinOAuthService) *DevinOAuthHandler {
	return &DevinOAuthHandler{oauth: oauth}
}

func (h *DevinOAuthHandler) GenerateAuthURL(c *gin.Context) {
	var req struct {
		ProxyID *int64 `json:"proxy_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}
	result, err := h.oauth.GenerateAuthURL(c.Request.Context(), req.ProxyID)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	c.Header("Cache-Control", "no-store")
	response.Success(c, result)
}

func (h *DevinOAuthHandler) ExchangeCode(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id" binding:"required,max=128"`
		Code      string `json:"code" binding:"required,max=16384"`
		State     string `json:"state" binding:"required,max=128"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}
	result, err := h.oauth.ExchangeCode(c.Request.Context(), req.SessionID, req.Code, req.State)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	c.Header("Cache-Control", "no-store")
	response.Success(c, result)
}
