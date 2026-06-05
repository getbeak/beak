package pairing

import (
	"sync"
	"time"
)

// ApprovalQueue is the bridge between the HTTP layer (which serves
// /pair) and the tray UI (which surfaces approval requests). The
// HTTP handler blocks on a per-pairing channel; the tray code
// resolves it by calling Approve/Deny.
type ApprovalQueue struct {
	mu       sync.Mutex
	pending  map[string]chan ApprovalDecision // keyed by state nonce
	listener chan ApprovalRequest
}

type ApprovalRequest struct {
	State  string
	Origin string
}

type ApprovalDecision struct {
	Allowed bool
}

func NewApprovalQueue() *ApprovalQueue {
	return &ApprovalQueue{
		pending:  map[string]chan ApprovalDecision{},
		listener: make(chan ApprovalRequest, 8),
	}
}

// Submit blocks the HTTP handler until the tray UI resolves the
// pending request or the timeout fires.
func (q *ApprovalQueue) Submit(req ApprovalRequest, timeout time.Duration) ApprovalDecision {
	ch := make(chan ApprovalDecision, 1)
	q.mu.Lock()
	q.pending[req.State] = ch
	q.mu.Unlock()

	defer func() {
		q.mu.Lock()
		delete(q.pending, req.State)
		q.mu.Unlock()
	}()

	q.listener <- req

	select {
	case decision := <-ch:
		return decision
	case <-time.After(timeout):
		return ApprovalDecision{Allowed: false}
	}
}

// Listen returns the channel the tray polls for new approval
// requests.
func (q *ApprovalQueue) Listen() <-chan ApprovalRequest {
	return q.listener
}

func (q *ApprovalQueue) Approve(state string) bool {
	return q.resolve(state, ApprovalDecision{Allowed: true})
}

func (q *ApprovalQueue) Deny(state string) bool {
	return q.resolve(state, ApprovalDecision{Allowed: false})
}

func (q *ApprovalQueue) resolve(state string, decision ApprovalDecision) bool {
	q.mu.Lock()
	ch, ok := q.pending[state]
	q.mu.Unlock()
	if !ok {
		return false
	}
	select {
	case ch <- decision:
		return true
	default:
		return false
	}
}
