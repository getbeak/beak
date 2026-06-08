// Package wire holds the wire-contract structs for the agent HTTP API.
// These mirror the Zod schemas in packages/common/src/wire/agent/. Any
// change there needs a matching edit here. See
// docs/adr/0001-local-agent-for-web-host.md Decision §2.
package wire

import "encoding/json"

// Constants mirroring packages/common/src/wire/agent/index.ts.
const (
	PortRangeStart = 47821
	PortRangeEnd   = 47840

	HealthzPath   = "/.beak/agent/healthz"
	PairPath      = "/pair"
	PairTokenPath = "/pair/token"
	FlightPath    = "/flight"

	FingerprintName = "beak"
	ProtocolVersion = "pkce-pair-v1"
	AgentSemver     = "0.1.0"
)

// ----- /flight -----

// FlightRequestPayload is the POST body on /flight.
type FlightRequestPayload struct {
	FlightID  string          `json:"flightId"`
	RequestID string          `json:"requestId"`
	Request   RequestOverview `json:"request"`
}

// RequestOverview is intentionally loose (json.RawMessage on the
// extension points) — Beak's request shape grows freely; the wire
// contract only commits to the few fields we actually act on.
type RequestOverview struct {
	Verb    string                     `json:"verb"`
	URL     []json.RawMessage          `json:"url"`
	Body    RequestBody                `json:"body"`
	Headers map[string]json.RawMessage `json:"headers,omitempty"`
	Options map[string]json.RawMessage `json:"options,omitempty"`
}

type RequestBody struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// HeartbeatStage is the SSE `event:` field on a heartbeat frame.
type HeartbeatStage string

const (
	StageFetchResponse HeartbeatStage = "fetch_response"
	StageHeadReceived  HeartbeatStage = "head_received"
	StageReadingBody   HeartbeatStage = "reading_body"
	StageSseEvent      HeartbeatStage = "sse_event"
	StageComplete      HeartbeatStage = "complete"
	StageFailed        HeartbeatStage = "failed"
)

type FetchResponseHeartbeat struct {
	FlightID string               `json:"flightId"`
	Stage    HeartbeatStage       `json:"stage"`
	Payload  FetchResponsePayload `json:"payload"`
}

type FetchResponsePayload struct {
	Timestamp int64 `json:"timestamp"`
}

type HeadReceivedHeartbeat struct {
	FlightID string              `json:"flightId"`
	Stage    HeartbeatStage      `json:"stage"`
	Payload  HeadReceivedPayload `json:"payload"`
}

type HeadReceivedPayload struct {
	Timestamp     int64             `json:"timestamp"`
	Status        int               `json:"status"`
	Headers       map[string]string `json:"headers"`
	URL           string            `json:"url"`
	Redirected    bool              `json:"redirected"`
	ContentType   *string           `json:"contentType"`
	ContentLength int               `json:"contentLength"`
	StreamKind    string            `json:"streamKind"`
}

type ReadingBodyHeartbeat struct {
	FlightID string             `json:"flightId"`
	Stage    HeartbeatStage     `json:"stage"`
	Payload  ReadingBodyPayload `json:"payload"`
}

type ReadingBodyPayload struct {
	Timestamp int64  `json:"timestamp"`
	Buffer    string `json:"buffer"` // base64
}

type SseEvent struct {
	ReceivedAt int64   `json:"receivedAt"`
	ID         *string `json:"id,omitempty"`
	Event      *string `json:"event,omitempty"`
	Data       string  `json:"data"`
	Retry      *int    `json:"retry,omitempty"`
}

type SseEventHeartbeat struct {
	FlightID string          `json:"flightId"`
	Stage    HeartbeatStage  `json:"stage"`
	Payload  SseEventPayload `json:"payload"`
}

type SseEventPayload struct {
	Timestamp int64    `json:"timestamp"`
	Event     SseEvent `json:"event"`
}

type FlightComplete struct {
	FlightID  string                 `json:"flightId"`
	Timestamp int64                  `json:"timestamp"`
	Overview  FlightCompleteOverview `json:"overview"`
}

type FlightCompleteOverview struct {
	Headers    map[string]string `json:"headers"`
	Redirected bool              `json:"redirected"`
	Status     int               `json:"status"`
	URL        string            `json:"url"`
	HasBody    bool              `json:"hasBody"`
}

type FlightFailed struct {
	FlightID string            `json:"flightId"`
	Error    FlightFailedError `json:"error"`
}

type FlightFailedError struct {
	Message string  `json:"message"`
	Code    *string `json:"code,omitempty"`
}

// ----- /.beak/agent/healthz -----

type HealthzResponse struct {
	Agent     string   `json:"agent"`
	Version   string   `json:"version"`
	Supports  []string `json:"supports"`
	Nonce     *string  `json:"nonce,omitempty"`
	Signature *string  `json:"signature,omitempty"`
}

// ----- /pair, /pair/token -----

type PairTokenRequest struct {
	Code         string `json:"code"`
	CodeVerifier string `json:"code_verifier"`
}

type PairTokenResponse struct {
	Token   string `json:"token"`
	TokenID string `json:"tokenId"`
}

type PairErrorResponse struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description,omitempty"`
}
