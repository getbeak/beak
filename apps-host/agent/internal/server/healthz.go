package server

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	applyHealthzCORS(w, r.Header.Get("Origin"))
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := wire.HealthzResponse{
		Agent:    wire.FingerprintName,
		Version:  wire.AgentSemver,
		Supports: []string{"sse", wire.ProtocolVersion},
	}

	// Optional token-keyed nonce challenge. Only applied if both nonce
	// and Authorization are present.
	nonce := r.URL.Query().Get("nonce")
	auth := r.Header.Get("Authorization")
	if nonce != "" && auth != "" {
		const prefix = "Bearer "
		if len(auth) > len(prefix) && auth[:len(prefix)] == prefix {
			rawToken := auth[len(prefix):]
			if _, ok := s.tokens.Lookup(rawToken); ok {
				mac := hmac.New(sha256.New, []byte(rawToken))
				mac.Write([]byte(nonce))
				sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
				response.Nonce = &nonce
				response.Signature = &sig
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}
