FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install

COPY apps/api apps/api
COPY packages packages

FROM base AS api
EXPOSE 3001
CMD ["bun", "run", "--cwd", "apps/api", "start"]

FROM oven/bun:1 AS landing
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install

COPY apps/landing apps/landing
COPY packages packages

RUN bun run --cwd apps/landing build

EXPOSE 4321
CMD ["bun", "x", "serve", "apps/landing/dist", "-l", "4321"]
