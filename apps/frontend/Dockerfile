FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared/contracts/package.json packages/shared/contracts/
COPY apps/frontend/package.json apps/frontend/

RUN npm ci --workspace @wifi/contracts --workspace frontend --include-workspace-root

COPY packages/shared/contracts packages/shared/contracts
COPY apps/frontend apps/frontend

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w @wifi/contracts && npm run build -w frontend

FROM nginx:1.27-alpine

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
