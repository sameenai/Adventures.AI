.PHONY: setup run test test-unit test-integration test-e2e lint build db-migrate db-seed db-studio deploy-preview deploy-gcp scheduler-setup alerts-setup rollback

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

# ---------------------------------------------------------------------------
# Monitoring alerts as code (ops/alerts/*.json = the source of truth).
# Upserts every policy by displayName, and provisions the uptime check the
# uptime-health policy consumes. Notification channels are attached once in
# the console (email/Slack) and survive re-runs: `policies update
# --policy-from-file` replaces the whole policy (the JSON carries no
# notificationChannels), so the target captures each policy's channels
# before updating and re-attaches them afterwards. Idempotent; re-run
# after edits.
# ---------------------------------------------------------------------------
alerts-setup:
	@for f in ops/alerts/*.json; do \
		dn=$$(node -pe "JSON.parse(require('fs').readFileSync('$$f','utf8')).displayName"); \
		existing=$$(gcloud alpha monitoring policies list \
			--project=$(GCP_PROJECT) \
			--filter="display_name='$$dn'" \
			--format="value(name)"); \
		if [ -n "$$existing" ]; then \
			echo "→ Updating policy: $$dn"; \
			channels=$$(gcloud alpha monitoring policies describe "$$existing" \
				--project=$(GCP_PROJECT) \
				--format="value(notificationChannels)"); \
			gcloud alpha monitoring policies update "$$existing" \
				--project=$(GCP_PROJECT) --policy-from-file="$$f" --quiet; \
			if [ -n "$$channels" ]; then \
				channels=$$(printf '%s' "$$channels" | tr ';' ','); \
				echo "→ Re-attaching notification channels: $$channels"; \
				gcloud alpha monitoring policies update "$$existing" \
					--project=$(GCP_PROJECT) \
					--add-notification-channels="$$channels" --quiet; \
			fi; \
		else \
			echo "→ Creating policy: $$dn"; \
			gcloud alpha monitoring policies create \
				--project=$(GCP_PROJECT) --policy-from-file="$$f"; \
		fi; \
	done
	@echo "→ Ensuring uptime check on basecamper.ai/api/health..."
	@gcloud monitoring uptime create basecamper-health \
		--project=$(GCP_PROJECT) \
		--resource-type=uptime-url \
		--resource-labels=host=basecamper.ai,project_id=$(GCP_PROJECT) \
		--protocol=https --port=443 --path=/api/health \
		--period=1 --timeout=10 2>/dev/null \
		|| echo "→ Uptime check already exists, leaving as-is"

# ---------------------------------------------------------------------------
# Roll traffic back to the previous revision (or REVISION=<name> explicitly).
# The canary deploy keeps the prior revision warm, so this takes seconds.
# ---------------------------------------------------------------------------
rollback:
	@target="$(REVISION)"; \
	if [ -z "$$target" ]; then \
		target=$$(gcloud run revisions list \
			--project=$(GCP_PROJECT) --region=$(GCP_REGION) \
			--service=$(GCP_SERVICE) \
			--filter="status.conditions.type:Ready AND status.conditions.status:True" \
			--sort-by="~metadata.creationTimestamp" \
			--format="value(metadata.name)" | sed -n 2p); \
	fi; \
	test -n "$$target" || (echo "No previous ready revision found; pass REVISION=<name>" && exit 1); \
	echo "→ Routing 100% of traffic to $$target"; \
	gcloud run services update-traffic $(GCP_SERVICE) \
		--project=$(GCP_PROJECT) --region=$(GCP_REGION) \
		--to-revisions="$$target=100"
