#!/usr/bin/env python3
"""
Repurpose Script - Gera ideias de conteúdo otimizadas para múltiplas plataformas.

Uso:
    python repurpose_script.py "sua_transcrição" "seu_nicho" [--platform PLATAFORMA]

Exemplo:
    python repurpose_script.py "A síndrome de Estocolmo..." "Curiosidades" --platform TikTok
"""

import json
import argparse
import sys

try:
    from groq import Groq
    USE_GROQ = True
except ImportError:
    USE_GROQ = False
    print("⚠️  Groq não instalado. Usando modo offline com exemplo de saída.")


def generate_repurpose_ideas(transcription_text, niche, platform_focus=None, model="mixtral-8x7b-32768"):
    """
    Gera 3 ideias de conteúdo otimizadas para diferentes plataformas.
    
    Args:
        transcription_text: Transcrição do vídeo
        niche: Nicho do conteúdo (ex: "Curiosidades", "Comédia")
        platform_focus: Plataforma específica para priorizar (opcional)
        model: Modelo Groq a usar (padrão: mixtral-8x7b-32768)
    
    Returns:
        Lista de ideias em formato JSON
    """
    
    # Construir o prompt completo como uma única string (não quebrada)
    platform_instruction = f"Priorize ideias para {platform_focus}." if platform_focus else ""
    
    prompt = f"""Você é um especialista em marketing de conteúdo viral para redes sociais. Sua tarefa é pegar a transcrição de um vídeo e gerar 3 ideias de conteúdo otimizadas para diferentes plataformas, focando no nicho de {niche}. Cada ideia deve incluir:

1. **Plataforma:** (TikTok, Instagram Reels, YouTube Shorts, Instagram Carrossel, YouTube Vídeo Longo)
2. **Título/Gancho:** Um título chamativo ou frase de abertura que prenda a atenção nos primeiros 3 segundos.
3. **Formato:** (Ex: Micro-drama, Tutorial rápido, Lista, Storytelling, Desafio)
4. **Descrição/Roteiro Curto:** Um resumo do conteúdo, destacando como ele se conecta com a transcrição original e como será adaptado para a plataforma.
5. **Hashtags:** 5 hashtags relevantes e virais para a plataforma e nicho.
6. **CTA (Chamada para Ação):** Uma CTA clara e otimizada para engajamento ou vendas.

{platform_instruction}

Transcrição original:
{transcription_text}

Por favor, retorne as ideias em formato JSON, como uma lista de objetos. Exemplo:
[
  {{
    "plataforma": "TikTok",
    "titulo_gancho": "Você não vai acreditar no que acontece em...",
    "formato": "Micro-drama",
    "descricao_roteiro": "Adaptar a história principal da transcrição em um formato de micro-drama de 30s, com cortes rápidos e reviravolta final.",
    "hashtags": ["#viral", "#tiktokbrasil", "#nicho", "#curiosidade", "#engajamento"],
    "cta": "Comente 'QUERO' para mais segredos!"
  }}
]"""
    
    if not USE_GROQ:
        # Retornar exemplo offline
        return [
            {
                "plataforma": "TikTok",
                "titulo_gancho": "O segredo que ninguém te contou...",
                "formato": "Micro-drama",
                "descricao_roteiro": "Adaptar a história em 30s com reviravolta",
                "hashtags": ["#viral", "#curiosidade", "#segredo", "#tiktok", "#trending"],
                "cta": "Comente 'QUERO' para mais!"
            },
            {
                "plataforma": "Instagram Reels",
                "titulo_gancho": "Você sabia disso?",
                "formato": "Tutorial rápido",
                "descricao_roteiro": "Formato educativo com transições suaves",
                "hashtags": ["#reels", "#educação", "#curiosidade", "#instagram", "#trending"],
                "cta": "Salve este post!"
            },
            {
                "plataforma": "YouTube Shorts",
                "titulo_gancho": "A verdade por trás...",
                "formato": "Storytelling",
                "descricao_roteiro": "Narrativa envolvente com call-to-action forte",
                "hashtags": ["#shorts", "#viral", "#youtube", "#curiosidade", "#trending"],
                "cta": "Inscreva-se para mais conteúdo!"
            }
        ]
    
    try:
        client = Groq()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Você é um especialista em marketing de conteúdo viral. Sempre retorna respostas em JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content
        # Tentar extrair JSON da resposta
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Se não for JSON puro, tentar extrair o bloco JSON
            import re
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return []
            
    except Exception as e:
        print(f"❌ Erro ao gerar ideias de repurpose: {e}", file=sys.stderr)
        return []


def main():
    parser = argparse.ArgumentParser(
        description="Gera ideias de conteúdo otimizadas para múltiplas plataformas",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python repurpose_script.py "A síndrome de Estocolmo..." "Curiosidades"
  python repurpose_script.py "A síndrome..." "Curiosidades" --platform TikTok
        """
    )
    
    parser.add_argument("transcription", help="Transcrição do vídeo")
    parser.add_argument("niche", help="Nicho do conteúdo (ex: Curiosidades, Comédia)")
    parser.add_argument("--platform", "-p", help="Plataforma específica para priorizar", default=None)
    parser.add_argument("--model", "-m", help="Modelo Groq a usar", default="mixtral-8x7b-32768")
    parser.add_argument("--output", "-o", help="Arquivo de saída (JSON)", default=None)
    
    args = parser.parse_args()
    
    print(f"🎬 Gerando ideias de repurpose para o nicho: {args.niche}")
    if args.platform:
        print(f"   Priorizando plataforma: {args.platform}")
    
    ideas = generate_repurpose_ideas(
        args.transcription,
        args.niche,
        platform_focus=args.platform,
        model=args.model
    )
    
    if ideas:
        output = json.dumps(ideas, indent=2, ensure_ascii=False)
        print("\n✅ Ideias geradas com sucesso:\n")
        print(output)
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"\n💾 Salvo em: {args.output}")
    else:
        print("❌ Não foi possível gerar ideias de repurpose.")
        sys.exit(1)


if __name__ == '__main__':
    main()
