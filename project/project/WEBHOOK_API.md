# Webhook API Documentation

## Overview

O sistema de webhooks permite que plataformas de automação como Zapier e Make.com acionem scripts Python automaticamente. Cada webhook está associado a um tipo de script específico e pode ser configurado com parâmetros customizados.

## Endpoints

### 1. Trigger Script Execution

**Endpoint:** `POST /api/trpc/webhooks.trigger`

**Description:** Aciona a execução de um script via webhook

**Request Body:**
```json
{
  "scriptType": "youtube_outlier_detector",
  "parameters": {
    "channel_url": "https://www.youtube.com/@channel",
    "threshold": 1.5
  },
  "webhookSignature": "optional-signature",
  "userId": 123
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scriptType` | string | Yes | Tipo de script a executar. Valores válidos: `youtube_outlier_detector`, `audio_transcriber_free`, `repurpose_script`, `seo_metadata_script`, `multi_channel_orchestrator`, `monetization_funnel_optimizer`, `affiliate_tracking_dashboard` |
| `parameters` | object | Yes | Parâmetros específicos do script como key-value pairs |
| `webhookSignature` | string | No | Assinatura HMAC para validação de segurança |
| `userId` | number | No | ID do usuário para rastreamento de execução |

**Response:**
```json
{
  "success": true,
  "executionId": "exec-1781384000000-abc123def",
  "message": "Script execution started",
  "statusUrl": "/api/webhooks/status/exec-1781384000000-abc123def"
}
```

### 2. Get Webhook Signature

**Endpoint:** `GET /api/trpc/webhooks.getSignature`

**Description:** Gera uma assinatura HMAC para validar requisições de webhook

**Request Body:**
```json
{
  "payload": "{\"scriptType\":\"youtube_outlier_detector\",\"parameters\":{\"channel_url\":\"https://www.youtube.com/@channel\"}}"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "sha256_hex_encoded_signature"
}
```

### 3. Validate Webhook

**Endpoint:** `POST /api/trpc/webhooks.validate`

**Description:** Valida a configuração de um webhook testando conectividade

**Request Body:**
```json
{
  "webhookUrl": "https://hooks.zapier.com/hooks/catch/12345/abc123/"
}
```

**Response:**
```json
{
  "success": true,
  "isHealthy": true,
  "message": "Webhook is reachable and responding correctly"
}
```

## Script Types & Parameters

### 1. YouTube Outlier Detector

Detecta vídeos com performance anormalmente alta em um canal.

**Parameters:**
```json
{
  "channel_url": "https://www.youtube.com/@channelname",
  "threshold": 1.5
}
```

### 2. Audio Transcriber (Free)

Transcreve áudio de vídeos do YouTube usando Whisper local.

**Parameters:**
```json
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "language": "pt"
}
```

### 3. Repurpose Script Generator

Gera ideias de conteúdo para diferentes plataformas.

**Parameters:**
```json
{
  "transcription": "Your video transcription text here",
  "niche": "gaming",
  "platform": "TikTok"
}
```

### 4. SEO Metadata Generator

Gera títulos, descrições e tags otimizadas para YouTube.

**Parameters:**
```json
{
  "transcription": "Your video transcription text here",
  "niche": "gaming"
}
```

### 5. Multi-Channel Orchestrator

Gerencia múltiplos canais do mesmo nicho em paralelo.

**Parameters:**
```json
{
  "channels": ["channel1", "channel2", "channel3"],
  "niche": "gaming",
  "schedule": "daily"
}
```

### 6. Monetization Funnel Optimizer

Otimiza funil de monetização com palavras-chave e links rastreados.

**Parameters:**
```json
{
  "transcription": "Your video transcription text here",
  "theme": "gaming",
  "affiliate_program": "amazon"
}
```

### 7. Affiliate Tracking Dashboard

Rastreia conversões e ROI por vídeo e canal.

**Parameters:**
```json
{
  "analyze": true
}
```

## Security

### Webhook Signature Validation

Para maior segurança, implemente validação de assinatura:

1. **Gerar Assinatura:**
   ```bash
   curl -X GET "https://api.example.com/api/trpc/webhooks.getSignature" \
     -H "Content-Type: application/json" \
     -d '{"payload": "YOUR_PAYLOAD_JSON"}'
   ```

2. **Incluir na Requisição:**
   ```json
   {
     "scriptType": "youtube_outlier_detector",
     "parameters": {...},
     "webhookSignature": "signature_from_step_1"
   }
   ```

3. **Validação no Backend:**
   O servidor verifica se a assinatura é válida usando HMAC-SHA256.

### Rate Limiting

- **Limite:** 100 requisições por minuto por IP
- **Comportamento:** Retorna `429 Too Many Requests` quando excedido

### HTTPS Required

Todas as URLs de webhook devem usar HTTPS. URLs HTTP serão rejeitadas.

## Integration Examples

### Zapier Integration

1. **Create a Zap:**
   - Trigger: Your preferred trigger (e.g., "New item in list")
   - Action: "Webhooks by Zapier" → "POST"

2. **Configure Webhook:**
   - URL: `https://your-app.com/api/trpc/webhooks.trigger`
   - Method: POST
   - Data (Raw):
   ```json
   {
     "scriptType": "youtube_outlier_detector",
     "parameters": {
       "channel_url": "{{trigger.channel_url}}",
       "threshold": 1.5
     }
   }
   ```

3. **Test & Publish**

### Make.com Integration

1. **Create a Scenario:**
   - Module: HTTP → Make a request

2. **Configure Request:**
   - URL: `https://your-app.com/api/trpc/webhooks.trigger`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body:
   ```json
   {
     "scriptType": "audio_transcriber_free",
     "parameters": {
       "video_url": "{{1.video_url}}"
     }
   }
   ```

3. **Map & Execute**

## Error Handling

### Common Errors

| Error Code | Message | Solution |
|-----------|---------|----------|
| 400 | Invalid webhook URL | Verifique se a URL é válida e usa HTTPS |
| 401 | Invalid webhook signature | Regenere a assinatura e tente novamente |
| 422 | Invalid script type | Use um dos tipos de script suportados |
| 429 | Too many requests | Aguarde antes de fazer mais requisições |
| 500 | Internal server error | Contate o suporte |

### Response Error Format

```json
{
  "code": "BAD_REQUEST",
  "message": "Invalid webhook URL"
}
```

## Best Practices

1. **Always use HTTPS** for webhook URLs
2. **Implement signature validation** for security
3. **Handle timeouts** gracefully (5 second timeout per request)
4. **Log execution IDs** for tracking
5. **Retry failed requests** with exponential backoff
6. **Monitor rate limits** and adjust frequency accordingly
7. **Test webhooks** before deploying to production

## Monitoring & Debugging

### Check Execution Status

Use o `executionId` retornado para rastrear o status via tRPC:

```bash
curl -X POST "https://your-app.com/api/trpc/executionStatus.getStatus" \
  -H "Content-Type: application/json" \
  -d '{"executionId": "exec-1781384000000-abc123def"}'
```

**Response:**
```json
{
  "executionId": "exec-1781384000000-abc123def",
  "status": "success",
  "progress": 100,
  "startedAt": "2026-06-13T20:50:00Z",
  "completedAt": "2026-06-13T20:55:00Z",
  "output": "Script executed successfully",
  "error": null
}
```

### View Execution History

Listar execuções recentes:

```bash
curl -X POST "https://your-app.com/api/trpc/executionStatus.listRecent" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "offset": 0}'
```

### Get Execution Statistics

Obtener estatísticas de execução:

```bash
curl -X POST "https://your-app.com/api/trpc/executionStatus.getStats" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "total": 150,
  "successful": 135,
  "failed": 10,
  "pending": 5,
  "successRate": "90.00",
  "averageExecutionTime": "45000"
}
```

## Rate Limits & Quotas

- **Requests per minute:** 100
- **Execution timeout:** 5 minutes
- **Maximum payload size:** 10MB
- **Storage retention:** Configurável por usuário
- **Concurrent executions:** 1 por webhook

## Support

Para suporte e dúvidas:
- Consulte a documentação do projeto
- Verifique os logs de execução no dashboard
- Valide sua configuração de webhook com o endpoint `/api/trpc/webhooks.validate`
