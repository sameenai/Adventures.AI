.PHONY: setup run test test-unit test-integration test-e2e lint build db-migrate db-seed db-studio deploy-preview

# ---------------------------------------------------------------------------
# Local dev: Postgres and Redis via Homebrew (no Docker required)
# Install prerequisites: brew install postgresql@16 redis
# ---------------------------------------------------------------------------

# postgresql@16 is keg-only; detect its bin dir at runtime to support both
# Apple Silicon (/opt/homebrew) and Intel (/usr/local) Macs.
PG16_BIN := $(shell ls -d /opt/homebrew/opt/postgresql@16/bin /usr/local/opt/postgresql@16/bin 2>/dev/null | head -1)
export PATH := $(PG16_BIN):$(PATH)

setup:
	npm install
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		node -e "const fs=require('fs'),c=require('crypto');let e=fs.readFileSync('.env','utf8');e=e.replace('<generate-with-openssl>',c.randomBytes(32).toString('base64'));fs.writeFileSync('.env',e);"; \
		echo "→ Created .env with generated NEXTAUTH_SECRET"; \
	else \
		echo "→ .env already exists, skipping"; \
	fi
	@echo "→ Starting Postgres and Redis..."
	@brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true
	@brew services start redis 2>/dev/null || true
	@echo "→ Waiting for Postgres to be ready..."
	@PG_ISREADY="$(PG16_BIN)/pg_isready"; \
	until "$$PG_ISREADY" -q 2>/dev/null; do sleep 1; done
	@echo "→ Postgres ready"
	@"$(PG16_BIN)/psql" postgres -c "CREATE ROLE summit WITH LOGIN PASSWORD 'summit' CREATEDB;" 2>/dev/null || "$(PG16_BIN)/psql" postgres -c "ALTER ROLE summit CREATEDB;" 2>/dev/null || true
	@"$(PG16_BIN)/createdb" -O summit summitsocial 2>/dev/null || true
	npx prisma migrate dev --name init
	npm run db:seed

run:
	@brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true
	@brew services start redis 2>/dev/null || true
	npm run dev

test: test-unit test-integration test-e2e

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

test-e2e:
	npx playwright install --with-deps
	npm run test:e2e

lint:
	npm run lint

build:
	npm run build

db-migrate:
	npx prisma migrate dev

db-seed:
	npm run db:seed

db-studio:
	npx prisma studio

deploy-preview:
	npx vercel
