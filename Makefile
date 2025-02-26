.PHONY: build
build:
	# DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose -f docker/docker-compose.yml build
	docker compose -f docker/docker-compose.yml build

.PHONY: start
start:
	docker compose -f docker/docker-compose.yml up -d

.PHONY: stop
stop:
	docker compose -f docker/docker-compose.yml down