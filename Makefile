.PHONY: build compile test clean 
default: build

SHELL:=/bin/bash
UNAME_S := $(shell uname -s)

node_modules: yarn.lock
	yarn install --production
compile: node_modules clean
	npx tsc  -p tsconfig.build.json
build: compile
test: node_modules
	NODE_ENV=testing npx jest --runInBand
clean:
	rm -rf ./dist
