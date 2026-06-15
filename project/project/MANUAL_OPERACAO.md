# 📚 MANUAL DEFINITIVO DE OPERAÇÃO - SOCIALDASH PRO

**Versão:** 2.0 (Elite)  
**Última Atualização:** 13 de Junho de 2026  
**Nível:** Profissional / Comercial

---

## 🎯 O QUE É SOCIALDASH PRO?

SocialDash Pro é uma **plataforma SaaS profissional** que automatiza a análise, criação e otimização de conteúdo para redes sociais. Você não precisa abrir terminal, não precisa de conhecimento técnico. Tudo funciona por **botões e formulários** no seu navegador.

---

## 🚀 COMEÇANDO EM 5 MINUTOS

### Passo 1: Acesse o Dashboard
1. Abra seu navegador
2. Vá para: `https://seu-site.com`
3. Clique em **"Dashboard"** (botão azul no topo)

### Passo 2: Escolha um Script
Você tem 7 ferramentas disponíveis:

| Ferramenta | O que faz | Tempo | Resultado |
|-----------|----------|-------|-----------|
| 📊 **Detector de Outliers** | Encontra vídeos que viralizaram | 2-3s | JSON com URLs e views |
| 🎵 **Transcritor Whisper** | Extrai texto de áudio/vídeo | 5-30s | Arquivo .txt com transcrição |
| ✨ **Gerador de Repurpose** | Cria 3 ideias para outras plataformas | 3-5s | JSON com ideias prontas |
| 🎯 **Gerador SEO** | Cria título, descrição e tags | 2-3s | JSON com metadados |
| 🕸️ **Orquestrador Multi-Canal** | Gerencia 3-4 canais em paralelo | 5-10s | Dashboard com performance |
| 💰 **Otimizador de Funil** | Gera palavras-chave únicas + links | 3-5s | JSON com links rastreados |
| 📈 **Dashboard de Afiliados** | Rastreia conversões e ROI | 2-3s | Relatório completo |

### Passo 3: Preencha os Parâmetros
Cada script pede informações diferentes:

**Exemplo - Detector de Outliers:**
```
URL do Canal: https://www.youtube.com/@seu_canal
```

**Exemplo - Transcritor:**
```
URL do Vídeo: https://youtu.be/VIDEO_ID
```

**Exemplo - Gerador de Repurpose:**
```
Sua Transcrição: [Cole o texto aqui]
Seu Nicho: Comédia
Plataforma: TikTok
```

### Passo 4: Clique em "Executar"
O script roda **instantaneamente** e mostra o resultado na tela.

### Passo 5: Exporte os Dados
Clique em um dos botões:
- 📥 **CSV** - Para Excel
- 📥 **JSON** - Para APIs
- 📥 **PDF** - Para relatórios
- 📥 **Imagem** - Para apresentações

---

## 📊 DASHBOARD DE ANALYTICS

### O que você vê?

**Resumo Geral:**
- Total de execuções (todos os scripts)
- Taxa de sucesso (%)
- Tempo médio de execução
- Scripts mais usados

**Gráficos Interativos:**
- 📈 Tendência de execuções ao longo do tempo
- 🎯 Taxa de sucesso por script
- ⚡ Performance (tempo médio)
- 🔝 Scripts mais populares

**Filtros de Data:**
- Selecione período (últimos 7 dias, 30 dias, 90 dias, custom)
- Compare dois períodos lado a lado
- Veja variação em % (↑ crescimento, ↓ queda)

---

## 🎯 GUIA DE CADA FERRAMENTA

### 1️⃣ DETECTOR DE OUTLIERS

**Para quê?** Encontrar quais vídeos do seu canal (ou de concorrentes) tiveram mais visualizações.

**Como usar:**
1. Copie a URL do canal: `https://www.youtube.com/@seu_canal`
2. Cole no campo "URL do Canal"
3. Clique em "Executar"

**Resultado:**
```json
{
  "outliers": [
    {
      "title": "Título do Vídeo Viral",
      "views": 150000,
      "url": "https://youtu.be/...",
      "percentageAboveAverage": 250
    }
  ],
  "averageViews": 5000,
  "totalVideos": 30
}
```

**O que fazer com isso:**
- Estude os 3 vídeos com mais views
- Identifique o padrão (tema, duração, thumbnail, horário)
- Replique o formato em novos vídeos

---

### 2️⃣ TRANSCRITOR WHISPER (LOCAL)

**Para quê?** Extrair texto de vídeos do YouTube (100% gratuito, sem API key).

**Como usar:**
1. Copie a URL do vídeo: `https://youtu.be/VIDEO_ID`
2. Cole no campo "URL do Vídeo"
3. Clique em "Executar"
4. Aguarde 5-30 segundos (depende da duração)

**Resultado:**
```
Arquivo: transcription.txt
Conteúdo: Texto completo do vídeo
```

**O que fazer com isso:**
- Use para criar roteiros
- Alimente no Gerador de Repurpose
- Extraia palavras-chave para SEO
- Crie legendas automáticas

---

### 3️⃣ GERADOR DE REPURPOSE

**Para quê?** Transformar um vídeo em 3 ideias para outras plataformas.

**Como usar:**
1. Cole a transcrição (ou resumo) do seu vídeo
2. Selecione seu nicho (Comédia, Gaming, Curiosidade, etc)
3. Escolha a plataforma (TikTok, Instagram Reels, YouTube Shorts)
4. Clique em "Executar"

**Resultado:**
```json
{
  "ideas": [
    {
      "platform": "TikTok",
      "title": "Título otimizado para TikTok",
      "description": "Descrição com hashtags",
      "duration": "15-60 segundos",
      "hook": "Gancho para os primeiros 3 segundos"
    }
  ]
}
```

**O que fazer com isso:**
- Use o "hook" para começar seu vídeo
- Copie a descrição com hashtags
- Siga as recomendações de duração

---

### 4️⃣ GERADOR DE METADADOS SEO

**Para quê?** Criar título, descrição e tags otimizadas para YouTube.

**Como usar:**
1. Cole a transcrição do seu vídeo
2. Selecione seu nicho
3. Clique em "Executar"

**Resultado:**
```json
{
  "title": "Título clicável com 60 caracteres",
  "description": "Descrição persuasiva com keywords",
  "tags": ["tag1", "tag2", "tag3", ...],
  "ctr_estimate": "8.5%"
}
```

**O que fazer com isso:**
- Copie o título exato para YouTube
- Cole a descrição (pode editar)
- Adicione as tags sugeridas

---

### 5️⃣ ORQUESTRADOR MULTI-CANAL

**Para quê?** Gerenciar 3-4 canais do mesmo nicho em paralelo (crescimento exponencial).

**Como usar:**
1. Selecione número de canais: 3 ou 4
2. Selecione seu nicho
3. Clique em "Executar"

**Resultado:**
```json
{
  "channels": [
    {
      "name": "Canal 1",
      "performance": "85%",
      "recommendations": ["Aumentar frequência", "Mudar horário"]
    }
  ],
  "synergy_effect": "3x crescimento esperado"
}
```

**O que fazer com isso:**
- Implemente as recomendações
- Publique conteúdo similar em todos os canais
- Monitore performance comparativa

---

### 6️⃣ OTIMIZADOR DE FUNIL

**Para quê?** Gerar palavras-chave únicas e links de afiliado rastreados para monetização.

**Como usar:**
1. Cole a transcrição
2. Selecione o tema (ex: "Tecnologia", "Saúde")
3. Selecione plataforma de afiliado (Amazon, Hotmart, etc)
4. Clique em "Executar"

**Resultado:**
```json
{
  "keywords": ["palavra-chave 1", "palavra-chave 2"],
  "affiliate_links": [
    {
      "product": "Nome do Produto",
      "link": "https://seu-link-rastreado.com",
      "commission": "5-15%"
    }
  ]
}
```

**O que fazer com isso:**
- Coloque os links na descrição do vídeo
- Use com ManyChat para converter comentários
- Rastreie conversões no Dashboard

---

### 7️⃣ DASHBOARD DE AFILIADOS

**Para quê?** Rastrear cliques, conversões e ROI de todos seus links.

**Como usar:**
1. Clique em "Executar"
2. Aguarde 2-3 segundos

**Resultado:**
```json
{
  "total_clicks": 1250,
  "conversions": 45,
  "conversion_rate": "3.6%",
  "revenue": "R$ 2.250",
  "roi": "450%"
}
```

**O que fazer com isso:**
- Identifique links com melhor performance
- Duplique estratégia dos links que convertem
- Teste novos produtos com baixo ROI

---

## 🔒 SEGURANÇA E PRIVACIDADE

### Seus dados estão seguros?

✅ **SIM.** Implementamos:

- **Criptografia SSL/TLS** - Dados em trânsito protegidos
- **Autenticação OAuth** - Login seguro
- **Rate Limiting** - Proteção contra abuso
- **Validação de Input** - Sem injeção de código
- **Logging de Segurança** - Rastreamento de todas as ações
- **Timeout de Sessão** - Logout automático após 30 min

### Seus dados são vendidos?

❌ **NÃO.** Seus dados:
- Não são compartilhados com terceiros
- Não são usados para treinar modelos de IA
- São deletados após 90 dias (conforme LGPD)
- Você pode solicitar exclusão a qualquer momento

---

## ⚡ DICAS DE PRO

### 1. Combine Scripts para Máxima Eficiência

**Fluxo Recomendado:**
```
1. Detector de Outliers → Encontre vídeo viral
2. Transcritor → Extraia o texto
3. Gerador de Repurpose → Crie 3 ideias
4. Gerador SEO → Otimize metadados
5. Publicar em 3 plataformas
6. Rastrear com Dashboard de Afiliados
```

**Tempo Total:** 15-20 minutos para 3 vídeos prontos

### 2. Use Filtros de Data para Análise

- **Últimos 7 dias:** Veja tendências semanais
- **Últimos 30 dias:** Identifique padrões mensais
- **Comparação:** Veja se implementações melhoraram performance

### 3. Exporte Dados para Excel

- Clique em **CSV** no Dashboard
- Abra em Excel
- Crie gráficos customizados
- Compartilhe com equipe

### 4. Automatize com Zapier/Make

Você pode conectar SocialDash Pro com:
- Google Sheets (salvar resultados automaticamente)
- Slack (receber alertas)
- Discord (notificações em tempo real)
- Notion (organizar dados)

---

## 🆘 TROUBLESHOOTING

### Problema: "Script timeout"
**Solução:** O script levou mais de 30 segundos. Tente novamente.

### Problema: "Muitas execuções"
**Solução:** Você atingiu o limite de 10 execuções/minuto. Aguarde 1 minuto.

### Problema: "Script não encontrado"
**Solução:** Recarregue a página (F5) e tente novamente.

### Problema: "Erro de autenticação"
**Solução:** Faça logout e login novamente.

### Problema: "Output muito grande"
**Solução:** O resultado excedeu 10MB. Tente com entrada menor.

---

## 📞 SUPORTE

**Email:** suporte@socialdash.pro  
**Chat:** Disponível no site (seg-sex, 9h-18h)  
**Documentação:** https://docs.socialdash.pro  
**Status:** https://status.socialdash.pro

---

## 📈 ROADMAP FUTURO

**Próximas Features (Q3 2026):**
- ✅ Integração com TikTok API
- ✅ Análise de Sentimento em Comentários
- ✅ Geração de Thumbnails com IA
- ✅ Automação com Zapier/Make
- ✅ Relatórios PDF automáticos

---

**Obrigado por usar SocialDash Pro! 🚀**

*Transformando criadores em produtores de conteúdo profissionais.*
