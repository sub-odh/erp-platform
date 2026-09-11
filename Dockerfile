# syntax=docker/dockerfile:1

# Build targets:
#   api      NestJS server              docker build --target api .
#   web      Next.js server             docker build --target web .
#   migrate  one-shot Drizzle migrator  docker build --target migrate .

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app


# Installs the whole workspace from the lockfile. Only manifests are copied so
# this layer survives source edits.
FROM base AS deps
# bcrypt compiles from source whenever no prebuilt binary matches the platform.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/licensing/package.json ./packages/licensing/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile


FROM deps AS api-build
COPY . .
RUN pnpm turbo run build --filter=api...
# Flattens the workspace links into a tree that runs without pnpm. --legacy
# opts out of injected dependencies, which this workspace does not use.
RUN pnpm --filter=api --prod --legacy deploy /deploy


# Applies pending SQL migrations, then exits. Needs drizzle-kit, which is a dev
# dependency, so it ships from the build stage rather than the pruned tree.
FROM api-build AS migrate
WORKDIR /app/packages/db
# Invoked directly rather than through pnpm, whose pre-run dependency check
# tries to reinstall the workspace and cannot prompt inside a container.
CMD ["node_modules/.bin/drizzle-kit", "migrate"]


FROM base AS api
ENV NODE_ENV=production \
    PORT=3000
COPY --from=api-build --chown=node:node /deploy ./
# Uploads are served from the working directory and belong on a volume.
RUN install -d -o node -g node uploads
USER node
EXPOSE 3000
CMD ["node", "dist/main"]


FROM deps AS web-build
# Next inlines NEXT_PUBLIC_* at build time, so the API URL is a build input and
# not something the container can be repointed at later.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_OUTPUT_STANDALONE=true
COPY . .
RUN pnpm turbo run build --filter=web...


FROM base AS web
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0
COPY --from=web-build /app/apps/web/.next/standalone ./
COPY --from=web-build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3001
CMD ["node", "apps/web/server.js"]
