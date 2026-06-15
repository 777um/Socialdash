#!/usr/bin/env python3
"""
Monetization Funnel Optimizer - Conversão Inteligente

Gera palavras-chave únicas por vídeo e links de afiliado rastreados.
Integra com ManyChat para automação de vendas com tema específico.

Funcionalidades:
- Geração de palavras-chave únicas por vídeo
- Links de afiliado rastreados e mascarados
- Templates de automação para ManyChat
- Análise de conversão e ROI
- Banco de dados para rastreamento

Instalação:
    pip install groq

Uso:
    python monetization_funnel_optimizer.py "sua_transcrição" "tema" "plataforma_afiliado"
    python monetization_funnel_optimizer.py "transcrição" "egito" "amazon" --output funnel.json

Exemplos:
    python monetization_funnel_optimizer.py "A história do Egito..." "egito" "amazon"
    python monetization_funnel_optimizer.py "Curiosidades científicas..." "ciência" "udemy"
"""

import json
import argparse
import sys
import hashlib
from datetime import datetime
from pathlib import Path
import sqlite3

try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False


def setup_monetization_db(db_path="monetization_tracking.db"):
    """Cria banco de dados para rastreamento de monetização."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS video_monetization (
            video_id TEXT PRIMARY KEY,
            title TEXT,
            theme TEXT,
            keyword TEXT,
            affiliate_url TEXT,
            platform TEXT,
            manychat_template TEXT,
            created_at TIMESTAMP,
            status TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversion_tracking (
            conversion_id TEXT PRIMARY KEY,
            video_id TEXT,
            keyword TEXT,
            clicks INTEGER,
            conversions INTEGER,
            revenue REAL,
            conversion_rate REAL,
            timestamp TIMESTAMP,
            FOREIGN KEY(video_id) REFERENCES video_monetization(video_id)
        )
    """)
    
    conn.commit()
    return conn


def generate_unique_keyword(title, theme):
    """Gera uma palavra-chave única e memorável para o vídeo."""
    
    # Extrair palavras-chave principais do tema
    keywords_map = {
        'egito': ['EGITO', 'FARAO', 'PIRAMIDE', 'CAIRO'],
        'ciência': ['CIENCIA', 'QUANTICA', 'FISICA', 'ATOMO'],
        'conspiração': ['CONSPIRACAO', 'SEGREDO', 'VERDADE', 'REVELACAO'],
        'história': ['HISTORIA', 'PASSADO', 'IMPERIO', 'GUERRA'],
        'tecnologia': ['TECH', 'FUTURO', 'INOVACAO', 'ROBOT'],
        'natureza': ['NATUREZA', 'ANIMAL', 'PLANETA', 'ECOSISTEMA'],
        'psicologia': ['PSICO', 'MENTE', 'COMPORTAMENTO', 'CEREBRO'],
        'comédia': ['RISADA', 'HUMOR', 'ENGRACADO', 'VIRAL'],
    }
    
    # Encontrar tema correspondente
    theme_lower = theme.lower()
    keyword_options = keywords_map.get(theme_lower, ['PREMIUM', 'EXCLUSIVO', 'ESPECIAL'])
    
    # Usar hash do título para selecionar keyword
    hash_value = int(hashlib.md5(title.encode()).hexdigest(), 16)
    selected_keyword = keyword_options[hash_value % len(keyword_options)]
    
    return selected_keyword


def generate_affiliate_link(keyword, platform, video_id):
    """Gera um link de afiliado rastreado e mascarado."""
    
    affiliate_base_urls = {
        'amazon': 'https://amazon.com/s?k={keyword}',
        'udemy': 'https://www.udemy.com/courses/search/?q={keyword}',
        'hotmart': 'https://hotmart.com/search?q={keyword}',
        'monetizze': 'https://monetizze.com.br/busca/{keyword}',
        'kiwify': 'https://kiwify.com.br/busca/{keyword}',
    }
    
    base_url = affiliate_base_urls.get(platform.lower(), affiliate_base_urls['amazon'])
    affiliate_url = base_url.format(keyword=keyword)
    
    # Adicionar parâmetro de rastreamento
    tracking_id = hashlib.md5(f"{video_id}{keyword}".encode()).hexdigest()[:8]
    affiliate_url += f"&utm_source=video_{video_id}&utm_medium=social&utm_campaign={tracking_id}"
    
    return affiliate_url


def generate_manychat_template(keyword, theme, platform):
    """Gera um template de automação para ManyChat."""
    
    template = {
        'trigger': f'Usuário digita: {keyword}',
        'response': f'🎁 Você ativou a oferta exclusiva de {theme}!',
        'cta_text': f'Clique aqui para acessar',
        'cta_url': f'https://socialdash.pro/oferta/{keyword.lower()}',
        'follow_up': [
            f'Aproveite enquanto durarem os créditos especiais de {theme}!',
            f'Compartilhe com seus amigos e ganhe bônus extra!',
        ],
        'platform': platform,
    }
    
    return template


def optimize_monetization_funnel(transcription, theme, platform, output_file=None, db_path="monetization_tracking.db"):
    """
    Otimiza o funil de monetização para um vídeo.
    
    Args:
        transcription: Transcrição do vídeo
        theme: Tema do vídeo
        platform: Plataforma de afiliado
        output_file: Arquivo para salvar resultados
        db_path: Caminho do banco de dados
    
    Returns:
        Dicionário com configuração de monetização
    """
    
    print(f"\n{'='*70}")
    print(f"💰 MONETIZATION FUNNEL OPTIMIZER - Conversão Inteligente")
    print(f"{'='*70}\n")
    
    print(f"📊 Configuração:")
    print(f"   Tema: {theme}")
    print(f"   Plataforma: {platform}")
    print(f"   Transcrição: {len(transcription)} caracteres\n")
    
    # Gerar ID do vídeo
    video_id = hashlib.md5(transcription.encode()).hexdigest()[:12]
    
    # Extrair título da transcrição
    title = transcription[:100].replace('\n', ' ')
    
    # Gerar palavra-chave única
    keyword = generate_unique_keyword(title, theme)
    
    print(f"🎯 Palavra-chave Única: {keyword}\n")
    
    # Gerar link de afiliado
    affiliate_url = generate_affiliate_link(keyword, platform, video_id)
    
    print(f"🔗 Link de Afiliado Rastreado:")
    print(f"   {affiliate_url}\n")
    
    # Gerar template ManyChat
    manychat_template = generate_manychat_template(keyword, theme, platform)
    
    print(f"🤖 Template ManyChat:")
    print(f"   Trigger: {manychat_template['trigger']}")
    print(f"   Response: {manychat_template['response']}")
    print(f"   CTA: {manychat_template['cta_text']}\n")
    
    # Simular análise de conversão
    print(f"{'='*70}")
    print(f"📈 PROJEÇÃO DE CONVERSÃO")
    print(f"{'='*70}\n")
    
    # Estimar views e conversões
    estimated_views = 5000
    click_through_rate = 0.05  # 5% clicam no link
    conversion_rate = 0.02  # 2% dos cliques convertem
    average_commission = 50  # R$ 50 por conversão
    
    estimated_clicks = int(estimated_views * click_through_rate)
    estimated_conversions = int(estimated_clicks * conversion_rate)
    estimated_revenue = estimated_conversions * average_commission
    
    print(f"📊 Estimativas:")
    print(f"   Views estimadas: {estimated_views:,}")
    print(f"   Cliques estimados (5%): {estimated_clicks}")
    print(f"   Conversões estimadas (2%): {estimated_conversions}")
    print(f"   Receita estimada: R$ {estimated_revenue:,.2f}\n")
    
    # Gerar recomendações com Groq se disponível
    if HAS_GROQ:
        print(f"🤖 Gerando recomendações com Groq...\n")
        try:
            client = Groq()
            prompt = f"""Você é um especialista em monetização de conteúdo viral.

Tenho um vídeo com tema '{theme}' que será monetizado via {platform}.
Palavra-chave: {keyword}
Projeção: {estimated_conversions} conversões, R$ {estimated_revenue:.2f} em receita.

Gere 3 dicas práticas para aumentar a taxa de conversão. Retorne como JSON."""
            
            response = client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=500
            )
            
            print(response.choices[0].message.content)
        except Exception as e:
            print(f"⚠️  Erro ao gerar recomendações: {e}")
            print_default_recommendations()
    else:
        print_default_recommendations()
    
    # Preparar resultado
    result = {
        'video_id': video_id,
        'title': title,
        'theme': theme,
        'platform': platform,
        'monetization_date': datetime.now().isoformat(),
        'keyword': keyword,
        'affiliate_url': affiliate_url,
        'manychat_template': manychat_template,
        'conversion_projection': {
            'estimated_views': estimated_views,
            'estimated_clicks': estimated_clicks,
            'estimated_conversions': estimated_conversions,
            'estimated_revenue': estimated_revenue,
            'click_through_rate': click_through_rate,
            'conversion_rate': conversion_rate,
        }
    }
    
    # Salvar em JSON se especificado
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Configuração salva em: {output_file}")
    
    # Salvar no banco de dados
    try:
        conn = setup_monetization_db(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO video_monetization
            (video_id, title, theme, keyword, affiliate_url, platform, manychat_template, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            video_id,
            title,
            theme,
            keyword,
            affiliate_url,
            platform,
            json.dumps(manychat_template),
            datetime.now(),
            'ativo'
        ))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️  Não foi possível salvar no banco de dados: {e}")
    
    print(f"\n{'='*70}")
    print(f"✅ FUNIL DE MONETIZAÇÃO OTIMIZADO")
    print(f"{'='*70}\n")
    
    return result


def print_default_recommendations():
    """Imprime recomendações padrão quando Groq não está disponível."""
    print(f"💡 Dicas para Aumentar Conversão:\n")
    print(f"   1. Coloque o CTA (Call-to-Action) nos primeiros 30 segundos")
    print(f"   2. Use a palavra-chave única no título e descrição")
    print(f"   3. Crie senso de urgência ('Oferta válida por 24h')")
    print(f"   4. Teste diferentes horários de publicação")
    print(f"   5. Acompanhe métricas com Google Analytics\n")


def main():
    parser = argparse.ArgumentParser(
        description="Otimiza funil de monetização com palavras-chave únicas e links rastreados",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python monetization_funnel_optimizer.py "A história do Egito..." "egito" "amazon"
  python monetization_funnel_optimizer.py "Curiosidades científicas..." "ciência" "udemy"
  python monetization_funnel_optimizer.py "Transcrição..." "tema" "hotmart" --output funnel.json
        """
    )
    
    parser.add_argument("transcription", help="Transcrição do vídeo")
    parser.add_argument("theme", help="Tema do vídeo (ex: egito, ciência, conspiração)")
    parser.add_argument("platform", help="Plataforma de afiliado (amazon, udemy, hotmart, monetizze, kiwify)")
    parser.add_argument("--output", "-o", help="Arquivo de saída (JSON)")
    parser.add_argument("--db", help="Caminho do banco de dados (padrão: monetization_tracking.db)")
    
    args = parser.parse_args()
    
    db_path = args.db or "monetization_tracking.db"
    
    result = optimize_monetization_funnel(
        args.transcription,
        args.theme,
        args.platform,
        output_file=args.output,
        db_path=db_path
    )
    
    return result


if __name__ == '__main__':
    main()
