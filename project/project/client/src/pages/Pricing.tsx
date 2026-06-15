import { Check, Lock, CreditCard } from "lucide-react";
import { useState } from "react";

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "R$ 0",
      period: "Gratuito",
      description: "Perfeito para começar",
      features: [
        "Acesso aos 7 scripts de automação",
        "6 nichos com tendências",
        "60+ hashtags estratégicas",
        "Prompts anti-detecção",
        "Tutorial completo",
        "Suporte por email",
      ],
      cta: "Começar Agora",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 97",
      period: "/mês",
      description: "Para criadores sérios",
      features: [
        "Tudo do Starter +",
        "Acesso a scripts de escala (Multi-channel)",
        "Acesso a scripts de monetização",
        "Dashboard de rastreamento de afiliados",
        "Integração com Notion",
        "Suporte prioritário",
        "Updates mensais de tendências",
        "Comunidade exclusiva",
      ],
      cta: "Assinar Pro",
      popular: true,
    },
    {
      id: "agency",
      name: "Agency",
      price: "R$ 297",
      period: "/mês",
      description: "Para agências e equipes",
      features: [
        "Tudo do Pro +",
        "Licenças para 3 usuários",
        "Acesso a API privada",
        "Integração com Zapier/Make",
        "Relatórios customizados",
        "Consultoria mensal (1h)",
        "Suporte 24/7",
        "Acesso beta a novas features",
      ],
      cta: "Assinar Agency",
      popular: false,
    },
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Planos Simples e Transparentes
          </h1>
          <p className="text-lg text-gray-300">
            Escolha o plano perfeito para seu crescimento nas redes sociais
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative backdrop-blur-xl rounded-2xl p-8 border transition-all duration-300 ${
                plan.popular
                  ? "border-purple-400/60 bg-white/15 ring-2 ring-purple-500/50 transform md:scale-105"
                  : "border-purple-500/30 bg-white/10 hover:bg-white/15"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full">
                    ⭐ Mais Popular
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400 ml-2">{plan.period}</span>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    : "bg-white/10 hover:bg-white/20 border border-purple-500/30 text-white"
                }`}
              >
                {plan.cta}
              </button>

              {/* Features List */}
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim! Você pode cancelar sua assinatura a qualquer momento, sem perguntas. Seu acesso continua até o final do período de cobrança.",
              },
              {
                q: "Qual é a diferença entre Pro e Agency?",
                a: "O plano Agency inclui suporte prioritário 24/7, integração com APIs, e consultoria mensal com nossos especialistas.",
              },
              {
                q: "Vocês oferecem reembolso?",
                a: "Oferecemos garantia de 7 dias. Se não estiver satisfeito, devolvemos 100% do seu dinheiro.",
              },
              {
                q: "Posso fazer upgrade/downgrade de plano?",
                a: "Claro! Você pode mudar de plano a qualquer momento. Ajustaremos o valor proporcionalmente.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-lg p-6 cursor-pointer hover:bg-white/15 transition"
              >
                <summary className="flex items-center justify-between font-semibold text-lg">
                  {faq.q}
                  <span className="text-purple-400 group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="mt-4 text-gray-300 text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/15 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">
              Finalizar Compra - {plans.find((p) => p.id === selectedPlan)?.name}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Plano {plans.find((p) => p.id === selectedPlan)?.name}</span>
                <span className="font-semibold">{plans.find((p) => p.id === selectedPlan)?.price}</span>
              </div>
              <div className="border-t border-purple-500/20 pt-4 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-purple-400">{plans.find((p) => p.id === selectedPlan)?.price}</span>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-green-400 mb-6 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <Lock size={16} />
              Ambiente Seguro e Criptografado
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-lg transition">
                <CreditCard size={20} className="text-purple-400" />
                <span>Cartão de Crédito</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-lg transition">
                <span className="text-xl">💳</span>
                <span>Pix</span>
              </button>
            </div>

            <button
              onClick={() => setShowCheckout(false)}
              className="w-full px-4 py-2 text-gray-400 hover:text-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
