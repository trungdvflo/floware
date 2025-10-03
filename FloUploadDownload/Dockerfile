FROM node:alpine
RUN npm install -g npm
RUN mkdir -p /var/www/app
WORKDIR /var/www/app
ADD . /var/www/app
RUN npm install
CMD npm run build && npm run start:prod