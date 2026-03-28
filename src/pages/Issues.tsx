import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  MoreVertical,
  Calendar,
  MapPin,
  User,
  ExternalLink,
  X,
  Loader2
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useFirestore } from "@/src/hooks/useFirestore";
import { useAuth } from "@/src/contexts/AuthContext";
import { useProject } from "@/src/contexts/ProjectContext";
import { orderBy } from "firebase/firestore";

interface Issue {
  id?: string;
  title: string;
  severity: "Crítica" | "Alta" | "Média" | "Baixa";
  status: "Pendente" | "Em Resolução" | "Concluído";
  project: string;
  project_id?: string;
  date: string;
  author: string;
  author_id: string;
  description: string;
  company_id: string;
}

export default function Issues() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { currentProjectId } = useProject();
  const { data: issues, loading, add, getCollection } = useFirestore<Issue>("issues");
  const { data: projects, getCollection: getProjects } = useFirestore<any>("projects");

  const [newIssue, setNewIssue] = useState({
    title: "",
    severity: "Média" as any,
    status: "Pendente" as any,
    project: "",
    description: ""
  });

  useEffect(() => {
    if (user) {
      const unsubIssues = getCollection([
        orderBy("date", "desc")
      ], currentProjectId || undefined);
      const unsubProjects = getProjects();
      return () => {
        unsubIssues();
        unsubProjects();
      };
    }
  }, [user, getCollection, getProjects, currentProjectId]);

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const currentProject = projects.find(p => p.id === currentProjectId);

    await add({
      ...newIssue,
      date: new Date().toISOString(),
      author: profile.displayName || user.displayName || "Utilizador",
      author_id: user.uid,
      company_id: profile.company_id,
      project_id: currentProjectId || undefined,
      project: currentProject?.name || newIssue.project
    });

    setIsModalOpen(false);
    setNewIssue({
      title: "",
      severity: "Média",
      status: "Pendente",
      project: "",
      description: ""
    });
  };

  const stats = [
    { label: "Total Ocorrências", value: issues.length, icon: AlertTriangle, color: "blue" },
    { label: "Críticas", value: issues.filter(i => i.severity === "Crítica").length, icon: AlertTriangle, color: "red" },
    { label: "Em Resolução", value: issues.filter(i => i.status === "Em Resolução").length, icon: Clock, color: "amber" },
    { label: "Resolvidas", value: issues.filter(i => i.status === "Concluído").length, icon: CheckCircle2, color: "emerald" },
  ];

  const filteredIssues = issues.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
                         i.project.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todas" || i.severity === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Impedimentos e Ocorrências</h1>
          <p className="text-slate-500 font-medium mt-1">Registo e acompanhamento de problemas críticos em obra.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus size={20} />
          Reportar Ocorrência
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn(
              "p-4 rounded-2xl",
              stat.color === "blue" ? "bg-blue-50 text-blue-600" :
              stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
              stat.color === "amber" ? "bg-amber-50 text-amber-600" :
              "bg-red-50 text-red-600"
            )}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {["Todas", "Crítica", "Alta", "Média", "Baixa"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar ocorrência..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {/* Issues List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold">A carregar ocorrências...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400">
            <AlertTriangle size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Nenhuma ocorrência registada.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <motion.div
              key={issue.id}
              layout
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                  issue.severity === "Crítica" ? "bg-red-50 text-red-600" :
                  issue.severity === "Alta" ? "bg-amber-50 text-amber-600" :
                  "bg-blue-50 text-blue-600"
                )}>
                  <AlertTriangle size={28} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-slate-900 text-lg leading-tight">{issue.title}</h3>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest",
                      issue.severity === "Crítica" ? "bg-red-100 text-red-700" :
                      issue.severity === "Alta" ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      {issue.project}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(issue.date).toLocaleDateString('pt-AO')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      {issue.author}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    issue.status === "Pendente" ? "bg-amber-500" :
                    issue.status === "Em Resolução" ? "bg-blue-500" :
                    "bg-emerald-500"
                  )} />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{issue.status}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <ExternalLink size={20} />
                  </button>
                  <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Issue Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Reportar Ocorrência</h2>
                  <p className="text-sm text-slate-500">Registe um novo impedimento ou problema.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddIssue} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título da Ocorrência</label>
                  <input 
                    required
                    type="text" 
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
                    placeholder="Ex: Atraso na entrega de betão"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gravidade</label>
                    <select 
                      value={newIssue.severity}
                      onChange={(e) => setNewIssue({...newIssue, severity: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Crítica">Crítica</option>
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projeto</label>
                    <input 
                      required
                      type="text" 
                      value={newIssue.project}
                      onChange={(e) => setNewIssue({...newIssue, project: e.target.value})}
                      placeholder="Ex: Edifício Horizonte"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição Detalhada</label>
                  <textarea 
                    required
                    rows={4}
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                    placeholder="Descreva o problema e o impacto na obra..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                  >
                    Reportar Agora
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
