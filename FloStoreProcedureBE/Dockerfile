FROM node:18.17.0 as base
RUN npm install -g npm@10.1.0
WORKDIR /app
COPY . .
RUN npm ci