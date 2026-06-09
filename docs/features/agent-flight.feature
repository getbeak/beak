Feature: Routing flights through the local agent

  As a paired web host
  I want to fire HTTP requests through the agent and receive streaming heartbeats
  So that CORS does not constrain me and the renderer flight UI behaves identically to Electron

  Background:
    Given the web host is paired with the agent
    And the agent is reachable at "http://127.0.0.1:47821"

  # ---------- Routing decision ----------

  Scenario Outline: The renderer picks the right requester per preference and state
    Given the routing preference is "<pref>"
    And the agent status is "<status>"
    When the renderer starts a flight
    Then the requester used is "<requester>"

    Examples:
      | pref                  | status      | requester                  |
      | agent-when-available  | paired      | AgentRequester             |
      | agent-when-available  | unreachable | BrowserFetchRequester      |
      | agent-only            | paired      | AgentRequester             |
      | agent-only            | unreachable | (none; flight fails fast)  |
      | browser-only          | paired      | BrowserFetchRequester      |

  # ---------- Single-flight execution ----------

  Scenario: GET happy path streams heartbeats end-to-end
    When I start a flight with verb=GET, url="https://api.example.com/users"
    Then the renderer POSTs to "http://127.0.0.1:47821/flight" with Authorization "Bearer <token>" and Origin "https://beak.web"
    And the agent fires GET against the upstream
    And the SSE response stream emits an event "fetch_response"
    And then "head_received" with status=200 and the upstream headers
    And then one or more "reading_body" events whose buffer base64-decodes to the upstream bytes
    And then a terminal "complete" event with hasBody=true
    And the agent closes the SSE stream

  Scenario: Heartbeat frames carry the {flightId, stage, payload} envelope
    # Pinned after a wire-shape regression: the agent briefly emitted the
    # inner payload bare, which made the renderer's Zod validator reject
    # every frame. The envelope shape is the contract — keep it explicit.
    When the agent emits any heartbeat frame
    Then the SSE `data:` line parses as JSON with top-level fields {flightId, stage, payload}
    And flightId matches the flight's flightId
    And stage matches the SSE `event:` name
    And the renderer's flightHeartbeatSchema accepts the frame without error

  Scenario: POST with JSON body
    When I start a flight with verb=POST, body.type=json_raw, body.payload="{\"a\":1}"
    Then the agent issues POST against the upstream with Content-Type "application/json" and body {"a":1}
    And streams response heartbeats back

  Scenario: SSE upstream produces interleaved sse_event and reading_body heartbeats
    Given the upstream returns Content-Type "text/event-stream"
    When I start a flight against that upstream
    Then "head_received" reports streamKind="sse"
    And "sse_event" heartbeats arrive as upstream events are emitted
    And "reading_body" heartbeats carry the raw bytes in parallel
    And a "complete" event fires when the upstream closes the stream

  Scenario: Upstream timeout becomes a failed event
    Given the flight options include timeoutMs=2000
    When the upstream takes longer than 2000ms to respond
    Then the agent cancels the upstream request
    And emits a "failed" event whose error message contains "timeout"

  Scenario: Binary body bytes are base64 on the wire
    When the upstream returns a 1MB binary blob
    Then each "reading_body" event's payload.buffer is base64-encoded
    And the renderer reconstructs the original bytes by concatenating decoded chunks

  Scenario: Auth failure aborts the flight cleanly
    Given the renderer's stored token does not match any record on the agent
    When the renderer POSTs a flight
    Then the agent returns 401 immediately (no SSE stream opened)
    And the renderer flight slice marks the flight failed with reason "agent_unauthorized"
    And the web host clears localStorage and surfaces the Pair-agent UI

  # ---------- Concurrency ----------

  Scenario: Multiple flights run in parallel without blocking each other
    Given two flights F1 and F2 both target "https://api.example.com/slow"
    When I start F1 and immediately start F2
    Then the agent opens two upstream connections in parallel
    And the SSE streams for F1 and F2 progress independently
    And neither flight blocks the other

  Scenario: Streaming flight does not stall sibling flights
    Given F1 is in flight against an SSE upstream that streams indefinitely
    When I start F2 against a separate upstream
    Then F2 completes while F1 is still streaming
    And F1's stream continues without interruption

  # ---------- Cancellation ----------

  Scenario: Renderer-initiated cancellation tears down only the target flight
    Given F1, F2, F3 are all in flight
    When the renderer aborts the AbortController for F2
    Then the underlying TCP connection for F2 closes
    And the agent observes ctx.Done() on F2 within 100ms
    And the agent cancels the upstream HTTP request for F2
    And no "complete" or "failed" event is emitted for F2
    And F1 and F3 continue streaming heartbeats undisturbed

  Scenario: Agent restart during in-flight requests
    Given F1 and F2 are in flight
    When the agent process exits
    Then each renderer flight's SSE stream closes
    And the renderer flight slice marks each as failed with reason "agent_disconnected"
    And subsequent flights show agent status "unreachable" until rediscovery completes
