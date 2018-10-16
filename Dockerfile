FROM mhart/alpine-node:10.12 as builder

LABEL maintainer="Ben Saufley <contact@bensaufley.com>"

WORKDIR /tmp
COPY package.json package-lock.json /tmp/
RUN npm install
RUN mkdir -p /usr/src/app/build && cp -a /tmp/node_modules /usr/src/app
COPY ./src/tslint.base.json /usr/src/app/build
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm run build

FROM mhart/alpine-node:10.12

ENV NODE_ENV=production
RUN adduser -u 2004 -D docker

WORKDIR /tmp
COPY package.json package-lock.json /tmp/
RUN npm install

RUN mkdir -p /usr/src/app && mv /tmp/node_modules /usr/src/app
WORKDIR /usr/src/app
COPY ./docs /docs
COPY --from=builder /usr/src/app/build /usr/src/app

WORKDIR /src
USER docker
VOLUME /src

CMD ["node", "/usr/src/app/index.js"]
