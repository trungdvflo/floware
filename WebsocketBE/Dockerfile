# Development stage
# FROM node:20.10.0-alpine3.19 AS development
FROM node@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
# FROM node:16.16.0 AS production
FROM node@sha256:1ed1e17ccabb09038cfb8a965337ebcda51ef9e9d32082164c502d44d9731a02 AS production 

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# Create a non-root user named "appuser"
RUN groupadd -r appuser &&\
    useradd -r -g appuser -d /usr/src/app -s /sbin/nologin -c "Docker image user" appuser &&\
    chown -R appuser:appuser /usr/src/app &&\
    npm install --only=production

COPY --from=development /usr/src/app/dist ./dist

# Change to non-root user
USER appuser

CMD ["node", "dist/main"]