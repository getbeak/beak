package main

import (
	ipcClient "github.com/Akumzy/ipc"
)

const (
	MessageFlightRequest =   "flight_request"
	MessageFlightFailed =    "flight_failed"
	MessageFlightComplete =  "flight_complete"
	MessageHeartbeat =       "heartbeat"
)

func main() {
	ipc := ipcClient.New()

	go func() {
		ipc.Send(MessageHeartbeat, nil)
		ipc.Send(MessageFlightComplete, nil)
	}()

	ipc.Start()
}
