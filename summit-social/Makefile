.PHONY: setup run test test-unit test-integration test-e2e lint build db-migrate db-seed db-studio deploy-preview

setup:
	npm install
	docker compose up -d
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
