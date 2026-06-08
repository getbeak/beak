Feature: Local agent control plane (discovery, pairing, lifecycle)

  As a Beak web user
  I want my browser to find, pair with, and stay in sync with the local agent
  So that I can fire arbitrary HTTP requests through it

  Background:
    Given the web host is loaded in the browser at origin "https://beak.web"

  # ---------- Discovery ----------

  Scenario: Cold discovery finds the agent on the preferred port
    Given the agent is running on port 47821
    And there is no cached agent URL in localStorage
    When the web host starts discovery
    Then it probes "http://127.0.0.1:47821/.beak/agent/healthz"
    And receives a body with "agent" equal to "beak"
    And caches "http://127.0.0.1:47821" in localStorage with a 24h TTL
    And the agent slice status becomes "unpaired"

  Scenario: Port conflict shifts the agent up the range
    Given another process owns port 47821
    And the agent is running on port 47822
    When the web host scans ports 47821..47840
    Then 47821 fails the fingerprint check
    And 47822 returns the agent fingerprint
    And the web host uses "http://127.0.0.1:47822"

  Scenario: All ports unreachable
    Given the agent is not running
    When the web host scans ports 47821..47840
    Then every port times out or refuses connection within 200ms
    And the agent slice status becomes "unreachable"
    And the UI shows "Install or start the Beak agent"

  Scenario: Cached URL becomes stale after agent restart
    Given the cached URL is "http://127.0.0.1:47821"
    And the agent has restarted on port 47823
    When the web host issues a request to the cached URL
    And receives connection refused
    Then the web host evicts the cache and rescans
    And discovers "http://127.0.0.1:47823"

  Scenario: HMAC-keyed healthz defeats a localhost impostor
    Given a malicious local process binds port 47821 and returns {"agent":"beak"} at /.beak/agent/healthz
    And the web host already holds a paired token T
    When the web host probes 47821 with a fresh nonce N and Authorization "Bearer T"
    Then the impostor cannot return a valid HMAC-SHA256(T, N) signature
    And the web host discards 47821 and continues scanning
    And the agent slice status briefly enters "impostor" before settling

  # ---------- Pairing ----------

  Scenario: First-time pairing happy path
    Given the agent is reachable and the web host is unpaired
    When I click "Pair agent"
    Then a new tab opens to "http://127.0.0.1:<port>/pair" with origin, state, code_challenge, code_challenge_method=S256, and return
    And the agent's tray icon shows a pending-pairing badge
    And the agent's approval page shows the requesting origin "https://beak.web"
    And the default focused button is "Deny"
    When I click "Allow"
    Then the agent redirects to "https://beak.web/pair/return" with state and code
    When the web host POSTs the code and code_verifier to "/pair/token"
    Then the agent verifies sha256(code_verifier) equals code_challenge
    And the agent persists a token record with origin "https://beak.web" and tokenHash sha256(token)
    And the agent does not persist the raw token
    And the web host stores the raw token in localStorage
    And the agent slice status becomes "paired"

  Scenario: User denies the pairing request
    Given a pairing flow is in progress
    When I click "Deny" in the agent approval page
    Then the agent redirects to the return URL with error=access_denied
    And no token is persisted
    And the web host shows "Pairing cancelled" with a Retry button

  Scenario: PKCE defeats code interception
    Given the renderer initiated pairing with code_challenge X
    And a malicious local process races to "/pair/token" with the same code and a different code_verifier
    Then the agent rejects the exchange with 400 invalid_grant
    And no token is issued

  Scenario: Origin spoofing on /pair is rejected
    Given a malicious page sends a request to "/pair" with origin parameter "https://beak.web"
    But its Origin request header is "https://evil.example"
    Then the agent rejects the pair request before showing the approval page

  Scenario: Pending code expires after five minutes
    Given a pairing code was issued at T
    When the web host posts to "/pair/token" at T+6min
    Then the agent rejects the exchange with 400 invalid_grant

  Scenario: Pairing code is single-use
    Given a pairing code was successfully exchanged for a token
    When the web host (or anyone) posts the same code again
    Then the agent rejects the exchange with 400 invalid_grant

  # ---------- Revocation ----------

  Scenario: User revokes a pairing from the agent tray
    Given the web host is paired
    When I open "Paired clients" in the agent tray
    And I click "Revoke" next to "https://beak.web"
    Then the agent deletes the token record
    And the next flight request from the web host returns 401
    And the web host clears localStorage and shows the Pair-agent UI

  # ---------- Lifecycle UI states ----------

  Scenario Outline: UI surfaces match agent state
    Given the agent is in state "<state>"
    Then the UI shows "<surface>"

    Examples:
      | state            | surface                                              |
      | not installed    | "Install the Beak agent" with per-OS download links  |
      | installed-not-running | "Start the Beak agent"                          |
      | running-unpaired | "Pair this browser with the agent"                   |
      | paired           | (no banner; normal request editor)                   |
      | revoked          | "Re-pair this browser with the agent"                |
      | impostor         | "Agent verification failed — check for impostors"    |

  Scenario: Agent auto-update preserves the paired token
    Given the agent is running version 0.1.0 and paired
    When the agent restarts on version 0.2.0
    Then the persisted token record survives
    And the next discovery still resolves to the same loopback URL
    And the next flight succeeds without re-pairing

  Scenario: Agent process exit during steady state
    Given the agent is running and paired
    When the agent quits
    Then the next flight POST fails with connection refused
    And the agent slice status transitions to "unreachable"
    And in-flight SSE streams close, surfacing failed events with reason "agent_disconnected"

  # ---------- Single-instance enforcement ----------

  Scenario: A second agent process refuses to start
    Given a beak-agent is already running with PID 11197 on port 47821
    When a second beak-agent is launched (double-click, launchd, terminal)
    Then the second process acquires no port and writes no tokens.json
    And it prints "beak-agent: already running (PID 11197, version 0.1.0, started …) on http://127.0.0.1:47821"
    And it exits with status 0
    And the user still sees exactly one tray icon

  Scenario: The first agent's crash releases the singleton lock
    Given a beak-agent crashed without graceful shutdown
    When a new beak-agent is launched
    Then it acquires the lock (the OS released it on FD reap)
    And it starts normally on a free port in 47821..47840
