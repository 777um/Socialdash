#!/usr/bin/env python3
"""
Affiliate Tracking Dashboard - Análise de ROI

Rastreia conversões por vídeo, tema e canal.
Fornece insights para otimização contínua.

Funcionalidades:
- Dashboard de conversões em tempo real
- Análise de ROI por campanha
- Ranking de vídeos mais rentáveis
- Relatórios por tema e plataforma
- Exportação de dados

Instalação:
    pip install sqlite3

Uso:
    python affiliate_tracking_dashboard.py
    python affiliate_tracking_dashboard.py --analyze
    python affiliate_tracking_dashboard.py --report weekly --output report.json

Exemplos:
    python affiliate_tracking_dashboard.py
    python affiliate_tracking_dashboard.py --analyze
    python affiliate_tracking_dashboard.py --report daily
"""

import json
import argparse
import sys
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
import statistics


def setup_tracking_db(db_path="affiliate_tracking.db"):
    """Cria banco de dados para rastreamento de afiliados."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS affiliate_campaigns (
            campaign_id TEXT PRIMARY KEY,
            video_id TEXT,
            keyword TEXT,
            theme TEXT,
            channel TEXT,
            platform TEXT,
            created_date DATE,
            status TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS affiliate_metrics (
            metric_id TEXT PRIMARY KEY,
            campaign_id TEXT,
            date DATE,
            clicks INTEGER,
            conversions INTEGER,
            revenue REAL,
            conversion_rate REAL,
            roi REAL,
            FOREIGN KEY(campaign_id) REFERENCES affiliate_campaigns(campaign_id)
        )
    """)
    
    conn.commit()
    return conn


def generate_sample_data(db_path="affiliate_tracking.db"):
    """Gera dados de exemplo para demonstração."""
    
    conn = setup_tracking_db(db_path)
    cursor = conn.cursor()
    
    # Campanhas de exemplo
    campaigns = [
        ('camp_001', 'vid_001', 'EGITO', 'egito', 'Mistérios Históricos', 'amazon', '2026-06-01', 'active'),
        ('camp_002', 'vid_002', 'CIENCIA', 'ciência', 'Curiosidades da Ciência', 'udemy', '2026-06-02', 'active'),
        ('camp_003', 'vid_003', 'CONSPIRACAO', 'conspiração', 'Fatos Conspiratórios', 'hotmart', '2026-06-03', 'active'),
        ('camp_004', 'vid_004', 'HISTORIA', 'história', 'Mistérios Históricos', 'amazon', '2026-06-04', 'active'),
        ('camp_005', 'vid_005', 'TECH', 'tecnologia', 'Curiosidades da Ciência', 'udemy', '2026-06-05', 'active'),
    ]
    
    for campaign in campaigns:
        cursor.execute("""
            INSERT OR IGNORE INTO affiliate_campaigns
            (campaign_id, video_id, keyword, theme, channel, platform, created_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, campaign)
    
    # Métricas de exemplo (últimos 7 dias)
    metrics_data = [
        ('EGITO', 'camp_001', 450, 45, 1125.00),
        ('CIENCIA', 'camp_002', 320, 32, 960.00),
        ('CONSPIRACAO', 'camp_003', 280, 28, 840.00),
        ('HISTORIA', 'camp_004', 520, 52, 1560.00),
        ('TECH', 'camp_005', 410, 41, 1230.00),
    ]
    
    today = datetime.now().date()
    metric_id = 1
    
    for keyword, campaign_id, clicks, conversions, revenue in metrics_data:
        for days_ago in range(7):
            date = today - timedelta(days=days_ago)
            conversion_rate = (conversions / clicks * 100) if clicks > 0 else 0
            roi = (revenue / (clicks * 0.5)) * 100 if clicks > 0 else 0  # Assumindo custo de 0.5 por clique
            
            cursor.execute("""
                INSERT OR IGNORE INTO affiliate_metrics
                (metric_id, campaign_id, date, clicks, conversions, revenue, conversion_rate, roi)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f'metric_{metric_id:04d}',
                campaign_id,
                date,
                clicks,
                conversions,
                revenue,
                conversion_rate,
                roi
            ))
            metric_id += 1
    
    conn.commit()
    conn.close()


def display_dashboard(db_path="affiliate_tracking.db"):
    """Exibe o dashboard de rastreamento de afiliados."""
    
    print(f"\n{'='*70}")
    print(f"📊 AFFILIATE TRACKING DASHBOARD - Análise de ROI")
    print(f"{'='*70}\n")
    
    conn = setup_tracking_db(db_path)
    cursor = conn.cursor()
    
    # Gerar dados de exemplo se não existirem
    cursor.execute("SELECT COUNT(*) FROM affiliate_campaigns")
    if cursor.fetchone()[0] == 0:
        print("📋 Gerando dados de exemplo...\n")
        conn.close()
        generate_sample_data(db_path)
        conn = setup_tracking_db(db_path)
        cursor = conn.cursor()
    
    # Obter campanhas
    cursor.execute("""
        SELECT c.campaign_id, c.keyword, c.theme, c.platform, c.channel,
               SUM(m.clicks) as total_clicks, SUM(m.conversions) as total_conversions,
               SUM(m.revenue) as total_revenue, AVG(m.roi) as avg_roi
        FROM affiliate_campaigns c
        LEFT JOIN affiliate_metrics m ON c.campaign_id = m.campaign_id
        GROUP BY c.campaign_id
        ORDER BY total_revenue DESC
    """)
    
    campaigns = cursor.fetchall()
    
    print(f"🎯 TOP CAMPANHAS POR RECEITA:\n")
    print(f"{'Campanha':<12} {'Tema':<15} {'Plataforma':<12} {'Cliques':<10} {'Conversões':<12} {'Receita':<12} {'ROI':<8}")
    print(f"{'-'*100}")
    
    total_revenue = 0
    total_conversions = 0
    
    for campaign in campaigns:
        campaign_id, keyword, theme, platform, channel, clicks, conversions, revenue, roi = campaign
        clicks = clicks or 0
        conversions = conversions or 0
        revenue = revenue or 0
        roi = roi or 0
        
        print(f"{campaign_id:<12} {theme:<15} {platform:<12} {clicks:<10} {conversions:<12} R$ {revenue:<10.2f} {roi:<7.1f}%")
        
        total_revenue += revenue
        total_conversions += conversions
    
    print(f"{'-'*100}\n")
    
    # Resumo geral
    print(f"{'='*70}")
    print(f"💰 RESUMO GERAL")
    print(f"{'='*70}\n")
    
    cursor.execute("SELECT SUM(clicks), SUM(conversions), SUM(revenue), AVG(conversion_rate) FROM affiliate_metrics")
    total_clicks, total_conversions, total_revenue, avg_conversion_rate = cursor.fetchone()
    
    total_clicks = total_clicks or 0
    total_conversions = total_conversions or 0
    total_revenue = total_revenue or 0
    avg_conversion_rate = avg_conversion_rate or 0
    
    print(f"📈 Métricas Totais:")
    print(f"   Total de cliques: {total_clicks:,}")
    print(f"   Total de conversões: {total_conversions:,}")
    print(f"   Receita total: R$ {total_revenue:,.2f}")
    print(f"   Taxa de conversão média: {avg_conversion_rate:.2f}%\n")
    
    # Análise por tema
    print(f"{'='*70}")
    print(f"🎨 ANÁLISE POR TEMA")
    print(f"{'='*70}\n")
    
    cursor.execute("""
        SELECT c.theme, COUNT(DISTINCT c.campaign_id) as num_campaigns,
               SUM(m.revenue) as total_revenue, AVG(m.conversion_rate) as avg_conversion
        FROM affiliate_campaigns c
        LEFT JOIN affiliate_metrics m ON c.campaign_id = m.campaign_id
        GROUP BY c.theme
        ORDER BY total_revenue DESC
    """)
    
    themes = cursor.fetchall()
    
    print(f"{'Tema':<20} {'Campanhas':<12} {'Receita':<15} {'Taxa Conv.':<12}")
    print(f"{'-'*60}")
    
    for theme, num_campaigns, revenue, avg_conversion in themes:
        revenue = revenue or 0
        avg_conversion = avg_conversion or 0
        print(f"{theme:<20} {num_campaigns:<12} R$ {revenue:<13.2f} {avg_conversion:<11.2f}%")
    
    print()
    
    # Análise por plataforma
    print(f"{'='*70}")
    print(f"🔗 ANÁLISE POR PLATAFORMA")
    print(f"{'='*70}\n")
    
    cursor.execute("""
        SELECT c.platform, COUNT(DISTINCT c.campaign_id) as num_campaigns,
               SUM(m.revenue) as total_revenue, AVG(m.roi) as avg_roi
        FROM affiliate_campaigns c
        LEFT JOIN affiliate_metrics m ON c.campaign_id = m.campaign_id
        GROUP BY c.platform
        ORDER BY total_revenue DESC
    """)
    
    platforms = cursor.fetchall()
    
    print(f"{'Plataforma':<15} {'Campanhas':<12} {'Receita':<15} {'ROI Médio':<12}")
    print(f"{'-'*55}")
    
    for platform, num_campaigns, revenue, avg_roi in platforms:
        revenue = revenue or 0
        avg_roi = avg_roi or 0
        print(f"{platform:<15} {num_campaigns:<12} R$ {revenue:<13.2f} {avg_roi:<11.1f}%")
    
    print()
    
    # Recomendações
    print(f"{'='*70}")
    print(f"💡 RECOMENDAÇÕES")
    print(f"{'='*70}\n")
    
    if total_revenue > 0:
        best_theme = max(themes, key=lambda x: x[2])[0] if themes else "N/A"
        best_platform = max(platforms, key=lambda x: x[2])[0] if platforms else "N/A"
        
        print(f"✅ Melhor tema: {best_theme} (maior receita)")
        print(f"✅ Melhor plataforma: {best_platform} (maior ROI)")
        print(f"✅ Taxa de conversão média: {avg_conversion_rate:.2f}%")
        print(f"✅ Receita total: R$ {total_revenue:,.2f}\n")
        
        print(f"💡 Ações recomendadas:")
        print(f"   1. Priorize campanhas no tema '{best_theme}'")
        print(f"   2. Aumente investimento na plataforma '{best_platform}'")
        print(f"   3. Teste novos temas com menor receita")
        print(f"   4. Otimize CTAs para aumentar taxa de conversão\n")
    else:
        print(f"⚠️  Sem dados de conversão ainda. Comece a rastrear campanhas!\n")
    
    conn.close()


def export_report(report_type="daily", output_file=None, db_path="affiliate_tracking.db"):
    """Exporta relatório em JSON."""
    
    conn = setup_tracking_db(db_path)
    cursor = conn.cursor()
    
    # Gerar dados de exemplo se não existirem
    cursor.execute("SELECT COUNT(*) FROM affiliate_campaigns")
    if cursor.fetchone()[0] == 0:
        conn.close()
        generate_sample_data(db_path)
        conn = setup_tracking_db(db_path)
        cursor = conn.cursor()
    
    cursor.execute("""
        SELECT c.campaign_id, c.keyword, c.theme, c.platform, c.channel,
               SUM(m.clicks) as total_clicks, SUM(m.conversions) as total_conversions,
               SUM(m.revenue) as total_revenue, AVG(m.roi) as avg_roi
        FROM affiliate_campaigns c
        LEFT JOIN affiliate_metrics m ON c.campaign_id = m.campaign_id
        GROUP BY c.campaign_id
        ORDER BY total_revenue DESC
    """)
    
    campaigns = cursor.fetchall()
    
    report = {
        'report_type': report_type,
        'generated_at': datetime.now().isoformat(),
        'campaigns': [
            {
                'campaign_id': c[0],
                'keyword': c[1],
                'theme': c[2],
                'platform': c[3],
                'channel': c[4],
                'total_clicks': c[5] or 0,
                'total_conversions': c[6] or 0,
                'total_revenue': c[7] or 0,
                'avg_roi': c[8] or 0,
            }
            for c in campaigns
        ]
    }
    
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"💾 Relatório exportado para: {output_file}")
    else:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    
    conn.close()
    return report


def main():
    parser = argparse.ArgumentParser(
        description="Dashboard de rastreamento de afiliados com análise de ROI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python affiliate_tracking_dashboard.py
  python affiliate_tracking_dashboard.py --analyze
  python affiliate_tracking_dashboard.py --report daily --output report.json
        """
    )
    
    parser.add_argument("--analyze", "-a", action="store_true", help="Executar análise completa")
    parser.add_argument("--report", "-r", choices=["daily", "weekly", "monthly"], 
                       help="Gerar relatório (daily, weekly, monthly)")
    parser.add_argument("--output", "-o", help="Arquivo de saída para relatório (JSON)")
    parser.add_argument("--db", help="Caminho do banco de dados (padrão: affiliate_tracking.db)")
    
    args = parser.parse_args()
    
    db_path = args.db or "affiliate_tracking.db"
    
    if args.report:
        export_report(report_type=args.report, output_file=args.output, db_path=db_path)
    else:
        display_dashboard(db_path=db_path)


if __name__ == '__main__':
    main()
