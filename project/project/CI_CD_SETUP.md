# CI/CD Pipeline Setup - Social Media AI Automation Dashboard

## Overview

Este documento descreve a configuração de CI/CD para o Social Media AI Automation Dashboard usando GitHub Actions, com suporte para build, testes, e deployment automático.

---

## 1. GitHub Actions Workflow

### Arquivo: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22.13.0'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm run format --check
      
      - name: Run TypeScript check
        run: pnpm run build
      
      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
          NODE_ENV: test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22.13.0'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifact
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/
      
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Adicionar comandos de deployment aqui
          # Exemplo: docker build, push, deploy
```

---

## 2. Variáveis de Ambiente

### Secrets do GitHub

Configure os seguintes secrets no repositório:

```
SENTRY_DSN              # Sentry error tracking
DATABASE_URL            # Production database URL
JWT_SECRET              # JWT signing secret
OAUTH_SERVER_URL        # OAuth server URL
VITE_APP_ID             # Manus OAuth app ID
DOCKER_REGISTRY_URL     # Docker registry URL
DOCKER_USERNAME         # Docker registry username
DOCKER_PASSWORD         # Docker registry password
```

---

## 3. Testes Automatizados

### Cobertura de Testes

O pipeline executa:

- **Unit Tests**: 120+ testes vitest
- **Integration Tests**: Notificações, webhooks, KPI, alertas
- **Performance Tests**: Queries otimizadas, caching
- **Type Checking**: TypeScript strict mode

### Comando de Teste Local

```bash
# Executar todos os testes
pnpm test

# Executar com cobertura
pnpm test -- --coverage

# Executar testes específicos
pnpm test -- notifications-router.test.ts

# Watch mode
pnpm test -- --watch
```

---

## 4. Build e Deployment

### Build Local

```bash
# Build do projeto
pnpm build

# Resultado: dist/index.js (135.4kb)
```

### Docker Deployment

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Deploy Commands

```bash
# Build Docker image
docker build -t social-media-ai-dashboard:latest .

# Push to registry
docker push your-registry/social-media-ai-dashboard:latest

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml
```

---

## 5. Monitoramento em Produção

### Sentry Integration

Todos os erros são automaticamente capturados e reportados ao Sentry:

```
SENTRY_DSN=https://key@sentry.io/project-id
```

### Health Checks

```bash
# Verificar saúde da aplicação
curl http://localhost:3000/health

# Verificar WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/api/ws
```

---

## 6. Rollback Automático

Em caso de falha no deployment:

```bash
# Rollback para versão anterior
kubectl rollout undo deployment/social-media-ai-dashboard

# Verificar status
kubectl rollout status deployment/social-media-ai-dashboard
```

---

## 7. Performance Monitoring

### Métricas Monitoradas

- Build time: < 3s
- Test execution: < 30s
- Deployment time: < 5m
- Application startup: < 2s

### Alertas Configurados

- Build failure
- Test failure
- Deployment failure
- High error rate em produção (> 1%)
- High latency (> 1s)

---

## 8. Checklist de Deployment

Antes de fazer deploy em produção:

- [ ] Todos os testes passando
- [ ] TypeScript sem erros
- [ ] Build size dentro do limite (< 200kb)
- [ ] Sentry DSN configurado
- [ ] Database migrations executadas
- [ ] Environment variables configuradas
- [ ] Backup do banco de dados realizado
- [ ] Health checks passando
- [ ] Monitoramento ativo

---

## 9. Troubleshooting

### Build falha

```bash
# Limpar cache e reinstalar
pnpm install --force
pnpm build
```

### Testes falhando

```bash
# Executar com debug
pnpm test -- --reporter=verbose

# Verificar logs
tail -f .manus-logs/devserver.log
```

### Deployment falha

```bash
# Verificar logs do container
docker logs social-media-ai-dashboard

# Rollback para versão anterior
kubectl rollout undo deployment/social-media-ai-dashboard
```

---

## 10. Próximos Passos

1. Configurar GitHub Actions secrets
2. Criar arquivo `.github/workflows/ci-cd.yml`
3. Configurar Docker registry
4. Testar pipeline em branch develop
5. Fazer merge para main e monitorar deployment

---

**Versão**: 1.0  
**Data**: 14/06/2026  
**Status**: ✅ Pronto para implementação
