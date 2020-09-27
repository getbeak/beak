package main

type ToggleKeyValue struct {
	Name    string `json:"name"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type URI struct {
	Protocol string `json:"protocol"`
	Verb string `json:"verb"`
	Hostname *string `json:"hostname"`
	Path *string `json:"path"`
	Query map[string]ToggleKeyValue `json:"query"`
	Fragment *string `json:"fragment"`
}

type RequestFlightPayload struct {
	Headers map[string]ToggleKeyValue `json:"headers"`
	URI     URI                       `json:"uri"`
}

type HeartbeatPayload struct {

}
