FROM node:12

WORKDIR /usr/src/app

COPY . .

EXPOSE $SERVICE_NODE_API_PORT
EXPOSE $BOOTSTRAP_NODE_PORT

RUN yarn install
ENTRYPOINT ["yarn", "run", "start"]
