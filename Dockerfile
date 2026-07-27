FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY apps/api apps/api
COPY packages packages

EXPOSE 3001

CMD ["bun", "run", "--cwd", "apps/api", "start"]
