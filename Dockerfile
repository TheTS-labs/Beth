FROM node:20.5.1-alpine3.18

WORKDIR /app

RUN mkdir -p /app/backend
RUN mkdir -p /app/frontend

COPY package.json /app 
COPY backend/package.json /app/backend
COPY frontend/package.json /app/frontend

COPY yarn.lock /app

RUN yarn install 

COPY . /app

RUN apk update
RUN apk add curl