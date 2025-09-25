# ---- build stage ----
    FROM node:20-alpine AS build
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    # Generate Prisma client and build Nest
    RUN npx prisma generate
    RUN npm run build
    
    # ---- runtime stage ----
    FROM node:20-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    ENV PORT=3000
    # bring only what's needed
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/node_modules ./node_modules
    COPY package*.json ./
    COPY .env ./
    # keep prisma schema/client for runtime if needed by migrate
    COPY prisma ./prisma
    RUN mkdir -p /app/uploads && chown -R node:node /app
    USER node
    EXPOSE 3000
    # run migrations then start
    CMD sh -c "npx prisma migrate deploy && node dist/main.js"
    