FROM node:22-bookworm-slim AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/storefront/package.json apps/storefront/package.json
COPY apps/medusa/package.json apps/medusa/package.json
RUN npm ci
RUN mkdir -p apps/medusa/node_modules
COPY apps/medusa apps/medusa
ARG MEDUSA_BACKEND_URL
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
# Build-only values; never used as runtime credentials.
RUN MEDUSA_LOCAL_INFRASTRUCTURE=true DATABASE_URL=postgres://build:build@localhost/build REDIS_URL=redis://localhost:6379 JWT_SECRET=build-only-unused-secret-000000000000 COOKIE_SECRET=build-only-unused-secret-111111111111 STORE_CORS=http://localhost ADMIN_CORS=http://localhost AUTH_CORS=http://localhost npm run build --workspace @amoon/medusa

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=9000
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/medusa/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/medusa/.medusa/server ./
RUN mkdir -p static && chown node:node /app static
USER node
EXPOSE 9000
CMD ["npm", "run", "start"]
