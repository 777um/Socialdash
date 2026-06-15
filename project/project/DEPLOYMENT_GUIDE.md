# Guia de Deployment - Social Media AI Dashboard

## 📋 Checklist Pré-Deployment

- [ ] Todos os testes passando (`pnpm test`)
- [ ] Sem erros TypeScript (`pnpm tsc --noEmit`)
- [ ] Build bem-sucedido (`pnpm build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Database migrations executadas (`pnpm db:push`)
- [ ] Backup do banco de dados realizado
- [ ] Plano de rollback preparado

---

## 🔧 Configuração de Ambiente

### 1. Variáveis de Ambiente Obrigatórias

Criar arquivo `.env.production`:

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/social_media_ai_db

# Authentication
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login

# LLM Integration
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# Application
VITE_APP_TITLE=Social Media AI Automation Dashboard
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 2. Validar Configuração

```bash
# Verificar variáveis
env | grep -E "DATABASE_URL|JWT_SECRET|VITE_APP_ID"

# Testar conexão com banco
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"

# Testar API de LLM
curl -H "Authorization: Bearer $BUILT_IN_FORGE_API_KEY" \
  "$BUILT_IN_FORGE_API_URL/v1/models"
```

---

## 🗄️ Database Setup

### 1. Criar Banco de Dados

```sql
CREATE DATABASE social_media_ai_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'app_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON social_media_ai_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Executar Migrations

```bash
# Gerar e aplicar migrations
pnpm db:push

# Verificar schema
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD social_media_ai_db \
  -e "SHOW TABLES;"
```

---

## 🏗️ Build & Deployment

### 1. Build para Produção

```bash
# Limpar builds anteriores
rm -rf dist/

# Build completo
pnpm build

# Verificar tamanho
du -sh dist/
```

### 2. Deploy em Manus

```bash
# Via Management UI (Recomendado)
1. Criar checkpoint (já feito)
2. Clicar em "Publish" no Management UI
3. Selecionar domínio (xxx.manus.space ou custom)
4. Confirmar deployment
```

### 3. Deploy em Servidor Externo

```bash
# 1. Preparar código
git init
git add .
git commit -m "Initial deployment"

# 2. Conectar ao repositório remoto
git remote add origin https://github.com/seu-usuario/repo.git
git push -u origin main

# 3. Configurar em Railway/Render/Vercel
# - Conectar repositório GitHub
# - Definir variáveis de ambiente
# - Configurar build command: pnpm build
# - Configurar start command: pnpm start
# - Definir porta: 3000
```

---

## ✅ Testes Pré-Produção

### 1. Testes Unitários (Implementado)

```bash
pnpm test

# Esperado: 120 testes passando
# Status: ✅ PRONTO
```

### 2. Testes de Integração (Implementado Parcialmente)

Os seguintes testes de integração foram implementados:
- ✅ Notifications router (9 testes)
- ✅ Webhooks router (17 testes)
- ✅ KPI router (16 testes)
- ✅ Trend analysis router (13 testes)
- ✅ Alerts router (20 testes)

```bash
# Todos os testes de integração
pnpm test
```

### 3. Testes de Performance (Não Implementado)

⚠️ **Recomendação:** Implementar antes de produção
```bash
# Usar ferramentas externas:
# - Apache Bench: ab -n 1000 -c 10 https://seu-dominio.com/
# - wrk: wrk -t12 -c400 -d30s https://seu-dominio.com/api/trpc/kpi.getMetrics
# - Lighthouse: npm install -g lighthouse
```

### 4. Teste de Responsividade (Não Automatizado)

⚠️ **Recomendação:** Testar manualmente
```bash
# Testar em múltiplos breakpoints
- Desktop: 1280x720
- Tablet: 768x1024
- Mobile: 375x812
```

---

## 🔍 Monitoramento Pós-Deployment

### 1. Verificar Status

```bash
# Testar conexão
curl -s https://seu-dominio.com/ | head -20

# Verificar API
curl -s https://seu-dominio.com/api/trpc/auth.me | jq
```

### 2. Logs

```bash
# Ver logs em tempo real
tail -f .manus-logs/devserver.log
tail -f .manus-logs/browserConsole.log
tail -f .manus-logs/networkRequests.log

# Filtrar erros
grep "error\|ERROR\|Error" .manus-logs/*.log
```

### 3. Métricas Disponíveis

```bash
# Verificar performance via browser DevTools
- Network tab: Response times
- Console: Erros JavaScript
- Performance tab: Core Web Vitals
```

---

## 🔄 Rollback

### Rollback em Manus

```bash
# 1. Management UI → Version History
# 2. Selecionar versão anterior
# 3. Clicar "Rollback"
```

### Rollback de Database

```bash
# Backup antes de qualquer mudança
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  social_media_ai_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar se necessário
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  social_media_ai_db < backup_20260613_210000.sql
```

---

## 🛡️ Security Checklist

- [ ] HTTPS habilitado
- [ ] JWT_SECRET alterado (não usar padrão)
- [ ] Database password forte
- [ ] API keys rotacionadas
- [ ] CORS configurado corretamente
- [ ] Logs de auditoria habilitados
- [ ] Backup automático configurado
- [ ] Firewall configurado
- [ ] SSL certificate válido

**Não Implementado Ainda:**
- ⚠️ CSRF Protection (implementar middleware)
- ⚠️ Rate Limiting Global (implementar com Redis)
- ⚠️ Penetration Testing

---

## 🚨 Troubleshooting Comum

### Problema: 502 Bad Gateway
```bash
# Verificar se servidor está rodando
curl -v https://seu-dominio.com/

# Verificar logs
tail -100 .manus-logs/devserver.log

# Reiniciar servidor (em Manus)
# Via Management UI → Restart
```

### Problema: Database Connection Error
```bash
# Verificar credenciais
echo $DATABASE_URL

# Testar conexão
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"

# Verificar migrations
pnpm db:push
```

### Problema: LLM API Timeout
```bash
# Verificar API key
echo $BUILT_IN_FORGE_API_KEY

# Testar endpoint
curl -H "Authorization: Bearer $BUILT_IN_FORGE_API_KEY" \
  "$BUILT_IN_FORGE_API_URL/v1/models"
```

### Problema: Testes Falhando
```bash
# Limpar cache
rm -rf node_modules/.vite
rm -rf dist/

# Reinstalar
pnpm install

# Executar migrations
pnpm db:push

# Rodar testes
pnpm test
```

---

## 📞 Suporte e Escalação

### Contatos
- **Manus Support:** https://help.manus.im
- **LLM Issues:** Verificar `BUILT_IN_FORGE_API_URL/v1/models`
- **Database Issues:** Contatar provedor (Railway, Render, etc)

### Logs para Reportar
1. `.manus-logs/devserver.log` (últimas 100 linhas)
2. `.manus-logs/browserConsole.log` (erros)
3. `.manus-logs/networkRequests.log` (requests falhados)
4. Output de `pnpm test`

---

## ⚠️ Funcionalidades Não Implementadas

As seguintes funcionalidades estão no roadmap mas **não foram implementadas** nesta versão:

- [ ] CI/CD Pipeline (GitHub Actions, etc)
- [ ] Load Testing Automatizado
- [ ] Health Check Endpoint (`/health`)
- [ ] Monitoring/Observability Externo (Sentry, DataDog)
- [ ] Backup Automático (implementar com cron)
- [ ] Zero Downtime Deployment
- [ ] Seed Script de Dados Iniciais

---

## 📝 Changelog de Deployment

### v1.0.0 - 13 de Junho de 2026
- ✅ Initial production deployment
- ✅ 120 testes passando
- ✅ Backup manual configurado
- ✅ Rollback via Management UI

---

**Última Atualização:** 13 de Junho de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Produção (com recomendações)
