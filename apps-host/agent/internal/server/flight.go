package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/getbeak/beak/apps-host/agent/internal/requester"
	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

func (s *Server) handleFlight(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	pairedOrigins := s.tokens.PairedOrigins()
	corsOk := applyAuthenticatedCORS(w, origin, pairedOrigins)
	if r.Method == http.MethodOptions {
		if !corsOk {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !corsOk {
		// Even non-preflight requests respect the origin gate — the
		// browser would have failed CORS anyway, but a non-browser
		// client should still see 403.
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	tokenRec, ok := s.authoriseRequest(r, origin)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var payload wire.FlightRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if payload.FlightID == "" || payload.RequestID == "" {
		http.Error(w, "missing flightId/requestId", http.StatusBadRequest)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	emit := &sseEmitter{w: w, flusher: flusher, flightID: payload.FlightID}
	requester.Run(r.Context(), requester.Options{
		Payload: payload,
		Emitter: emit,
	})

	// Touch the token record's lastUsedAt once per flight; debouncing
	// finer than this isn't worth the lock contention for a tool that
	// fires a handful of requests per minute.
	if tokenRec.TokenID != "" {
		s.touchLastUsedDebounced(tokenRec.TokenID)
	}
}

// authoriseRequest extracts the bearer token, validates the hash,
// and checks the request's Origin matches the bound origin. Returns
// the matching record or (zero, false).
func (s *Server) authoriseRequest(r *http.Request, origin string) (record TokenRec, ok bool) {
	auth := r.Header.Get("Authorization")
	const prefix = "Bearer "
	if len(auth) <= len(prefix) || auth[:len(prefix)] != prefix {
		return TokenRec{}, false
	}
	raw := auth[len(prefix):]
	rec, found := s.tokens.Lookup(raw)
	if !found {
		return TokenRec{}, false
	}
	if rec.Origin != origin {
		return TokenRec{}, false
	}
	return TokenRec{TokenID: rec.TokenID, Origin: rec.Origin}, true
}

// TokenRec is the minimal record passed back from authoriseRequest.
// Kept distinct from pairing.TokenRecord so the server doesn't leak
// the hash/timestamps into log lines.
type TokenRec struct {
	TokenID string
	Origin  string
}

type sseEmitter struct {
	w        http.ResponseWriter
	flusher  http.Flusher
	flightID string
}

// heartbeatEnvelope is the JSON shape every heartbeat frame uses on the
// SSE `data:` line. The renderer's flightHeartbeatSchema (Zod) is a
// discriminated union over `stage` keyed on this envelope — drop any of
// the three top-level fields and the renderer rejects the frame.
type heartbeatEnvelope struct {
	FlightID string              `json:"flightId"`
	Stage    wire.HeartbeatStage `json:"stage"`
	Payload  any                 `json:"payload"`
}

func (e *sseEmitter) Heartbeat(stage wire.HeartbeatStage, payload any) {
	e.writeEvent(string(stage), heartbeatEnvelope{
		FlightID: e.flightID,
		Stage:    stage,
		Payload:  payload,
	})
}

func (e *sseEmitter) Complete(payload wire.FlightComplete) {
	e.writeEvent(string(wire.StageComplete), payload)
}

func (e *sseEmitter) Failed(payload wire.FlightFailed) {
	e.writeEvent(string(wire.StageFailed), payload)
}

func (e *sseEmitter) writeEvent(eventType string, payload any) {
	data, err := json.Marshal(payload)
	if err != nil {
		// Should never happen with the wire types; if it does, surface
		// it as a failed event so the renderer at least sees something.
		fallback, _ := json.Marshal(wire.FlightFailedError{Message: fmt.Sprintf("marshal failure: %v", err)})
		_, _ = fmt.Fprintf(e.w, "event: failed\ndata: %s\n\n", fallback)
		e.flusher.Flush()
		return
	}
	if _, err := fmt.Fprintf(e.w, "event: %s\ndata: %s\n\n", eventType, data); err != nil {
		return
	}
	e.flusher.Flush()
}
