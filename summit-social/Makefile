.PHONY: setup run test test-unit test-integration test-e2e lint build db-migrate db-seed db-studio deploy-preview

setup:
	npm install
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		node -e "const fs=require('fs'),c=require('crypto');let e=fs.readFileSync('.env','utf8');e=e.replace('<generate-with-openssl>',c.randomBytes(32).toString('base64'));fs.writeFileSync('.env',e);"; \
		echo "→ Created .env with generated NEXTAUTH_SECRET"; \
	else \
		echo "→ .env already exists, skipping"; \
	fi
	docker compose up -d
	@echo "→ Waiting for postgres..."
	@until docker compose exec -T postgres pg_isready -U summit -d summitsocial > /dev/null 2>&1; do sleep 1; done
	@echo "→ Postgres ready"
	npx prisma migrate dev --name init
	npm run db:seed

run:
	docker compose up -d
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
