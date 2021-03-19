FROM node:alpine
EXPOSE 3000
ENV NODE_ENV production

RUN npm install pm2 -g

WORKDIR /usr/src/app
COPY . /usr/src/app

RUN npm ci --only=production

USER node

CMD "pm2-runtime" "server.js"
