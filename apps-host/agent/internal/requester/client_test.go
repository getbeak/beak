package requester

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

// captureEmitter records every emitted event so a test can assert
// the wire-level outcome of a Run call.
type captureEmitter struct {
	mu        sync.Mutex
	heartbeats []wire.HeartbeatStage
	completes []wire.FlightComplete
	failures  []wire.FlightFailed
}

func (c *captureEmitter) Heartbeat(stage wire.HeartbeatStage, _ any) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.heartbeats = append(c.heartbeats, stage)
}

func (c *captureEmitter) Complete(p wire.FlightComplete) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.completes = append(c.completes, p)
}

func (c *captureEmitter) Failed(p wire.FlightFailed) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.failures = append(c.failures, p)
}

func mustRawJSON(t *testing.T, v any) json.RawMessage {
	t.Helper()
	raw, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return raw
}

func TestRun_HonoursOptionsTimeoutMs(t *testing.T) {
	// Upstream sleeps well past the timeout — Run must cancel the
	// request and surface a FlightFailed with the timeout message.
	slow := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-time.After(2 * time.Second):
			w.WriteHeader(http.StatusOK)
		case <-r.Context().Done():
			// Client (us) cancelled — return silently.
		}
	}))
	defer slow.Close()

	emit := &captureEmitter{}
	payload := wire.FlightRequestPayload{
		FlightID:  "flight-timeout",
		RequestID: "req-1",
		Request: wire.RequestOverview{
			Verb: "GET",
			URL:  []json.RawMessage{mustRawJSON(t, slow.URL)},
			Body: wire.RequestBody{Type: "text", Payload: mustRawJSON(t, "")},
			Options: map[string]json.RawMessage{
				"timeoutMs": mustRawJSON(t, 50),
			},
		},
	}

	start := time.Now()
	Run(context.Background(), Options{Payload: payload, Emitter: emit})
	elapsed := time.Since(start)

	if elapsed > 1*time.Second {
		t.Fatalf("Run should have returned well before the upstream sleep finished; took %v", elapsed)
	}
	if len(emit.failures) != 1 {
		t.Fatalf("expected exactly one FlightFailed event, got %d (completes=%d)", len(emit.failures), len(emit.completes))
	}
	msg := emit.failures[0].Error.Message
	if !strings.Contains(msg, "upstream timeout") {
		t.Fatalf("expected message to mention upstream timeout, got %q", msg)
	}
	if !strings.Contains(msg, "50") {
		t.Fatalf("expected message to include the configured ms value, got %q", msg)
	}
	if emit.failures[0].FlightID != "flight-timeout" {
		t.Fatalf("expected FlightID propagated to failure, got %q", emit.failures[0].FlightID)
	}
}

func TestRun_NoTimeoutMsLeavesContextOpen(t *testing.T) {
	// Sanity: when no timeoutMs is supplied, the request completes
	// normally even after a brief upstream delay.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		time.Sleep(20 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer srv.Close()

	emit := &captureEmitter{}
	payload := wire.FlightRequestPayload{
		FlightID:  "flight-nominal",
		RequestID: "req-2",
		Request: wire.RequestOverview{
			Verb: "GET",
			URL:  []json.RawMessage{mustRawJSON(t, srv.URL)},
			Body: wire.RequestBody{Type: "text", Payload: mustRawJSON(t, "")},
		},
	}

	Run(context.Background(), Options{Payload: payload, Emitter: emit})

	if len(emit.failures) != 0 {
		t.Fatalf("expected no failures with no timeoutMs, got %d (msg=%q)", len(emit.failures), emit.failures[0].Error.Message)
	}
	if len(emit.completes) != 1 {
		t.Fatalf("expected exactly one Complete event, got %d", len(emit.completes))
	}
}

func TestRequestTimeout_Parsing(t *testing.T) {
	tests := []struct {
		name      string
		input     map[string]json.RawMessage
		wantDur   time.Duration
		wantError bool
	}{
		{
			name:    "absent",
			input:   nil,
			wantDur: 0,
		},
		{
			name:    "explicit null",
			input:   map[string]json.RawMessage{"timeoutMs": json.RawMessage("null")},
			wantDur: 0,
		},
		{
			name:    "zero ignored",
			input:   map[string]json.RawMessage{"timeoutMs": json.RawMessage("0")},
			wantDur: 0,
		},
		{
			name:    "negative ignored",
			input:   map[string]json.RawMessage{"timeoutMs": json.RawMessage("-100")},
			wantDur: 0,
		},
		{
			name:    "valid millisecond value",
			input:   map[string]json.RawMessage{"timeoutMs": json.RawMessage("250")},
			wantDur: 250 * time.Millisecond,
		},
		{
			name:    "capped at max",
			input:   map[string]json.RawMessage{"timeoutMs": json.RawMessage("3600000")}, // 1h asked
			wantDur: 10 * time.Minute,
		},
		{
			name:      "malformed string",
			input:     map[string]json.RawMessage{"timeoutMs": json.RawMessage(`"not-a-number"`)},
			wantError: true,
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, malformed := requestTimeout(tc.input)
			if malformed != tc.wantError {
				t.Fatalf("malformed=%v want %v", malformed, tc.wantError)
			}
			if got != tc.wantDur {
				t.Fatalf("duration=%v want %v", got, tc.wantDur)
			}
		})
	}
}
