package requester

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

// Emitter is the callback surface the HTTP /flight handler implements
// so that the requester can stream typed heartbeats without knowing
// about SSE framing.
type Emitter interface {
	Heartbeat(stage wire.HeartbeatStage, data any)
	Complete(payload wire.FlightComplete)
	Failed(payload wire.FlightFailed)
}

type Options struct {
	Payload  wire.FlightRequestPayload
	Emitter  Emitter
	Client   *http.Client // optional; defaults to http.DefaultClient with a longer-than-default timeout
}

// Verbs that don't carry a request body per RFC 9110. Matches the
// renderer-side `requestAllowsBody` and the Node requester.
var bodyFreeVerbs = map[string]struct{}{
	"GET":     {},
	"HEAD":    {},
	"OPTIONS": {},
}

// maxRequestTimeout caps the user-supplied options.timeoutMs to keep a
// runaway config from pinning a goroutine + connection indefinitely.
const maxRequestTimeout = 10 * time.Minute

func Run(ctx context.Context, opts Options) {
	overview := opts.Payload.Request
	emit := opts.Emitter
	flightID := opts.Payload.FlightID

	emit.Heartbeat(wire.StageFetchResponse, wire.FetchResponsePayload{Timestamp: time.Now().UnixMilli()})

	// Honour options.timeoutMs by deriving a deadline-bearing context.
	// The http.Client.Timeout knob is intentionally 0 so that streamed
	// responses (SSE, chunked) can run as long as the renderer holds
	// the connection open — per-request bounds belong on the context.
	timeout, timedOut := requestTimeout(overview.Options)
	if timedOut {
		emit.Failed(wire.FlightFailed{FlightID: flightID, Error: wire.FlightFailedError{Message: "invalid options.timeoutMs"}})
		return
	}
	var cancel context.CancelFunc
	if timeout > 0 {
		ctx, cancel = context.WithTimeout(ctx, timeout)
		defer cancel()
	}

	req, err := buildRequest(ctx, overview)
	if err != nil {
		emit.Failed(wire.FlightFailed{FlightID: flightID, Error: wire.FlightFailedError{Message: err.Error()}})
		return
	}

	client := opts.Client
	if client == nil {
		client = &http.Client{
			Timeout: 0, // streamed responses can run indefinitely; per-flight bounds live on the request context.
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse // mirror the browser's "manual" redirect mode
			},
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		// Distinguish "client disconnected" (silent) from "upstream
		// timed out" (visible) — same handling as the read-loop below.
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			emit.Failed(wire.FlightFailed{FlightID: flightID, Error: wire.FlightFailedError{Message: fmt.Sprintf("upstream timeout after %d ms", timeout.Milliseconds())}})
			return
		}
		if ctx.Err() != nil {
			return
		}
		emit.Failed(wire.FlightFailed{FlightID: flightID, Error: wire.FlightFailedError{Message: err.Error()}})
		return
	}
	defer resp.Body.Close()

	headers := headersToMap(resp.Header)
	contentType := resp.Header.Get("Content-Type")
	contentLength := 0
	if cl, err := strconv.Atoi(resp.Header.Get("Content-Length")); err == nil {
		contentLength = cl
	}
	streamKind := classifyStream(contentType, resp.Header.Get("Transfer-Encoding"))

	var ctPtr *string
	if contentType != "" {
		v := contentType
		ctPtr = &v
	}

	emit.Heartbeat(wire.StageHeadReceived, wire.HeadReceivedPayload{
		Timestamp:     time.Now().UnixMilli(),
		Status:        resp.StatusCode,
		Headers:       headers,
		URL:           resp.Request.URL.String(),
		Redirected:    resp.Request.URL.String() != reqURL(overview),
		ContentType:   ctPtr,
		ContentLength: contentLength,
		StreamKind:    streamKind,
	})

	hasBody := contentLength > 0
	var sseParser *SseParser
	if streamKind == "sse" {
		sseParser = NewSseParser()
	}

	buf := make([]byte, 64*1024)
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			hasBody = true
			chunk := append([]byte(nil), buf[:n]...)
			emit.Heartbeat(wire.StageReadingBody, wire.ReadingBodyPayload{
				Timestamp: time.Now().UnixMilli(),
				Buffer:    base64.StdEncoding.EncodeToString(chunk),
			})
			if sseParser != nil {
				for _, ev := range sseParser.Push(chunk) {
					emit.Heartbeat(wire.StageSseEvent, wire.SseEventPayload{
						Timestamp: time.Now().UnixMilli(),
						Event:     sseEventToWire(ev),
					})
				}
			}
		}
		if readErr != nil {
			if errors.Is(readErr, io.EOF) {
				break
			}
			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				// Upstream took too long — surface as a failure so the
				// renderer can show a meaningful message rather than a
				// dangling flight.
				emit.Failed(wire.FlightFailed{FlightID: flightID, Error: wire.FlightFailedError{Message: fmt.Sprintf("upstream timeout after %d ms", timeout.Milliseconds())}})
				return
			}
			if ctx.Err() != nil {
				// Client disconnected; quietly stop without emitting failure.
				return
			}
			emit.Failed(wire.FlightFailed{FlightID: flightID, Error: wire.FlightFailedError{Message: readErr.Error()}})
			return
		}
	}

	if sseParser != nil {
		for _, ev := range sseParser.Flush() {
			emit.Heartbeat(wire.StageSseEvent, wire.SseEventPayload{
				Timestamp: time.Now().UnixMilli(),
				Event:     sseEventToWire(ev),
			})
		}
	}

	emit.Complete(wire.FlightComplete{
		FlightID:  flightID,
		Timestamp: time.Now().UnixMilli(),
		Overview: wire.FlightCompleteOverview{
			Headers:    headers,
			Redirected: false,
			Status:     resp.StatusCode,
			URL:        resp.Request.URL.String(),
			HasBody:    hasBody,
		},
	})
}

func buildRequest(ctx context.Context, overview wire.RequestOverview) (*http.Request, error) {
	url := reqURL(overview)
	if url == "" {
		return nil, errors.New("missing request url")
	}

	verb := strings.ToUpper(overview.Verb)
	var body io.Reader
	if _, isBodyFree := bodyFreeVerbs[verb]; !isBodyFree {
		switch overview.Body.Type {
		case "text", "json_raw":
			// Payload is a JSON-encoded string; unmarshal to plain string.
			var s string
			if err := json.Unmarshal(overview.Body.Payload, &s); err != nil {
				return nil, fmt.Errorf("invalid %s body: %w", overview.Body.Type, err)
			}
			body = bytes.NewReader([]byte(s))
		case "file":
			// File bodies in v1 are passed inline as base64 via the
			// `__hacky__binaryFileData` field — same as @beak/requester-node.
			// Decoded server-side and shipped as the request body.
			var payload struct {
				Data string `json:"__hacky__binaryFileData"`
			}
			if err := json.Unmarshal(overview.Body.Payload, &payload); err != nil {
				return nil, fmt.Errorf("invalid file body: %w", err)
			}
			raw, err := base64.StdEncoding.DecodeString(payload.Data)
			if err != nil {
				// Some payloads ship raw bytes already; let the renderer
				// upgrade us to the binary upload channel when it lands.
				raw = []byte(payload.Data)
			}
			body = bytes.NewReader(raw)
		default:
			return nil, fmt.Errorf("unknown body type %q", overview.Body.Type)
		}
	}

	req, err := http.NewRequestWithContext(ctx, verb, url, body)
	if err != nil {
		return nil, err
	}

	for name, raw := range overview.Headers {
		var h struct {
			Enabled bool     `json:"enabled"`
			Name    string   `json:"name"`
			Value   []string `json:"value"`
		}
		if err := json.Unmarshal(raw, &h); err != nil {
			continue
		}
		if !h.Enabled {
			continue
		}
		// Fall back to the map key when the entry doesn't carry a name field.
		key := h.Name
		if key == "" {
			key = name
		}
		if len(h.Value) > 0 {
			req.Header.Set(key, h.Value[0])
		}
	}

	return req, nil
}

// requestTimeout parses overview.Options["timeoutMs"] into a
// time.Duration, capped at maxRequestTimeout. Returns (0, false) when
// no timeout was supplied. The second return is `true` only when the
// supplied value is malformed (NaN, wrong JSON shape) so the caller
// can fail the flight with a clear error rather than silently ignore.
func requestTimeout(options map[string]json.RawMessage) (time.Duration, bool) {
	raw, ok := options["timeoutMs"]
	if !ok || len(raw) == 0 || string(raw) == "null" {
		return 0, false
	}
	var ms float64
	if err := json.Unmarshal(raw, &ms); err != nil {
		return 0, true
	}
	if ms <= 0 {
		return 0, false
	}
	dur := time.Duration(ms) * time.Millisecond
	if dur > maxRequestTimeout {
		dur = maxRequestTimeout
	}
	return dur, false
}

func reqURL(overview wire.RequestOverview) string {
	if len(overview.URL) == 0 {
		return ""
	}
	var url string
	if err := json.Unmarshal(overview.URL[0], &url); err == nil {
		return url
	}
	return ""
}

func classifyStream(contentType, transferEncoding string) string {
	ct := strings.ToLower(contentType)
	if strings.HasPrefix(ct, "text/event-stream") {
		return "sse"
	}
	if strings.Contains(strings.ToLower(transferEncoding), "chunked") {
		return "chunked"
	}
	return "standard"
}

func headersToMap(h http.Header) map[string]string {
	out := make(map[string]string, len(h))
	for k, v := range h {
		if len(v) > 0 {
			out[k] = v[0]
		}
	}
	return out
}

func sseEventToWire(ev SseEventOut) wire.SseEvent {
	out := wire.SseEvent{ReceivedAt: ev.ReceivedAt, Data: ev.Data}
	if ev.ID != "" {
		id := ev.ID
		out.ID = &id
	}
	if ev.Event != "" {
		e := ev.Event
		out.Event = &e
	}
	if ev.Retry != nil {
		r := *ev.Retry
		out.Retry = &r
	}
	return out
}
