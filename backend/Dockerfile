FROM node:18-bullseye-slim as base

RUN apt-get update && apt-get install -y openssl sqlite3

FROM base as deps

RUN mkdir /app/
WORKDIR /app/

ADD package.json package-lock.json ./
RUN npm install

RUN npm rebuild @sequelize/sqlite3 --build-from-source

FROM base as production-deps

RUN mkdir /app/
WORKDIR /app/

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json package-lock.json ./
RUN npm prune --omit=dev

FROM base

RUN mkdir /app/
WORKDIR /app/

COPY --from=production-deps /app/node_modules /app/node_modules

ADD . .

CMD ["npm", "start"]