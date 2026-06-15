# Load Testing Guide - Social Media AI Automation Dashboard

## Overview

Este documento descreve os procedimentos e ferramentas para realizar testes de carga no dashboard, garantindo que o sistema suporte a produção com múltiplos usuários simultâneos.

---

## 1. Ferramentas de Teste

### Apache JMeter

```bash
# Instalar JMeter
brew install jmeter  # macOS
apt-get install jmeter  # Linux

# Executar teste
jmeter -n -t test-plan.jmx -l results.jtl -j jmeter.log
```

### K6 (Recomendado)

```bash
# Instalar K6
brew install k6  # macOS
apt-get install k6  # Linux

# Executar teste
k6 run load-test.js
```

### Artillery

```bash
# Instalar Artillery
npm install -g artillery

# Executar teste
artillery run load-test.yml
```

---

## 2. Cenários de Teste

### Cenário 1: Carga Normal (100 usuários)

```javascript
// load-test.js (K6)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp-up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'load time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Cenário 2: Carga Pico (500 usuários)

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 500 },   // Ramp-up rápido
    { duration: '3m', target: 500 },   // Sustain
    { duration: '1m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};
```

### Cenário 3: Teste de Resistência (24h)

```javascript
export const options = {
  stages: [
    { duration: '10m', target: 50 },    // Warm-up
    { duration: '23h', target: 50 },    // Sustain por 23 horas
    { duration: '10m', target: 0 },     // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

---

## 3. Testes de API Específicos

### Teste de Notificações

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  // Enviar notificação
  const payload = JSON.stringify({
    title: 'Test Notification',
    body: 'This is a test',
    type: 'info',
  });

  const res = http.post('http://localhost:3000/api/trpc/notifications.sendNotification', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'notification sent': (r) => r.status === 200,
  });

  // Listar notificações
  const listRes = http.get('http://localhost:3000/api/trpc/notifications.listNotifications');
  check(listRes, {
    'list successful': (r) => r.status === 200,
  });

  sleep(1);
}
```

### Teste de Webhooks

```javascript
export default function () {
  // Criar webhook
  const createRes = http.post('http://localhost:3000/api/trpc/webhooks.createWebhook', 
    JSON.stringify({
      url: 'https://webhook.site/test',
      events: ['job.completed'],
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(createRes, {
    'webhook created': (r) => r.status === 200,
  });

  // Disparar webhook
  const triggerRes = http.post('http://localhost:3000/api/trpc/webhooks.triggerWebhook',
    JSON.stringify({ webhookId: 'test-id' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(triggerRes, {
    'webhook triggered': (r) => r.status === 200,
  });

  sleep(1);
}
```

---

## 4. Resultados Esperados

### Métricas de Sucesso

| Métrica | Target | Limite |
|---------|--------|--------|
| Response Time (p95) | < 500ms | < 1000ms |
| Response Time (p99) | < 1000ms | < 2000ms |
| Error Rate | < 0.1% | < 1% |
| Throughput | > 100 req/s | > 50 req/s |
| CPU Usage | < 70% | < 90% |
| Memory Usage | < 60% | < 80% |
| Database Connections | < 50 | < 100 |

### Exemplo de Resultado

```
Scenario: Load Test (100 users)
Duration: 9 minutes
Requests: 54,000
Success Rate: 99.95%
Error Rate: 0.05%

Response Times:
  Min: 45ms
  Max: 2,340ms
  Mean: 285ms
  p50: 220ms
  p95: 480ms
  p99: 950ms

Throughput: 100 req/s
```

---

## 5. Executar Testes Localmente

### Setup

```bash
# Instalar K6
brew install k6

# Criar arquivo de teste
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
EOF
```

### Executar

```bash
# Iniciar servidor
pnpm dev

# Em outro terminal, executar teste
k6 run load-test.js

# Ou com saída detalhada
k6 run -v load-test.js
```

---

## 6. Monitoramento Durante Testes

### Métricas do Sistema

```bash
# Monitorar CPU e memória
top -p $(pgrep -f "node dist/index.js")

# Monitorar conexões de banco de dados
mysql -u root -p -e "SHOW PROCESSLIST;"

# Monitorar logs
tail -f .manus-logs/devserver.log
```

### Alertas

Configurar alertas para:

- CPU > 80%
- Memória > 80%
- Error rate > 1%
- Response time p95 > 1000ms
- Database connections > 100

---

## 7. Análise de Resultados

### Gráficos Importantes

1. **Response Time Over Time**: Verificar se há degradação
2. **Error Rate Over Time**: Verificar se há picos de erro
3. **Throughput Over Time**: Verificar consistência
4. **Resource Usage**: CPU, memória, conexões DB

### Relatório de Teste

```markdown
# Load Test Report

**Data**: 14/06/2026
**Duração**: 9 minutos
**Usuários Simultâneos**: 100

## Resultados

### Performance
- Response Time (p95): 480ms ✅
- Error Rate: 0.05% ✅
- Throughput: 100 req/s ✅

### Recursos
- CPU Peak: 65% ✅
- Memory Peak: 450MB ✅
- DB Connections: 45 ✅

### Conclusão
Sistema passou em todos os critérios de aceitação.
Pronto para produção com até 500 usuários simultâneos.
```

---

## 8. Otimizações Recomendadas

Se os testes falharem:

1. **Aumentar cache**: Implementar Redis
2. **Otimizar queries**: Adicionar índices no banco
3. **Rate limiting**: Configurar limites por usuário
4. **Connection pooling**: Aumentar pool de conexões
5. **Compressão**: Habilitar gzip

---

## 9. Teste de Carga em Produção

### Pré-requisitos

- [ ] Todos os testes locais passando
- [ ] Backup do banco de dados realizado
- [ ] Monitoramento ativo (Sentry, Datadog, etc)
- [ ] Equipe de suporte em standby
- [ ] Rollback plan preparado

### Execução

```bash
# Teste com 10% da carga esperada
k6 run --vus 50 --duration 10m load-test.js

# Monitorar resultados
# Se OK, aumentar para 50%
k6 run --vus 250 --duration 10m load-test.js

# Se OK, aumentar para 100%
k6 run --vus 500 --duration 30m load-test.js
```

---

## 10. Próximos Passos

1. Executar testes locais com 100 usuários
2. Analisar resultados e otimizar se necessário
3. Executar testes de resistência (24h)
4. Documentar limites do sistema
5. Configurar alertas em produção

---

**Versão**: 1.0  
**Data**: 14/06/2026  
**Status**: ✅ Pronto para execução
