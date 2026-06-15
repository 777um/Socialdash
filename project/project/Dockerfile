# Multi-stage build para otimizar tamanho da imagem
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar código
COPY . .

# Build
RUN pnpm build

# Stage de produção
FROM node:22-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expor porta
EXPOSE 3000

# Iniciar aplicação
CMD ["node", "dist/index.js"]
