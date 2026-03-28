import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export default function GenesisAI({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Olá! Eu sou o Genesis Executive AI. Posso ajudar com resumos executivos, status de projetos, análise financeira ou responder a quaisquer dúvidas sobre a plataforma. Como posso ajudar hoje?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `
        Você é o Genesis Executive AI, o assistente estratégico de elite integrado na plataforma GENESIS CC GEST (Gestão de Construção Civil).
        Seu propósito é fornecer insights de alto nível, análise de riscos e recomendações estratégicas para gestores de obras e infraestruturas.
        
        Contexto Atual:
        - Utilizador: ${profile?.displayName || "Utilizador"}
        - Cargo: ${profile?.role || "Membro"}
        - Empresa: ${profile?.company_id || "N/A"}
        
        Capacidades da Plataforma:
        1. Projetos: Gestão de cronogramas e orçamentos.
        2. Tarefas (TaskManager): Atribuição e acompanhamento de atividades.
        3. Equipa (RH): Gestão de mão de obra e competências.
        4. Equipamentos: Monitorização de frotas e manutenção.
        5. Materiais: Controlo de stock e consumos.
        6. Financeiro: Fluxo de caixa, custos planeados vs reais.
        7. Impedimentos (Issues): Resolução de problemas críticos.
        
        Diretrizes de Resposta:
        - Seja profissional, executivo e direto.
        - Utilize dados e lógica para fundamentar as suas sugestões.
        - Se o utilizador perguntar sobre tendências de mercado ou regulamentações, utilize a pesquisa para fornecer dados atualizados.
        - Foque na eficiência operacional e na redução de custos.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: messages.slice(-10).concat(userMessage).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const aiResponse: Message = {
        role: "model",
        text: response.text || "Desculpe, ocorreu um erro ao processar sua solicitação.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, {
        role: "model",
        text: "Ocorreu um erro na conexão com a inteligência artificial. Por favor, tente novamente mais tarde.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Status dos Projetos", icon: Briefcase },
    { label: "Resumo Financeiro", icon: TrendingUp },
    { label: "Alertas Críticos", icon: AlertCircle },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-6 bg-blue-600 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Bot size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Genesis Executive AI</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-[10px] text-blue-100 uppercase font-black tracking-widest">Assistente Estratégico</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 no-scrollbar">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-slate-200"
                  )}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                  )}>
                    {msg.text}
                    <p className={cn(
                      "text-[10px] mt-2 font-bold opacity-50",
                      msg.role === "user" ? "text-right" : ""
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="animate-spin text-blue-600" size={20} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {!isLoading && messages.length < 3 && (
              <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setInput(action.label);
                      // handleSendMessage will be called by the form submit
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                  >
                    <action.icon size={14} />
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form 
                onSubmit={handleSendMessage}
                className="relative flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pergunte algo ao Genesis AI..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 opacity-50">
                    <Sparkles size={18} />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={20} />
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                Powered by Gemini AI • Genesis Executive Intelligence
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
