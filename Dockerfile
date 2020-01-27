FROM node:12

WORKDIR /app

COPY . .

RUN yarn global add @nestjs/cli
RUN yarn install
RUN yarn build

EXPOSE $SERVICE_NODE_API_PORT
EXPOSE $BOOTSTRAP_NODE_PORT

CMD ["node", "dist/main.js"]
