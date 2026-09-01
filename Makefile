# Root Makefile — delegates to apps/web/
# Run `make setup` or `make run` from the repo root or from apps/web/

.PHONY: setup run test lint

setup:
	$(MAKE) -C apps/web setup

run:
	$(MAKE) -C apps/web run

test:
	$(MAKE) -C apps/web test

lint:
	$(MAKE) -C apps/web lint
