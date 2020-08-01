package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"sync"
	"time"

	"golang.org/x/net/websocket"
)

func main() {
	s := &Server{Connections: map[int]*Connection{}}
	ws := &websocket.Server{Handler: s.Handle}
	http.Handle("/", http.FileServer(http.Dir("./assets")))
	http.Handle("/websocket", ws)
	log.Println("Listening on localhost:9005")
	log.Fatal(http.ListenAndServe("localhost:9005", nil))
}

type Server struct {
	id          int
	Connections map[int]*Connection
	sync.RWMutex
}

type Connection struct {
	*websocket.Conn
	DeviceID string
	Token    string
}

func (s *Server) Handle(ws *websocket.Conn) {
	s.Lock()
	s.id++
	id := s.id
	connection := &Connection{Conn: ws}
	s.Connections[id] = connection
	s.Unlock()
	for {
		msg := map[string]string{}
		if err := websocket.JSON.Receive(ws, &msg); err != nil {
			log.Printf("closed - err: %#v", err)
			s.Lock()
			delete(s.Connections, id)
			s.Unlock()
			return
		}

		switch msg["action"] {
		case "register":
			connection.Token = msg["token"]
			connection.DeviceID = msg["deviceId"]
			log.Println("registered", msg)
		case "play":
			s.All(func(c *Connection) {
				Play(msg["id"], c.Token, c.DeviceID)
			})
		case "pause":
			s.All(func(c *Connection) {
				Pause(c.Token)
			})
		case "current":
			s.All(func(c *Connection) {
				log.Println(Current(c.Token))
			})
		default:
			log.Printf("forwarding: %#v", msg)
		}
		s.RLock()
		for _, c := range s.Connections {
			websocket.JSON.Send(c.Conn, msg)
		}
		s.RUnlock()
	}
}

func (s *Server) All(f func(c *Connection)) {
	s.RLock()
	i := 0
	for _, c := range s.Connections {
		go func(c *Connection) {
			log.Println(c, time.Now())
			f(c)
			if i == len(s.Connections)-1 {
				s.RUnlock()
			}
			i++
		}(c)
	}
}

func Play(id, token, deviceID string) (map[string]interface{}, error) {
	result, params := map[string]interface{}{}, map[string]string{"device_id": deviceID}
	body := map[string]interface{}{
		"uris":        []string{id},
		"position_ms": 0,
	}
	if err := Spotify("v1/me/player/play", token, params, body, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func Pause(token string) error {
	if err := Spotify("v1/me/player/pause", token, nil, struct{}{}, nil); err != nil {
		return err
	}
	return nil
}

func Current(token string) (map[string]interface{}, error) {
	result := map[string]interface{}{}
	if err := Spotify("v1/me/player/currently-playing", token, nil, nil, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func Spotify(path, token string, params map[string]string, body interface{}, result interface{}) error {
	url := "https://api.spotify.com/" + path + "?"
	for k, v := range params {
		url += k + "=" + v + "&"
	}
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	if body == nil {
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		defer res.Body.Close()
		if result != nil && res.StatusCode != 204 {
			return json.NewDecoder(res.Body).Decode(result)
		}
		return nil
	}
	bs, err := []byte{}, error(nil)
	if body != nil {
		if bs, err = json.Marshal(body); err != nil {
			return err
		}
	}
	req.Method = http.MethodPut
	req.Body = ioutil.NopCloser(bytes.NewReader(bs))
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if result != nil && res.StatusCode != 204 {
		return json.NewDecoder(res.Body).Decode(result)
	}
	return nil
}
