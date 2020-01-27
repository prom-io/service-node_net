FROM node:12 as builder

ENV NODE_ENV build
WORKDIR /home/node

COPY src .
COPY package.json .
COPY bootstrap-nodes.json .
COPY yarn.lock .
COPY nest-cli.json .
COPY tsconfig.json .
COPY tsconfig.build.json .
COPY tslint.json .
COPY .env .

RUN yarn global add @nestjs/cli
RUN yarn install

FROM node:12

ENV NODE_ENV production
WORKDIR /homde/node

COPY --from=builder /home/node/package*.json /home/node/
COPY --from=builder /home/node/dist/ /home/node/dist/

RUN yarn install

EXPOSE $SERVICE_NODE_API_PORT
EXPOSE $BOOTSTRAP_NODE_PORT

CMD ["node", "dist/main.js"]
