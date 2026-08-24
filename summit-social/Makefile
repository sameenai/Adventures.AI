.PHONY: setup run test test-unit test-integration test-e2e lint build db-migrate db-seed db-studio deploy-preview deploy-gcp

GCP_PROJECT    := basecamp-494710
GCP_REGION     := europe-west2
GCP_SERVICE    := basecamper
GCP_IMAGE      := $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/$(GCP_SERVICE)/app:latest

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

GCP_MIGRATE_IMAGE := $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/$(GCP_SERVICE)/app:migrate

deploy-gcp:
	@echo "→ Building app image..."
	gcloud builds submit . \
		--project=$(GCP_PROJECT) \
		--tag=$(GCP_IMAGE)
	@echo "→ Building migrator image..."
	gcloud builds submit . \
		--project=$(GCP_PROJECT) \
		--config=cloudbuild-migrate.yaml
	@echo "→ Running database migrations..."
	gcloud run jobs update migrate-db \
		--project=$(GCP_PROJECT) \
		--region=$(GCP_REGION) \
		--image=$(GCP_MIGRATE_IMAGE) \
		--quiet
	gcloud run jobs execute migrate-db \
		--project=$(GCP_PROJECT) \
		--region=$(GCP_REGION) \
		--wait
	@echo "→ Deploying app..."
	gcloud run deploy $(GCP_SERVICE) \
		--project=$(GCP_PROJECT) \
		--region=$(GCP_REGION) \
		--image=$(GCP_IMAGE) \
		--quiet

# ---------------------------------------------------------------------------
# Scheduled jobs (Cloud Scheduler → POST /api/jobs/<name> with shared secret)
# Requires: JOBS_SECRET set on the Cloud Run service AND exported locally when
# running this target. Run once per environment; re-running updates in place.
# ---------------------------------------------------------------------------
scheduler-setup:
	@test -n "$(JOBS_SECRET)" || (echo "Set JOBS_SECRET first (openssl rand -hex 24)" && exit 1)
	gcloud scheduler jobs create http basecamper-retention \
		--project=$(GCP_PROJECT) \
		--location=$(GCP_REGION) \
		--schedule="0 3 * * *" \
		--uri="https://basecamper.ai/api/jobs/retention" \
		--http-method=POST \
		--headers="x-jobs-secret=$(JOBS_SECRET)" \
		--attempt-deadline=300s \
		|| gcloud scheduler jobs update http basecamper-retention \
		--project=$(GCP_PROJECT) \
		--location=$(GCP_REGION) \
		--schedule="0 3 * * *" \
		--uri="https://basecamper.ai/api/jobs/retention" \
		--http-method=POST \
		--update-headers="x-jobs-secret=$(JOBS_SECRET)" \
		--attempt-deadline=300s
