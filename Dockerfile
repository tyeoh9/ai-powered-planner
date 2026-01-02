FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# PostHog (build-time, baked into JS bundle)
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

# Build-time env vars (dummy values, real ones injected at runtime via Secret Manager)
ENV SUPABASE_URL=https://placeholder.supabase.co
ENV SUPABASE_SERVICE_KEY=placeholder
ENV AUTH_SECRET=placeholder
ENV AUTH_GOOGLE_ID=placeholder
ENV AUTH_GOOGLE_SECRET=placeholder
ENV ANTHROPIC_API_KEY=sk-ant-api03-placeholder-placeholder-placeholder-placeholder-placeholder

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
