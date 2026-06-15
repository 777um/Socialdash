import { Copy, ExternalLink, BarChart3, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function Affiliates() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const affiliateTools = [
    {
      id: "manychat",
      name: "ManyChat",
      logo: "💬",
      description: "Automação de DMs e conversão de comentários em vendas",
      benefits: ["Bônus: Template de funil pronto", "Desconto: 20% no primeiro mês", "Suporte: Consultoria 1:1"],
      shortLink: "socialdash.pro/recomenda/manychat",
      fullLink: "https://manychat.com?ref=socialdash_pro",
      clicks: 1247,
      conversions: 89,
      revenue: "R$ 2.340",
    },
    {
      id: "opusclip",
      name: "OpusClip",
      logo: "✂️",
      description: "Gera 12 shorts automaticamente de cada vídeo longo",
      benefits: ["Bônus: 50 créditos grátis", "Desconto: 30% anual", "Suporte: Onboarding gratuito"],
      shortLink: "socialdash.pro/ferramenta/opusclip",
      fullLink: "https://opusclip.com?ref=socialdash_pro",
      clicks: 892,
      conversions: 56,
      revenue: "R$ 1.680",
    },
    {
      id: "groq",
      name: "Groq API",
      logo: "⚡",
      description: "LLM gratuita e ultra-rápida para geração de roteiros",
      benefits: ["Bônus: R$ 50 em créditos", "Desconto: Taxa reduzida", "Suporte: Documentação completa"],
      shortLink: "socialdash.pro/api/groq",
      fullLink: "https://groq.com?ref=socialdash_pro",
      clicks: 2156,
      conversions: 234,
      revenue: "R$ 4.680",
    },
    {
      id: "capcut",
      name: "CapCut Pro",
      logo: "🎬",
      description: "Editor de vídeos com IA integrada para efeitos profissionais",
      benefits: ["Bônus: 3 meses grátis", "Desconto: 50% no anual", "Suporte: Tutoriais exclusivos"],
      shortLink: "socialdash.pro/editor/capcut",
      fullLink: "https://capcut.com?ref=socialdash_pro",
      clicks: 1534,
      conversions: 123,
      revenue: "R$ 3.075",
    },
    {
      id: "kicksta",
      name: "Kicksta",
      logo: "🚀",
      description: "Crescimento orgânico de seguidores de forma segura",
      benefits: ["Bônus: 1000 seguidores grátis", "Desconto: 25% lifetime", "Suporte: Estratégia personalizada"],
      shortLink: "socialdash.pro/crescimento/kicksta",
      fullLink: "https://kicksta.com?ref=socialdash_pro",
      clicks: 1089,
      conversions: 67,
      revenue: "R$ 2.010",
    },
    {
      id: "notion",
      name: "Notion",
      logo: "📝",
      description: "Banco de dados para organizar ideias e roteiros",
      benefits: ["Bônus: Template de banco de dados", "Desconto: Plano Pro 20% off", "Suporte: Setup gratuito"],
      shortLink: "socialdash.pro/produtividade/notion",
      fullLink: "https://notion.so?ref=socialdash_pro",
      clicks: 756,
      conversions: 45,
      revenue: "R$ 1.350",
    },
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const totalClicks = affiliateTools.reduce((sum, tool) => sum + tool.clicks, 0);
  const totalConversions = affiliateTools.reduce((sum, tool) => sum + tool.conversions, 0);
  const totalRevenue = affiliateTools.reduce((sum, tool) => {
    const value = parseFloat(tool.revenue.replace("R$ ", "").replace(".", "").replace(",", "."));
    return sum + value;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Marketplace de Afiliados
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Ferramentas recomendadas com links limpos, profissionais e rastreáveis
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 p-6 rounded-lg">
              <p className="text-3xl font-bold text-purple-400">{totalClicks.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Cliques Totais</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 p-6 rounded-lg">
              <p className="text-3xl font-bold text-pink-400">{totalConversions}</p>
              <p className="text-sm text-gray-400">Conversões</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 p-6 rounded-lg">
              <p className="text-3xl font-bold text-green-400">R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
              <p className="text-sm text-gray-400">Receita Gerada</p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {affiliateTools.map((tool) => (
            <div
              key={tool.id}
              className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-2xl p-6 hover:bg-white/15 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{tool.logo}</span>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">{tool.name}</h3>
                    <p className="text-sm text-gray-400">{tool.description}</p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-6 space-y-2">
                {tool.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-purple-400">✓</span>
                    {benefit}
                  </div>
                ))}
              </div>

              {/* Link Section */}
              <div className="mb-6 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Link Profissional:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-purple-300 truncate">{tool.shortLink}</code>
                  <button
                    onClick={() => copyToClipboard(tool.shortLink, tool.id)}
                    className="p-2 hover:bg-purple-600/30 rounded transition"
                    title="Copiar link"
                  >
                    <Copy size={16} className={copiedLink === tool.id ? "text-green-400" : "text-gray-400"} />
                  </button>
                </div>
              </div>

              {/* Stats & CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <BarChart3 size={14} />
                    {tool.clicks} cliques
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    {tool.conversions} conversões
                  </div>
                </div>
                <a
                  href={tool.fullLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm font-semibold"
                >
                  Visitar
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Revenue */}
              <div className="mt-4 pt-4 border-t border-purple-500/20 text-center">
                <p className="text-xs text-gray-400">Receita Gerada</p>
                <p className="text-lg font-bold text-green-400">{tool.revenue}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Copie o Link</h3>
              <p className="text-sm text-gray-400">Clique no botão de copiar para pegar o link profissional e limpo</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Compartilhe</h3>
              <p className="text-sm text-gray-400">Cole o link em seus conteúdos, emails, ou comunidades</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Ganhe Comissão</h3>
              <p className="text-sm text-gray-400">Receba comissão por cada clique e conversão gerada</p>
            </div>
          </div>
        </div>

        {/* Tracking Info */}
        <div className="text-center text-sm text-gray-400">
          <p>Todos os links são rastreados automaticamente. Seus cliques e conversões aparecem em tempo real nesta página.</p>
        </div>
      </div>
    </div>
  );
}
