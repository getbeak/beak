// Package requester executes outbound HTTP requests and converts
// the response into the heartbeat stream the renderer expects.
//
// The SSE parser mirrors packages/common/src/helpers/sse-parser.ts —
// any spec edge case fixed there should be ported here, and vice
// versa. Tests live alongside.
package requester

import (
	"bytes"
	"strconv"
	"time"
)

type SseEventOut struct {
	ReceivedAt int64
	ID         string
	Event      string
	Data       string
	Retry      *int
}

// SseParser is incremental: feed bytes via Push, flush trailing data
// at EOF via Flush.
type SseParser struct {
	buffer        bytes.Buffer
	currentData   []string
	currentID     string
	currentEvent  string
	currentRetry  *int
}

func NewSseParser() *SseParser { return &SseParser{} }

func (p *SseParser) Push(chunk []byte) []SseEventOut {
	p.buffer.Write(chunk)
	return p.drain()
}

func (p *SseParser) Flush() []SseEventOut {
	events := p.drain()
	// Trailing partial line without a terminator.
	if p.buffer.Len() > 0 {
		p.processLine(p.buffer.String())
		p.buffer.Reset()
	}
	if ev, ok := p.materialize(); ok {
		events = append(events, ev)
	}
	return events
}

func (p *SseParser) drain() []SseEventOut {
	var events []SseEventOut
	for {
		line, advanced := p.readLine()
		if !advanced {
			return events
		}
		if line == "" {
			if ev, ok := p.materialize(); ok {
				events = append(events, ev)
			}
			continue
		}
		p.processLine(line)
	}
}

// readLine consumes one line from the buffer, returning whether a
// terminator was found.
func (p *SseParser) readLine() (string, bool) {
	data := p.buffer.Bytes()
	for i := 0; i < len(data); i++ {
		c := data[i]
		if c == '\n' {
			line := string(data[:i])
			p.buffer.Next(i + 1)
			return line, true
		}
		if c == '\r' {
			line := string(data[:i])
			skip := i + 1
			if i+1 < len(data) && data[i+1] == '\n' {
				skip = i + 2
			}
			p.buffer.Next(skip)
			return line, true
		}
	}
	return "", false
}

func (p *SseParser) processLine(line string) {
	if line == "" {
		return
	}
	// Comment line.
	if line[0] == ':' {
		return
	}
	colon := -1
	for i := 0; i < len(line); i++ {
		if line[i] == ':' {
			colon = i
			break
		}
	}
	var field, value string
	if colon == -1 {
		field = line
		value = ""
	} else {
		field = line[:colon]
		value = line[colon+1:]
		if len(value) > 0 && value[0] == ' ' {
			value = value[1:]
		}
	}

	switch field {
	case "data":
		p.currentData = append(p.currentData, value)
	case "id":
		p.currentID = value
	case "event":
		p.currentEvent = value
	case "retry":
		if n, err := strconv.Atoi(value); err == nil && n >= 0 {
			p.currentRetry = &n
		}
	}
}

func (p *SseParser) materialize() (SseEventOut, bool) {
	if len(p.currentData) == 0 && p.currentEvent == "" && p.currentID == "" && p.currentRetry == nil {
		return SseEventOut{}, false
	}
	data := ""
	if len(p.currentData) > 0 {
		// Per spec: join with "\n".
		for i, line := range p.currentData {
			if i > 0 {
				data += "\n"
			}
			data += line
		}
	}
	ev := SseEventOut{
		ReceivedAt: time.Now().UnixMilli(),
		ID:         p.currentID,
		Event:      p.currentEvent,
		Data:       data,
		Retry:      p.currentRetry,
	}
	p.currentData = p.currentData[:0]
	p.currentID = ""
	p.currentEvent = ""
	p.currentRetry = nil
	return ev, true
}
