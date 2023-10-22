FROM node:20.5.1-slim

WORKDIR /app

RUN mkdir -p /app/backend
RUN mkdir -p /app/frontend

COPY package.json /app 
COPY backend/package.json /app/backend
COPY frontend/package.json /app/frontend

COPY yarn.lock /app

RUN yarn install 

COPY . /app

RUN yarn workspace frontend next build

CMD yarn concurrently \
      "yarn workspace backend run -T ts-node main.ts" \
      "yarn frontend:start" \
      -n "SERVER,CLIENT" \
      -c "bgCyan.bold,bgGreen.bold"

EXPOSE ${APP_PORT} ${NEXT_PORT}
