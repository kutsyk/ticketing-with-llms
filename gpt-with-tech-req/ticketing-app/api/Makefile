# api/Makefile

# Variables
DOCKER_COMPOSE = docker compose
SERVICE = api
DB_SERVICE = db

# Default target
.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

.PHONY: build
build: ## Build all Docker services
	$(DOCKER_COMPOSE) build

.PHONY: up
up: ## Start API and dependencies
	$(DOCKER_COMPOSE) up $(SERVICE) $(DB_SERVICE)

.PHONY: up-all
up-all: ## Start all services
	$(DOCKER_COMPOSE) up

.PHONY: down
down: ## Stop all services
	$(DOCKER_COMPOSE) down

.PHONY: logs
logs: ## Tail logs from API
	$(DOCKER_COMPOSE) logs -f $(SERVICE)

.PHONY: migrate
migrate: ## Apply DB migrations inside API container
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma migrate deploy

.PHONY: seed
seed: ## Seed DB inside API container
	$(DOCKER_COMPOSE) exec $(SERVICE) node prisma/seed.cjs

.PHONY: reset-db
reset-db: ## Reset DB, reapply migrations, and seed
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma migrate reset --force

.PHONY: lint
lint: ## Lint code
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run lint

.PHONY: format
format: ## Format code
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run format

.PHONY: swagger
swagger: ## Generate Swagger JSON
	$(DOCKER_COMPOSE) exec $(SERVICE) node scripts/generate-swagger.cjs > public/swagger.json
