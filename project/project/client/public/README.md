# Social Media AI Automation - Zero-Cost Toolkit

Sistema completo de automação para redes sociais com análise de conteúdo viral, transcrição local, geração de roteiros e monetização inteligente. **100% gratuito** usando modelos locais e APIs livres.

## 🎯 Visão Geral

Este toolkit oferece uma solução end-to-end para crescimento de canais YouTube e redes sociais:

1. **Detecção de Outliers**: Identifica vídeos virais (Super Outliers) em um canal
2. **Transcrição Local**: Transcreve áudio/vídeo com `faster-whisper` (gratuito, offline)
3. **Geração de Conteúdo**: Cria ideias de repurpose e metadados SEO com Groq
4. **Orquestração Multi-Canal**: Gerencia 3-4 canais em paralelo
5. **Monetização Inteligente**: Gera palavras-chave únicas e links rastreados
6. **Rastreamento de Afiliados**: Dashboard de ROI e conversões

## 📋 Pré-requisitos

- **Python 3.8+**
- **FFmpeg** (para processamento de áudio)
- **Conexão com Internet** (apenas para download inicial de modelos)

### Instalação do FFmpeg

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Baixe de https://ffmpeg.org/download.html ou use:
```bash
choco install ffmpeg
```

## 🚀 Instalação Rápida

```bash
# 1. Clone ou extraia o projeto
cd social_ai_research

# 2. Crie um ambiente virtual (recomendado)
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# ou: venv\Scripts\activate  # Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Pronto! Execute qualquer script
python youtube_outlier_detector.py "https://www.youtube.com/@seu_canal"
```

## 📚 Scripts Disponíveis

### 1. YouTube Outlier Detector
Identifica vídeos virais (Super Outliers) em um canal.

**Uso:**
```bash
python youtube_outlier_detector.py "https://www.youtube.com/@channel_name"
python youtube_outlier_detector.py "https://www.youtube.com/@channel" --num-videos 50 --output results.json
```

**Argumentos:**
- `channel_url`: URL do canal YouTube
- `--num-videos, -n`: Número de vídeos a analisar (padrão: 30)
- `--multiplier, -m`: Multiplicador para considerar Super Outlier (padrão: 3.0)
- `--output, -o`: Arquivo JSON para salvar resultados
- `--db`: Caminho do banco de dados de cache

**Exemplo:**
```bash
python youtube_outlier_detector.py "https://www.youtube.com/@fatosdesconhecidos" \
  --num-videos 50 \
  --multiplier 2.5 \
  --output outliers.json
```

### 2. Audio Transcriber Free
Transcreve vídeos YouTube usando `faster-whisper` (100% local e gratuito).

**Uso:**
```bash
python audio_transcriber_free.py "https://youtu.be/VIDEO_ID"
python audio_transcriber_free.py "https://youtu.be/VIDEO_ID" --model small --language pt
```

**Argumentos:**
- `video_url`: URL do vídeo YouTube
- `--model, -m`: Tamanho do modelo (tiny, base, small, medium) - padrão: base
- `--language, -l`: Código do idioma (pt, en, es) - auto-detecta se não especificado
- `--output, -o`: Arquivo JSON para salvar transcrição
- `--audio-file, -a`: Caminho para salvar o áudio baixado

**Exemplo:**
```bash
python audio_transcriber_free.py "https://youtu.be/dQw4w9WgXcQ" \
  --model small \
  --language pt \
  --output transcription.json
```

**Modelos Disponíveis:**
- `tiny`: ~39MB, ~1-2 min para 10 min de áudio (recomendado para testes)
- `base`: ~140MB, ~2-3 min para 10 min de áudio (padrão, bom equilíbrio)
- `small`: ~465MB, ~5-8 min para 10 min de áudio (mais preciso)
- `medium`: ~1.5GB, ~10-15 min para 10 min de áudio (muito preciso)

### 3. Repurpose Script
Gera 3 ideias de conteúdo otimizadas para diferentes plataformas.

**Uso:**
```bash
python repurpose_script.py "sua_transcrição" "seu_nicho"
python repurpose_script.py "transcrição" "Curiosidades" --platform TikTok --output ideas.json
```

**Argumentos:**
- `transcription`: Transcrição do vídeo
- `niche`: Nicho do conteúdo (ex: Curiosidades, Comédia)
- `--platform, -p`: Plataforma específica para priorizar
- `--model, -m`: Modelo Groq a usar (padrão: mixtral-8x7b-32768)
- `--output, -o`: Arquivo JSON para salvar ideias

**Exemplo:**
```bash
python repurpose_script.py "A síndrome de Estocolmo..." "Curiosidades" \
  --platform TikTok \
  --output repurpose_ideas.json
```

### 4. SEO Metadata Script
Gera metadados SEO otimizados para vídeos.

**Uso:**
```bash
python seo_metadata_script.py "sua_transcrição" "seu_nicho"
python seo_metadata_script.py "transcrição" "Curiosidades" --platform YouTube --output metadata.json
```

**Argumentos:**
- `transcription`: Transcrição do vídeo
- `niche`: Nicho do conteúdo
- `--platform, -p`: Plataforma alvo (YouTube, TikTok, Instagram) - padrão: YouTube
- `--model, -m`: Modelo Groq a usar
- `--output, -o`: Arquivo JSON para salvar metadados

### 5. Multi-Channel Orchestrator
Gerencia 3-4 canais do mesmo nicho em paralelo (Efeito Teia).

**Uso:**
```bash
python multi_channel_orchestrator.py --channels 3 --niche curiosidade
python multi_channel_orchestrator.py --channels 4 --niche "Curiosidades e Psicologia" --output network.json
```

**Argumentos:**
- `--channels, -c`: Número de canais (padrão: 3)
- `--niche, -n`: Nicho dos canais (padrão: Curiosidades)
- `--output, -o`: Arquivo JSON para salvar relatório
- `--db`: Caminho do banco de dados

### 6. Monetization Funnel Optimizer
Gera palavras-chave únicas e links de afiliado rastreados.

**Uso:**
```bash
python monetization_funnel_optimizer.py "sua_transcrição" "tema" "plataforma_afiliado"
python monetization_funnel_optimizer.py "transcrição" "egito" "amazon" --output funnel.json
```

**Argumentos:**
- `transcription`: Transcrição do vídeo
- `theme`: Tema do vídeo (egito, ciência, conspiração, história, tecnologia, natureza, psicologia, comédia)
- `platform`: Plataforma de afiliado (amazon, udemy, hotmart, monetizze, kiwify)
- `--output, -o`: Arquivo JSON para salvar configuração
- `--db`: Caminho do banco de dados

**Exemplo:**
```bash
python monetization_funnel_optimizer.py "A história do Egito..." "egito" "amazon" \
  --output monetization.json
```

### 7. Affiliate Tracking Dashboard
Dashboard de rastreamento de afiliados com análise de ROI.

**Uso:**
```bash
python affiliate_tracking_dashboard.py
python affiliate_tracking_dashboard.py --analyze
python affiliate_tracking_dashboard.py --report daily --output report.json
```

**Argumentos:**
- `--analyze, -a`: Executar análise completa
- `--report, -r`: Tipo de relatório (daily, weekly, monthly)
- `--output, -o`: Arquivo JSON para salvar relatório
- `--db`: Caminho do banco de dados

## 🔄 Fluxo de Trabalho Completo

### Exemplo Prático: Do YouTube ao Faturamento

```bash
# 1. Analisar canal e encontrar Super Outliers
python youtube_outlier_detector.py "https://www.youtube.com/@seu_canal" \
  --num-videos 50 \
  --output outliers.json

# 2. Transcrever o melhor vídeo (Super Outlier)
python audio_transcriber_free.py "https://youtu.be/VIDEO_ID_DO_OUTLIER" \
  --model small \
  --output transcription.json

# 3. Gerar ideias de repurpose
python repurpose_script.py "$(cat transcription.json | grep transcription)" \
  "seu_nicho" \
  --output repurpose.json

# 4. Gerar metadados SEO
python seo_metadata_script.py "$(cat transcription.json | grep transcription)" \
  "seu_nicho" \
  --output seo.json

# 5. Otimizar funil de monetização
python monetization_funnel_optimizer.py "$(cat transcription.json | grep transcription)" \
  "seu_tema" \
  "amazon" \
  --output monetization.json

# 6. Visualizar dashboard de afiliados
python affiliate_tracking_dashboard.py --analyze
```

## 💰 Estratégia Zero-Cost

Todos os scripts usam **tecnologias gratuitas**:

| Componente | Solução | Custo |
|---|---|---|
| Transcrição | `faster-whisper` (local) | 🟢 Grátis |
| IA/LLM | Groq API (free tier) | 🟢 Grátis |
| Download de Vídeos | `yt-dlp` | 🟢 Grátis |
| Banco de Dados | SQLite | 🟢 Grátis |
| Processamento | Python | 🟢 Grátis |

**Economia Estimada:** R$ 0,42 por vídeo processado (vs. OpenAI Whisper + GPT-4 que custaria R$ 2-5)

## 🗄️ Banco de Dados

Cada script cria um banco de dados SQLite para cache e rastreamento:

- `outlier_cache.db`: Cache de análises de canais
- `transcription_cache.db`: Cache de transcrições
- `channel_network.db`: Dados de orquestração multi-canal
- `monetization_tracking.db`: Rastreamento de monetização
- `affiliate_tracking.db`: Métricas de afiliados

## 🔑 Configuração de Variáveis de Ambiente

### Groq API (Gratuito)

1. Crie uma conta em https://console.groq.com
2. Gere uma API key
3. Configure a variável de ambiente:

```bash
export GROQ_API_KEY="sua_chave_aqui"
```

Ou crie um arquivo `.env`:
```
GROQ_API_KEY=sua_chave_aqui
```

## 📊 Exemplos de Saída

### YouTube Outlier Detector
```json
{
  "channel_url": "https://www.youtube.com/@fatosdesconhecidos",
  "analysis_date": "2026-06-13T10:30:00",
  "statistics": {
    "total_videos": 30,
    "avg_views": 1200,
    "std_dev": 450,
    "min_views": 800,
    "max_views": 12000
  },
  "outliers": [
    {
      "video_id": "video_014",
      "title": "Vídeo #14 - Conteúdo Viral",
      "views": 12000,
      "multiplier": 10.0,
      "above_avg": 10800
    }
  ]
}
```

### Audio Transcriber Free
```json
{
  "transcription": "A síndrome de Estocolmo é...",
  "segments": [
    {
      "start": 0.0,
      "end": 5.2,
      "text": "A síndrome de Estocolmo é um fenômeno psicológico..."
    }
  ],
  "language": "pt",
  "duration": 25.0,
  "metadata": {
    "model_size": "base",
    "language_detected": "pt",
    "total_segments": 5
  }
}
```

## 🐛 Troubleshooting

### Erro: "yt-dlp não instalado"
```bash
pip install yt-dlp
```

### Erro: "faster-whisper não instalado"
```bash
pip install faster-whisper
```

### Erro: "FFmpeg não encontrado"
Instale FFmpeg conforme instruções acima.

### Erro: "Groq API key não configurada"
```bash
export GROQ_API_KEY="sua_chave_aqui"
```

### Transcrição muito lenta
Use um modelo menor:
```bash
python audio_transcriber_free.py "URL" --model tiny
```

## 📈 Performance

Tempos de processamento típicos (em máquina com CPU moderna):

| Tarefa | Tempo | Modelo |
|---|---|---|
| Análise de 30 vídeos | ~2-3s | YouTube Outlier Detector |
| Transcrição 10 min áudio | ~2-3 min | faster-whisper (base) |
| Geração de ideias | ~3-5s | Groq API |
| Geração de metadados | ~2-3s | Groq API |
| Análise multi-canal | ~5-10s | Multi-Channel Orchestrator |

## 🤝 Contribuições

Melhorias e sugestões são bem-vindas! Abra uma issue ou pull request.

## 📄 Licença

Este projeto é fornecido como-é para fins educacionais e comerciais.

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique o arquivo README.md
2. Consulte a documentação de cada script (`python script.py --help`)
3. Verifique os logs em `.manus-logs/`

## 🚀 Próximos Passos

1. **Integração com Zapier/Make**: Automatize o fluxo completo
2. **Dashboard Web**: Interface visual para gerenciar campanhas
3. **Integração com Notion**: Sincronize dados com seu workspace
4. **Suporte a TikTok/Instagram**: Expanda para outras plataformas
5. **Modelo de Previsão**: Preveja quais vídeos viralão

---

**Desenvolvido com ❤️ para criadores de conteúdo que querem crescer sem gastar.**
