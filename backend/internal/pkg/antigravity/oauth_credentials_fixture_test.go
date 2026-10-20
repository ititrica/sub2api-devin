//go:build unit

package antigravity

import (
	"os"
	"testing"
)

// Unit tests use synthetic credentials, never the operator's real OAuth keys.
func TestMain(m *testing.M) {
	ClientID = "test-antigravity-client-id"
	defaultClientSecret = "test-antigravity-client-secret"
	os.Exit(m.Run())
}
