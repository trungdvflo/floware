FROM node:12.19.0-slim
WORKDIR /var/www/app

RUN apt-get update \
    && apt-get install -y git python make g++
RUN npm install pm2 -g
COPY ./ /var/www/app

RUN npm install

RUN cat /dev/null > .env
RUN chown node:node /var/www/app
USER node

RUN npm run build
CMD exec pm2 start build/index.js --name FloServantManager --env production -i max --no-daemon