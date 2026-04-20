COMPOSE_FILE = docker-compose.replicaset.yaml
COMPOSE_SINGLE_FILE = docker-compose.document.yaml
COMPOSE_TEST_FILE = docker-compose.document.test.yaml
ENV_FILE = env-example-document

env.setup:
	cp $(ENV_FILE) .env

install:
	npm install

build:
	docker compose -f $(COMPOSE_FILE) build

start:
	docker compose -f $(COMPOSE_FILE) up

start.detach:
	docker compose -f $(COMPOSE_FILE) up -d

stop:
	docker compose -f $(COMPOSE_FILE) down

restart:
	docker compose -f $(COMPOSE_FILE) down && docker compose -f $(COMPOSE_FILE) up -d

dev:
	npm run start:dev

dev.swc:
	npm run start:swc

debug:
	npm run start:debug

sh:
	docker compose -f $(COMPOSE_FILE) run --rm api sh

mongo.sh:
	docker exec -it $$(docker compose -f $(COMPOSE_FILE) ps -q mongo1) mongosh

db.seed:
	npm run seed:run:document

db.seed.docker:
	docker compose -f $(COMPOSE_FILE) run --rm api npm run seed:run:document

db.indexes:
	docker exec -it $$(docker compose -f $(COMPOSE_FILE) ps -q mongo1) mongosh --eval "use api" --eval "db.getCollectionNames().forEach(c => { print('--- ' + c + ' ---'); printjson(db[c].getIndexes()) })"

rs.status:
	docker exec -it $$(docker compose -f $(COMPOSE_FILE) ps -q mongo1) mongosh --eval "rs.status()"

test:
	npm run test

test.watch:
	npm run test:watch

test.cov:
	npm run test:cov

test.e2e:
	npm run test:e2e

test.e2e.docker:
	docker compose -f $(COMPOSE_TEST_FILE) --env-file $(ENV_FILE) -p tests up -d --build && \
	docker compose -f $(COMPOSE_TEST_FILE) -p tests exec api /opt/wait-for-it.sh -t 0 localhost:3000 -- npm run test:e2e -- --watchAll --runInBand && \
	docker compose -f $(COMPOSE_TEST_FILE) -p tests down && \
	docker compose -p tests rm -svf

lint:
	npm run lint

lint.fix:
	npm run lint -- --fix

format:
	npm run format

generate.resource:
	npm run generate:resource:document

seed.create:
	npm run seed:create:document

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

logs.api:
	docker compose -f $(COMPOSE_FILE) logs -f api

logs.mongo:
	docker compose -f $(COMPOSE_FILE) logs -f mongo

ps:
	docker compose -f $(COMPOSE_FILE) ps

clean:
	docker compose -f $(COMPOSE_FILE) down -v

swagger:
	@echo "Swagger UI: http://localhost:$${APP_PORT:-3000}/docs"

.PHONY: env.setup install build start start.detach stop restart dev dev.swc debug sh mongo.sh \
	db.seed db.seed.docker db.indexes rs.status test test.watch test.cov test.e2e test.e2e.docker \
	lint lint.fix format generate.resource seed.create logs logs.api logs.mongo ps clean swagger
