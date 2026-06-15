#!/usr/bin/env python3
"""
Roteiro Generator - Versão Otimizada com Groq API (100% Gratuita)
==================================================================
Gera roteiros virais a partir de transcrições usando Groq (modelo Llama 3).
API gratuita com quotas generosas. Sem cartão de crédito necessário.

Instalação:
    pip install groq

Configuração:
    1. Vá para https://console.groq.com
    2. Crie uma conta (gratuita)
    3. Gere uma API Key
    4. Exporte: export GROQ_API_KEY="sua_chave_aqui"

Uso:
    python roteiro_generator_free.py "Sua transcrição aqui" "tiktok" "curiosidade"
"""

import os
import sys
from groq import Groq

def get_groq_client():
    """Inicializa o cliente Groq com a API Key."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "❌ GROQ_API_KEY não configurada!\n"
            "Execute: export GROQ_API_KEY='sua_chave_aqui'\n"
            "Obtenha em: https://console.groq.com"
        )
    return Groq(api_key=api_key)

def generate_roteiro(transcription, platform="tiktok", niche="curiosidade"):
    """
    Gera um roteiro viral usando Groq (Llama 3 - GRÁTIS).
    
    Plataformas: tiktok, reels, youtube_shorts
    Nichos: curiosidade, comédia, educação, notícias, lifestyle, negócios
    """
    
    client = get_groq_client()
    
    # Prompt otimizado para gerar conteúdo viral
    prompt = f"""Você é um roteirista de Hollywood especializado em conteúdo viral para redes sociais.

TAREFA: Reescreva a transcrição abaixo em um roteiro de vídeo curto para {platform.upper()}.
NICHO: {niche.upper()}
DURAÇÃO: 60 segundos máximo

INSTRUÇÕES CRÍTICAS:
1. GANCHO (0-3s): Comece com uma frase que FORÇA o usuário a continuar assistindo. Use:
   - Pergunta provocativa ("Você não vai acreditar...")
   - Afirmação chocante ("O que você está prestes a ver...")
   - Curiosidade imediata ("Espera só até o final...")

2. DESENVOLVIMENTO (3-50s): Mantenha o ritmo ACELERADO. Use:
   - Frases curtas (máximo 10 palavras)
   - Transições visuais (zoom, corte rápido)
   - Pausa dramática quando necessário

3. CLÍMAX (50-55s): Construa para uma revelação ou "aha moment"

4. CTA (55-60s): Termine com uma ação clara:
   - "Salva esse vídeo"
   - "Comenta o que você achou"
   - "Segue para mais"

FORMATO DE SAÍDA:
[0-3s] GANCHO: [seu texto aqui]
[3-50s] DESENVOLVIMENTO: [seu texto aqui]
[50-55s] CLÍMAX: [seu texto aqui]
[55-60s] CTA: [seu texto aqui]

TRANSCRIÇÃO ORIGINAL:
{transcription[:2000]}

Gere o roteiro agora:"""
    
    print(f"🎬 Gerando roteiro para {platform.upper()} ({niche})...")
    print(f"⏳ Processando com Groq (Llama 3)...\n")
    
    try:
        message = client.messages.create(
            model="mixtral-8x7b-32768",  # Modelo rápido e gratuito
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        roteiro = message.content[0].text
        return roteiro
    
    except Exception as e:
        print(f"❌ Erro ao gerar roteiro: {e}")
        return None

def generate_metadata(transcription, platform="youtube"):
    """Gera metadados SEO otimizados usando Groq."""
    
    client = get_groq_client()
    
    prompt = f"""Você é um especialista em SEO para {platform.upper()}.

Analise a transcrição abaixo e gere:
1. TÍTULO (máx 60 caracteres): Deve ser clicável e conter a palavra-chave
2. DESCRIÇÃO (máx 5000 caracteres): Primeiras 2 linhas são críticas (aparecem antes do "mais")
3. TAGS (10 tags separadas por vírgula): Misture tags niche + tags populares

TRANSCRIÇÃO:
{transcription[:1500]}

Formato de saída:
TÍTULO: [seu título aqui]
DESCRIÇÃO: [sua descrição aqui]
TAGS: tag1, tag2, tag3, ...

Gere agora:"""
    
    print(f"📊 Gerando metadados SEO para {platform.upper()}...")
    
    try:
        message = client.messages.create(
            model="mixtral-8x7b-32768",
            max_tokens=512,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        metadata = message.content[0].text
        return metadata
    
    except Exception as e:
        print(f"❌ Erro ao gerar metadados: {e}")
        return None

def main(transcription, platform="tiktok", niche="curiosidade"):
    """Fluxo principal de geração de roteiro."""
    
    if not transcription or len(transcription) < 50:
        print("❌ Transcrição muito curta ou vazia!")
        return
    
    print(f"\n{'='*60}")
    print(f"🚀 GERADOR DE ROTEIRO - VERSÃO GROQ (GRÁTIS)")
    print(f"{'='*60}\n")
    
    # Gerar roteiro
    roteiro = generate_roteiro(transcription, platform, niche)
    if roteiro:
        print(f"\n{'='*60}")
        print(f"✅ ROTEIRO GERADO")
        print(f"{'='*60}\n")
        print(roteiro)
        print()
    
    # Gerar metadados
    metadata = generate_metadata(transcription, platform)
    if metadata:
        print(f"\n{'='*60}")
        print(f"✅ METADADOS SEO GERADOS")
        print(f"{'='*60}\n")
        print(metadata)
        print()
    
    print(f"\n{'='*60}")
    print(f"💰 CUSTO DESTA OPERAÇÃO: GRÁTIS")
    print(f"   (Usando Groq API com quota gratuita)")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python roteiro_generator_free.py 'sua_transcrição' [plataforma] [nicho]")
        print("\nExemplo:")
        print("  python roteiro_generator_free.py 'O vídeo fala sobre...' tiktok curiosidade")
        print("\nPlataformas: tiktok, reels, youtube_shorts")
        print("Nichos: curiosidade, comédia, educação, notícias, lifestyle, negócios")
        sys.exit(1)
    
    transcription = sys.argv[1]
    platform = sys.argv[2] if len(sys.argv) > 2 else "tiktok"
    niche = sys.argv[3] if len(sys.argv) > 3 else "curiosidade"
    
    main(transcription, platform, niche)
