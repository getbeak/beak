package server

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

// End-to-end test for the agent's HTTP surface — pairing handshake +
// authenticated flight + SSE stream consumption — driven from inside the
// same process. Proves the wire contract round-trips without needing the
// tray UI, a real renderer, or a subprocess.

func newRunningServer(t *testing.T) (*Server, string) {
	t.Helper()
	tokens, err := pairing.OpenTokenStoreAt(filepath.Join(t.TempDir(), "tokens.json"))
	if err != nil {
		t.Fatalf("OpenTokenStoreAt: %v", err)
	}
	srv := New(tokens, pairing.NewApprovalQueue())

	// Drain the approvals listener so handlePair's Submit doesn't block
	// the listener channel after 8 pairings. Production drains it from
	// the tray goroutine; the integration harness substitutes a no-op.
	go func() {
		for range srv.Approvals().Listen() {
			// discard
		}
	}()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	port, err := srv.ListenAndServe(ctx)
	if err != nil {
		t.Fatalf("ListenAndServe: %v", err)
	}
	t.Cleanup(func() {
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer shutdownCancel()
		_ = srv.Shutdown(shutdownCtx)
	})

	baseURL := fmt.Sprintf("http://127.0.0.1:%d", port)
	if !waitForHealthz(baseURL, 2*time.Second) {
		t.Fatal("agent did not become healthy in time")
	}
	return srv, baseURL
}

func waitForHealthz(baseURL string, deadline time.Duration) bool {
	until := time.Now().Add(deadline)
	for time.Now().Before(until) {
		resp, err := http.Get(baseURL + wire.HealthzPath)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return true
			}
		}
		time.Sleep(10 * time.Millisecond)
	}
	return false
}

func newPKCEPair(t *testing.T) (verifier, challenge string) {
	t.Helper()
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		t.Fatalf("rand: %v", err)
	}
	verifier = base64.RawURLEncoding.EncodeToString(buf)
	sum := sha256.Sum256([]byte(verifier))
	challenge = base64.RawURLEncoding.EncodeToString(sum[:])
	return
}

// pairOnce drives the full PKCE pairing handshake end-to-end:
//
//	GET /pair → POST /pair/decision → POST /pair/token
//
// and returns the issued bearer token. Mirrors what the renderer's
// services/agent/pairing.ts does.
func pairOnce(t *testing.T, baseURL, origin string) string {
	t.Helper()
	verifier, challenge := newPKCEPair(t)
	state := "state-" + fmt.Sprintf("%d", time.Now().UnixNano())
	returnURL := origin + "/agent/pair/return"

	// 1. GET /pair — stashes the pending init.
	pairURL := fmt.Sprintf(
		"%s%s?origin=%s&state=%s&code_challenge=%s&code_challenge_method=S256&return=%s",
		baseURL, wire.PairPath,
		url.QueryEscape(origin), url.QueryEscape(state),
		url.QueryEscape(challenge), url.QueryEscape(returnURL),
	)
	pairReq, err := http.NewRequest(http.MethodGet, pairURL, nil)
	if err != nil {
		t.Fatalf("pair req: %v", err)
	}
	pairReq.Header.Set("Origin", origin)
	pairResp, err := http.DefaultClient.Do(pairReq)
	if err != nil {
		t.Fatalf("GET /pair: %v", err)
	}
	pairResp.Body.Close()
	if pairResp.StatusCode != http.StatusOK {
		t.Fatalf("GET /pair status=%d", pairResp.StatusCode)
	}

	// 2. POST /pair/decision with decision=allow. No Origin header so the
	// originAllowedForDecision check is benign (same-origin form post).
	form := url.Values{"decision": {"allow"}}
	decisionURL := fmt.Sprintf("%s%s/decision?state=%s", baseURL, wire.PairPath, url.QueryEscape(state))
	decisionReq, _ := http.NewRequest(http.MethodPost, decisionURL, strings.NewReader(form.Encode()))
	decisionReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	noRedirectClient := &http.Client{
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	decisionResp, err := noRedirectClient.Do(decisionReq)
	if err != nil {
		t.Fatalf("POST /pair/decision: %v", err)
	}
	decisionResp.Body.Close()
	if decisionResp.StatusCode != http.StatusSeeOther {
		t.Fatalf("POST /pair/decision status=%d", decisionResp.StatusCode)
	}
	location := decisionResp.Header.Get("Location")
	if location == "" {
		t.Fatal("decision redirect missing Location header")
	}
	parsed, err := url.Parse(location)
	if err != nil {
		t.Fatalf("parse Location: %v", err)
	}
	code := parsed.Query().Get("code")
	if code == "" {
		t.Fatalf("redirect missing code: %s", location)
	}

	// 3. POST /pair/token — exchange the code for a bearer token.
	tokenBody, _ := json.Marshal(wire.PairTokenRequest{Code: code, CodeVerifier: verifier})
	tokenReq, _ := http.NewRequest(http.MethodPost, baseURL+wire.PairTokenPath, bytes.NewReader(tokenBody))
	tokenReq.Header.Set("Origin", origin)
	tokenReq.Header.Set("Content-Type", "application/json")
	tokenResp, err := http.DefaultClient.Do(tokenReq)
	if err != nil {
		t.Fatalf("POST /pair/token: %v", err)
	}
	defer tokenResp.Body.Close()
	if tokenResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(tokenResp.Body)
		t.Fatalf("POST /pair/token status=%d body=%s", tokenResp.StatusCode, body)
	}
	var tokenPayload wire.PairTokenResponse
	if err := json.NewDecoder(tokenResp.Body).Decode(&tokenPayload); err != nil {
		t.Fatalf("decode token response: %v", err)
	}
	if tokenPayload.Token == "" {
		t.Fatal("issued token is empty")
	}
	return tokenPayload.Token
}

// sseFrame is what one parsed SSE event looks like — the integration
// test only needs the event type and the JSON payload.
type sseFrame struct {
	Event string
	Data  json.RawMessage
}

func readSSE(t *testing.T, body io.Reader) []sseFrame {
	t.Helper()
	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	var frames []sseFrame
	var currentEvent string
	var currentData []string
	flush := func() {
		if currentEvent == "" && len(currentData) == 0 {
			return
		}
		frames = append(frames, sseFrame{
			Event: currentEvent,
			Data:  json.RawMessage(strings.Join(currentData, "\n")),
		})
		currentEvent = ""
		currentData = currentData[:0]
	}
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			flush()
			continue
		}
		switch {
		case strings.HasPrefix(line, "event:"):
			currentEvent = strings.TrimSpace(strings.TrimPrefix(line, "event:"))
		case strings.HasPrefix(line, "data:"):
			currentData = append(currentData, strings.TrimSpace(strings.TrimPrefix(line, "data:")))
		}
	}
	flush()
	return frames
}

func TestIntegration_PairThenFlight(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test")
	}
	_, baseURL := newRunningServer(t)
	const origin = "https://beak.web"

	// Upstream that the agent will forward the flight to.
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("upstream expected POST, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer upstream.Close()

	token := pairOnce(t, baseURL, origin)

	// Build the flight payload. URL is a single sink the agent
	// concatenates; for a fixed upstream we pass it as one literal.
	urlRaw, _ := json.Marshal(upstream.URL)
	bodyRaw, _ := json.Marshal(`{"hello":"world"}`)
	payload := wire.FlightRequestPayload{
		FlightID:  "flight-integration-1",
		RequestID: "req-integration-1",
		Request: wire.RequestOverview{
			Verb: "POST",
			URL:  []json.RawMessage{urlRaw},
			Body: wire.RequestBody{Type: "text", Payload: bodyRaw},
		},
	}
	raw, _ := json.Marshal(payload)

	flightReq, _ := http.NewRequest(http.MethodPost, baseURL+wire.FlightPath, bytes.NewReader(raw))
	flightReq.Header.Set("Authorization", "Bearer "+token)
	flightReq.Header.Set("Origin", origin)
	flightReq.Header.Set("Content-Type", "application/json")
	flightResp, err := http.DefaultClient.Do(flightReq)
	if err != nil {
		t.Fatalf("POST /flight: %v", err)
	}
	defer flightResp.Body.Close()

	if flightResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(flightResp.Body)
		t.Fatalf("flight status=%d body=%s", flightResp.StatusCode, body)
	}
	if ct := flightResp.Header.Get("Content-Type"); !strings.HasPrefix(ct, "text/event-stream") {
		t.Fatalf("flight content-type=%q, want text/event-stream", ct)
	}

	frames := readSSE(t, flightResp.Body)
	if len(frames) == 0 {
		t.Fatal("no SSE frames received")
	}

	// The contract says we get at least fetch_response, head_received, and
	// complete frames; reading_body is optional (depends on response body
	// shape) but should be present for our 11-byte JSON body.
	requireStage := func(stage string) sseFrame {
		for _, f := range frames {
			if f.Event == stage {
				return f
			}
		}
		t.Fatalf("expected SSE event %q; got %v", stage, frames)
		return sseFrame{}
	}
	requireStage(string(wire.StageFetchResponse))
	headFrame := requireStage(string(wire.StageHeadReceived))
	requireStage(string(wire.StageReadingBody))
	completeFrame := requireStage(string(wire.StageComplete))

	// Each heartbeat frame must carry the {flightId, stage, payload}
	// envelope the renderer expects — drop any field and the renderer's
	// flightHeartbeatSchema rejects the frame.
	var head wire.HeadReceivedHeartbeat
	if err := json.Unmarshal(headFrame.Data, &head); err != nil {
		t.Fatalf("unmarshal head: %v", err)
	}
	if head.FlightID != "flight-integration-1" {
		t.Fatalf("head flightId=%q, want flight-integration-1", head.FlightID)
	}
	if head.Stage != wire.StageHeadReceived {
		t.Fatalf("head stage=%q, want head_received", head.Stage)
	}
	if head.Payload.Status != http.StatusCreated {
		t.Fatalf("head status=%d, want 201", head.Payload.Status)
	}

	var complete wire.FlightComplete
	if err := json.Unmarshal(completeFrame.Data, &complete); err != nil {
		t.Fatalf("unmarshal complete: %v", err)
	}
	if complete.FlightID != "flight-integration-1" {
		t.Fatalf("complete flightId=%q, want flight-integration-1", complete.FlightID)
	}
	if complete.Overview.Status != http.StatusCreated {
		t.Fatalf("complete status=%d, want 201", complete.Overview.Status)
	}
	if !complete.Overview.HasBody {
		t.Fatal("complete should report HasBody=true for non-empty response")
	}
}

func TestIntegration_FlightRequiresBearer(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test")
	}
	_, baseURL := newRunningServer(t)

	payload, _ := json.Marshal(wire.FlightRequestPayload{
		FlightID:  "anon",
		RequestID: "anon",
		Request:   wire.RequestOverview{Verb: "GET", URL: []json.RawMessage{json.RawMessage(`"http://example.invalid"`)}, Body: wire.RequestBody{Type: "text", Payload: json.RawMessage(`""`)}},
	})

	req, _ := http.NewRequest(http.MethodPost, baseURL+wire.FlightPath, bytes.NewReader(payload))
	req.Header.Set("Origin", "https://beak.web")
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("flight: %v", err)
	}
	resp.Body.Close()

	// Without an Authorization header, the CORS layer rejects first
	// (origin not paired). Either 401 or 403 is acceptable here — both
	// stop the request before it reaches the requester layer.
	if resp.StatusCode != http.StatusUnauthorized && resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 401/403 without auth, got %d", resp.StatusCode)
	}
}

func TestIntegration_FlightRejectsWrongOrigin(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test")
	}
	_, baseURL := newRunningServer(t)
	token := pairOnce(t, baseURL, "https://beak.web")

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	urlRaw, _ := json.Marshal(upstream.URL)
	payload, _ := json.Marshal(wire.FlightRequestPayload{
		FlightID:  "f-wrong-origin",
		RequestID: "r-wrong-origin",
		Request: wire.RequestOverview{
			Verb: "GET",
			URL:  []json.RawMessage{urlRaw},
			Body: wire.RequestBody{Type: "text", Payload: json.RawMessage(`""`)},
		},
	})

	req, _ := http.NewRequest(http.MethodPost, baseURL+wire.FlightPath, bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	// Token is bound to beak.web; replay it from a different origin.
	req.Header.Set("Origin", "https://evil.example")
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("flight: %v", err)
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusForbidden && resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401/403 on origin replay, got %d", resp.StatusCode)
	}
}
