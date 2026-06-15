import { useState } from "react";
import { Mail, Github, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleLoginError = (message: string) => {
    setError(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    setTimeout(() => setError(""), 3000);
  };

  const handleGoogleLogin = () => {
    // Implementar OAuth Google
    console.log("Google login iniciado");
  };

  const handleGitHubLogin = () => {
    // Implementar OAuth GitHub
    console.log("GitHub login iniciado");
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      handleLoginError("Por favor, insira um email válido");
      return;
    }
    console.log("Email login:", email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Social Media AI
          </h1>
          <p className="text-gray-400">Acesse seu centro de comando de automação</p>
        </div>

        {/* Glassmorphism Card */}
        <div
          className={`backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-2xl p-8 shadow-2xl transition-all duration-300 ${
            shaking ? "animate-shake" : ""
          }`}
          style={{
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.1)",
          }}
        >
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 animate-in fade-in">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-lg transition-all duration-200 text-white font-medium group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
              Entrar com Google
            </button>

            <button
              onClick={handleGitHubLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-lg transition-all duration-200 text-white font-medium group"
            >
              <Github size={20} />
              Entrar com GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            <span className="text-xs text-gray-400">OU</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-purple-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Continuar com Email
            </button>
          </form>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Ao fazer login, você concorda com nossos{" "}
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Política de Privacidade
            </a>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Ambiente Seguro e Criptografado
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
