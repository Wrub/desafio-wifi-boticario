
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared/contracts/package.json packages/shared/contracts/
COPY apps/backend/package.json apps/backend/

RUN npm ci --workspace @wifi/contracts --workspace backend --include-workspace-root

COPY packages/shared/contracts packages/shared/contracts
COPY apps/backend apps/backend

RUN npm run build -w @wifi/contracts && npm run build -w backend

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared/contracts/package.json packages/shared/contracts/
COPY apps/backend/package.json apps/backend/

RUN npm ci --omit=dev --workspace @wifi/contracts --workspace backend --include-workspace-root

COPY --from=build /app/packages/shared/contracts/dist packages/shared/contracts/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY apps/backend/scripts apps/backend/scripts

WORKDIR /app/apps/backend
USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
