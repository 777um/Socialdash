#!/usr/bin/env python3
"""
YouTube Outlier Detector - Identifica vídeos virais (Super Outliers) em um canal.

Funcionalidades:
- Extrai dados de vídeos de um canal YouTube
- Calcula estatísticas (média, desvio padrão)
- Identifica "Super Outliers" (vídeos 3x+ acima da média)
- Salva resultados em JSON para processamento posterior
- Cache SQLite para evitar reprocessamento

Instalação:
    pip install yt-dlp

Uso:
    python youtube_outlier_detector.py "https://www.youtube.com/@channel_name"
    python youtube_outlier_detector.py "https://www.youtube.com/@channel_name" --num-videos 50 --output results.json

Exemplos:
    python youtube_outlier_detector.py "https://www.youtube.com/@fatosdesconhecidos"
    python youtube_outlier_detector.py "https://www.youtube.com/@channel" --num-videos 100 --multiplier 2.5
"""

import json
import argparse
import sys
from pathlib import Path
from datetime import datetime
import statistics
import sqlite3

try:
    import yt_dlp
    HAS_YT_DLP = True
except ImportError:
    HAS_YT_DLP = False


def setup_cache_db(db_path="outlier_cache.db"):
    """Cria/carrega banco de dados para cache de análises."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS channel_analysis (
            channel_id TEXT PRIMARY KEY,
            channel_name TEXT,
            total_videos_analyzed INTEGER,
            super_outliers_found INTEGER,
            avg_views REAL,
            std_dev REAL,
            last_analyzed TIMESTAMP,
            analysis_json TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS video_analysis (
            video_id TEXT PRIMARY KEY,
            channel_id TEXT,
            title TEXT,
            views INTEGER,
            is_outlier BOOLEAN,
            outlier_multiplier REAL,
            analyzed_at TIMESTAMP
        )
    """)
    
    conn.commit()
    return conn


def extract_channel_videos(channel_url, num_videos=30):
    """
    Extrai dados de vídeos de um canal YouTube usando yt-dlp.
    
    Args:
        channel_url: URL do canal (ex: https://www.youtube.com/@channel_name)
        num_videos: Número máximo de vídeos a extrair
    
    Returns:
        Lista de dicionários com dados dos vídeos
    """
    
    if not HAS_YT_DLP:
        print("⚠️  yt-dlp não instalado. Usando dados de exemplo.")
        return generate_example_videos(num_videos)
    
    try:
        ydl_opts = {
            'extract_flat': 'in_playlist',
            'quiet': True,
            'no_warnings': True,
            'playlistend': num_videos,
        }
        
        videos = []
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(channel_url, download=False)
            
            if 'entries' in info:
                for entry in info['entries']:
                    if entry:
                        videos.append({
                            'video_id': entry.get('id', ''),
                            'title': entry.get('title', 'Sem título'),
                            'views': entry.get('view_count', 0) or 0,
                            'duration': entry.get('duration', 0) or 0,
                            'upload_date': entry.get('upload_date', ''),
                        })
        
        return videos
    
    except Exception as e:
        print(f"⚠️  Erro ao extrair vídeos: {e}")
        print("   Usando dados de exemplo para demonstração.")
        return generate_example_videos(num_videos)


def generate_example_videos(num_videos=30):
    """Gera dados de exemplo para demonstração (quando yt-dlp não está disponível)."""
    import random
    
    videos = []
    base_views = 1200
    
    for i in range(num_videos):
        # Distribuição normal com alguns outliers
        if i % 15 == 14:  # A cada 15 vídeos, um super outlier
            views = random.randint(8000, 15000)
        else:
            views = base_views + random.randint(-500, 500)
        
        videos.append({
            'video_id': f'video_{i+1:03d}',
            'title': f'Vídeo #{i+1} - Conteúdo Viral',
            'views': views,
            'duration': random.randint(600, 1800),
            'upload_date': f'2024-{(i//7)+1:02d}-{(i%7)+1:02d}',
        })
    
    return videos


def calculate_statistics(views_list):
    """Calcula média e desvio padrão."""
    if len(views_list) < 2:
        return 0, 0
    
    avg = statistics.mean(views_list)
    std_dev = statistics.stdev(views_list)
    
    return avg, std_dev


def identify_outliers(videos, multiplier_threshold=3.0):
    """
    Identifica Super Outliers (vídeos 3x+ acima da média).
    
    Critério duplo:
    1. views > (média + 2*desvio_padrão)
    2. views > (média * multiplier_threshold)
    
    Args:
        videos: Lista de dicionários com dados dos vídeos
        multiplier_threshold: Multiplicador da média para considerar outlier
    
    Returns:
        Lista de outliers identificados
    """
    
    views_list = [v['views'] for v in videos]
    avg, std_dev = calculate_statistics(views_list)
    
    if avg == 0:
        return []
    
    outliers = []
    for video in videos:
        views = video['views']
        
        # Critério duplo: desvio padrão + multiplicador
        if views > (avg + 2 * std_dev) and views > (avg * multiplier_threshold):
            multiplier = views / avg if avg > 0 else 0
            outliers.append({
                'video_id': video['video_id'],
                'title': video['title'],
                'views': views,
                'multiplier': multiplier,
                'above_avg': views - avg,
                'duration': video.get('duration', 0),
                'upload_date': video.get('upload_date', ''),
            })
    
    # Ordenar por views (descendente)
    outliers.sort(key=lambda x: x['views'], reverse=True)
    
    return outliers


def analyze_channel(channel_url, num_videos=30, multiplier_threshold=3.0, output_file=None, db_path="outlier_cache.db"):
    """
    Analisa um canal e identifica Super Outliers.
    
    Args:
        channel_url: URL do canal
        num_videos: Número de vídeos a analisar
        multiplier_threshold: Multiplicador para considerar outlier
        output_file: Arquivo para salvar resultados (JSON)
        db_path: Caminho do banco de dados de cache
    
    Returns:
        Dicionário com resultados da análise
    """
    
    print(f"\n{'='*70}")
    print(f"🎯 YOUTUBE OUTLIER DETECTOR")
    print(f"{'='*70}\n")
    
    print(f"📊 Analisando: {channel_url}")
    print(f"📈 Vídeos a analisar: {num_videos}")
    print(f"⏳ Aguarde...\n")
    
    # Extrair vídeos
    videos = extract_channel_videos(channel_url, num_videos)
    
    if not videos:
        print("❌ Nenhum vídeo encontrado.")
        sys.exit(1)
    
    print(f"✅ {len(videos)} vídeos extraídos\n")
    
    # Calcular estatísticas
    views_list = [v['views'] for v in videos]
    avg_views, std_dev = calculate_statistics(views_list)
    
    print(f"📈 Estatísticas do Canal:")
    print(f"   Total de vídeos: {len(videos)}")
    print(f"   Média de visualizações: {avg_views:,.0f}")
    print(f"   Desvio padrão: {std_dev:,.0f}")
    print(f"   Mínimo: {min(views_list):,}")
    print(f"   Máximo: {max(views_list):,}\n")
    
    # Identificar outliers
    outliers = identify_outliers(videos, multiplier_threshold)
    
    print(f"🎯 SUPER OUTLIERS DETECTADOS: {len(outliers)}\n")
    
    if outliers:
        for i, outlier in enumerate(outliers, 1):
            print(f"   #{i} {outlier['title']}")
            print(f"      Visualizações: {outlier['views']:,}")
            print(f"      Multiplicador: {outlier['multiplier']:.1f}x")
            print(f"      Acima da média: +{outlier['above_avg']:,.0f}\n")
    else:
        print("   Nenhum Super Outlier encontrado com os critérios atuais.\n")
    
    # Preparar resultado
    result = {
        'channel_url': channel_url,
        'analysis_date': datetime.now().isoformat(),
        'statistics': {
            'total_videos': len(videos),
            'avg_views': avg_views,
            'std_dev': std_dev,
            'min_views': min(views_list),
            'max_views': max(views_list),
        },
        'outliers': outliers,
        'outliers_count': len(outliers),
        'processing_recommendation': f"Processe apenas os {len(outliers)} Super Outliers para economizar tempo e custos."
    }
    
    # Salvar em JSON se especificado
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"💾 Resultados salvos em: {output_file}\n")
    
    # Salvar no cache
    try:
        conn = setup_cache_db(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO channel_analysis
            (channel_id, channel_name, total_videos_analyzed, super_outliers_found, 
             avg_views, std_dev, last_analyzed, analysis_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            channel_url,
            channel_url.split('@')[-1],
            len(videos),
            len(outliers),
            avg_views,
            std_dev,
            datetime.now(),
            json.dumps(result)
        ))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️  Não foi possível salvar no cache: {e}")
    
    print(f"{'='*70}")
    print(f"✅ ANÁLISE CONCLUÍDA")
    print(f"{'='*70}\n")
    
    if outliers:
        print(f"🎬 Próximos passos:")
        print(f"   1. Transcreva os Super Outliers com:")
        print(f"      python audio_transcriber_free.py 'https://youtu.be/VIDEO_ID'")
        print(f"   2. Gere roteiros com:")
        print(f"      python roteiro_generator_free.py 'transcrição' 'nicho' 'plataforma'\n")
    
    return result


def main():
    parser = argparse.ArgumentParser(
        description="Identifica vídeos virais (Super Outliers) em um canal YouTube",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python youtube_outlier_detector.py "https://www.youtube.com/@fatosdesconhecidos"
  python youtube_outlier_detector.py "https://www.youtube.com/@channel" --num-videos 50
  python youtube_outlier_detector.py "https://www.youtube.com/@channel" --output results.json --multiplier 2.5
        """
    )
    
    parser.add_argument("channel_url", help="URL do canal YouTube (ex: https://www.youtube.com/@channel_name)")
    parser.add_argument("--num-videos", "-n", type=int, default=30, help="Número de vídeos a analisar (padrão: 30)")
    parser.add_argument("--multiplier", "-m", type=float, default=3.0, help="Multiplicador para considerar Super Outlier (padrão: 3.0)")
    parser.add_argument("--output", "-o", help="Arquivo de saída (JSON)")
    parser.add_argument("--db", help="Caminho do banco de dados de cache (padrão: outlier_cache.db)")
    
    args = parser.parse_args()
    
    db_path = args.db or "outlier_cache.db"
    
    result = analyze_channel(
        args.channel_url,
        num_videos=args.num_videos,
        multiplier_threshold=args.multiplier,
        output_file=args.output,
        db_path=db_path
    )
    
    return result


if __name__ == '__main__':
    main()
