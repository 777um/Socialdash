#!/usr/bin/env python3
"""
SEO Metadata Script - Gera metadados SEO otimizados para vídeos.

Uso:
    python seo_metadata_script.py "sua_transcrição" "seu_nicho" [--platform PLATAFORMA]

Exemplo:
    python seo_metadata_script.py "A síndrome de Estocolmo..." "Curiosidades" --platform YouTube
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


def generate_seo_metadata(transcription_text, niche, platform="YouTube", model="mixtral-8x7b-32768"):
    """
    Gera metadados SEO otimizados para a plataforma especificada.
    
    Args:
        transcription_text: Transcrição do vídeo
        niche: Nicho do conteúdo (ex: "Curiosidades", "Comédia")
        platform: Plataforma alvo (YouTube, TikTok, Instagram)
        model: Modelo Groq a usar
    
    Returns:
        Dicionário com metadados SEO
    """
    
    # Construir o prompt completo como uma única string (não quebrada)
    prompt = f"""Você é um especialista em SEO para {platform} e marketing digital. Sua tarefa é analisar a transcrição de um vídeo e o nicho, e gerar metadados de SEO otimizados para {platform}. Os metadados devem incluir:

1. **Título do Vídeo:** Um título altamente clicável e otimizado para palavras-chave, com no máximo 70 caracteres.
2. **Descrição do Vídeo:** Uma descrição detalhada e persuasiva, com palavras-chave relevantes, que incentive o clique e o watch time. Deve ter entre 150 e 300 caracteres.
3. **Tags/Palavras-chave:** Uma lista de 10-15 tags relevantes e de alto volume de busca para o nicho e o conteúdo do vídeo.

Considere o nicho: {niche}

Transcrição original:
{transcription_text}

Por favor, retorne os metadados em formato JSON. Exemplo:
{{
  "titulo": "O Segredo Chocante da Síndrome de Estocolmo que Ninguém Te Contou",
  "descricao": "Descubra a verdade por trás da Síndrome de Estocolmo neste vídeo revelador. Entenda como vítimas desenvolvem laços com seus captores e o impacto psicológico. Perfeito para estudantes de psicologia e curiosos!",
  "tags": ["Síndrome de Estocolmo", "psicologia", "comportamento humano", "saúde mental", "curiosidades", "sequestro", "vítimas", "psicologia forense", "trauma", "relacionamentos abusivos"]
}}"""
    
    if not USE_GROQ:
        # Retornar exemplo offline
        return {
            "titulo": "O Segredo Chocante da Síndrome de Estocolmo que Ninguém Te Contou",
            "descricao": "Descubra a verdade por trás da Síndrome de Estocolmo neste vídeo revelador. Entenda como vítimas desenvolvem laços com seus captores e o impacto psicológico. Perfeito para estudantes de psicologia e curiosos!",
            "tags": [
                "Síndrome de Estocolmo",
                "psicologia",
                "comportamento humano",
                "saúde mental",
                "curiosidades",
                "sequestro",
                "vítimas",
                "psicologia forense",
                "trauma",
                "relacionamentos abusivos",
                "psicologia criminal",
                "análise comportamental",
                "documentário",
                "educação",
                "ciência"
            ]
        }
    
    try:
        client = Groq()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Você é um especialista em SEO e marketing digital. Sempre retorna respostas em JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content
        # Tentar extrair JSON da resposta
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Se não for JSON puro, tentar extrair o bloco JSON
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return None
            
    except Exception as e:
        print(f"❌ Erro ao gerar metadados SEO: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Gera metadados SEO otimizados para vídeos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python seo_metadata_script.py "A síndrome de Estocolmo..." "Curiosidades"
  python seo_metadata_script.py "A síndrome..." "Curiosidades" --platform YouTube
        """
    )
    
    parser.add_argument("transcription", help="Transcrição do vídeo")
    parser.add_argument("niche", help="Nicho do conteúdo (ex: Curiosidades, Comédia)")
    parser.add_argument("--platform", "-p", help="Plataforma alvo (YouTube, TikTok, Instagram)", default="YouTube")
    parser.add_argument("--model", "-m", help="Modelo Groq a usar", default="mixtral-8x7b-32768")
    parser.add_argument("--output", "-o", help="Arquivo de saída (JSON)", default=None)
    
    args = parser.parse_args()
    
    print(f"🎯 Gerando metadados SEO para o nicho: {args.niche}")
    print(f"   Plataforma: {args.platform}")
    
    metadata = generate_seo_metadata(
        args.transcription,
        args.niche,
        platform=args.platform,
        model=args.model
    )
    
    if metadata:
        output = json.dumps(metadata, indent=2, ensure_ascii=False)
        print("\n✅ Metadados gerados com sucesso:\n")
        print(output)
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"\n💾 Salvo em: {args.output}")
    else:
        print("❌ Não foi possível gerar metadados SEO.")
        sys.exit(1)


if __name__ == '__main__':
    main()
