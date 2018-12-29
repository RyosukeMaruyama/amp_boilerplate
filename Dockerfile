FROM node:10-alpine

WORKDIR /app

RUN apk add --no-cache sudo && \
    npm install -g npm-check-updates
