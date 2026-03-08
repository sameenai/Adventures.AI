# Root Makefile — delegates to summit-social/
# Run `make setup` or `make run` from the repo root or from summit-social/

.PHONY: setup run test lint

setup:
	$(MAKE) -C summit-social setup

run:
	$(MAKE) -C summit-social run

test:
	$(MAKE) -C summit-social test

lint:
	$(MAKE) -C summit-social lint
