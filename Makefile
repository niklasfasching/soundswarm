SHELL := /bin/bash

.PHONY: run
run:
	ssh bmo@niklasfasching.de "ps x | grep sshd | cut -d ' ' -f1 | xargs kill"; \
	ssh -g -R 8000:localhost:9005 bmo@niklasfasching.de -N & \
	go run *.go

.PHONY: build
build:
	go build -o soundswarm *.go

.PHONY: test
test:
	go test -v ./...

.PHONY: deploy-assets
deploy-assets:
	rsync -rv --copy-links --delete soundswarm assets bmo@niklasfasching.de:~/soundswarm/

.PHONY: deploy
deploy: build deploy-assets
	ssh bmo@niklasfasching.de 'sleep 1; systemctl --user restart soundswarm; sleep 1; systemctl --user status soundswarm'

.PHONY: logs
logs:
	ssh bmo@niklasfasching.de journalctl --user-unit soundswarm.service -f -n300
