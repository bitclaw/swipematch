#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh ${MONGO_HOST:-mongo}:27017
cat .env
npm run seed:run:document
npm run start:prod
