package main

import (
	"log"
	"net/http"

	"golang.org/x/net/websocket"
)

func main() {
	s := &Server{}
	ws := &websocket.Server{Handler: s.Handle}
	http.Handle("/", http.FileServer(http.Dir("./assets")))
	http.Handle("/websocket", ws)
	log.Println("Listening on localhost:9005")
	log.Fatal(http.ListenAndServe("localhost:9005", nil))
}

type Server struct {
	Connections []*websocket.Conn
}

func (s *Server) Handle(ws *websocket.Conn) {
	s.Connections = append(s.Connections, ws)
	for {
		msg := map[string]string{}
		if err := websocket.JSON.Receive(ws, &msg); err != nil {
			log.Printf("closed - err: %#v", err)
			return
		}
		log.Printf("received: %#v", msg)
		for _, ws := range s.Connections {
			websocket.JSON.Send(ws, msg)
		}
	}
}
