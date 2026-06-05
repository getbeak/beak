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

func Run(ctx context.Context, opts Options) {
	overview := opts.Payload.Request
	emit := opts.Emitter
	flightID := opts.Payload.FlightID

	emit.Heartbeat(wire.StageFetchResponse, wire.FetchResponsePayload{Timestamp: time.Now().UnixMilli()})

	req, err := buildRequest(ctx, overview)
	if err != nil {
		emit.Failed(wire.FlightFailed{FlightID: flightID, Error: wire.FlightFailedError{Message: err.Error()}})
		return
	}

	client := opts.Client
	if client == nil {
		client = &http.Client{
			Timeout: 0, // streamed responses can run indefinitely; timeouts are honoured per-options
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse // mirror the browser's "manual" redirect mode
			},
		}
	}

	resp, err := client.Do(req)
	if err != nil {
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
