FROM node:22-bookworm-slim AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/storefront/package.json apps/storefront/package.json
COPY apps/medusa/package.json apps/medusa/package.json
RUN npm ci
COPY apps/storefront apps/storefront
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @amoon/storefront

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /workspace/apps/storefront/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=build --chown=node:node /workspace/apps/storefront/public ./apps/storefront/public
USER node
EXPOSE 8000
CMD ["node", "apps/storefront/server.js"]
