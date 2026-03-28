import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  TrendingUp, 
  PieChart as PieChartIcon,
  BarChart3,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  X
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useFirestore } from "../hooks/useFirestore";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { orderBy } from "firebase/firestore";

interface Report {
  id?: string;
  title: string;
  type: "Diário" | "Semanal" | "Mensal" | "Financeiro" | "Técnico";
  date: string;
  author: string;
  status: "Concluído" | "Rascunho" | "Em Revisão";
  company_id: string;
  project_id?: string;
}

export default function ReportList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { currentProjectId } = useProject();
  const { data: reports, loading, add, getCollection } = useFirestore<Report>("reports");

  const [newReport, setNewReport] = useState({
    title: "",
    type: "Diário" as any,
    status: "Concluído" as any
  });

  useEffect(() => {
    if (user) {
      const unsubscribe = getCollection([
        orderBy("date", "desc")
      ], currentProjectId || undefined);
      return () => unsubscribe();
    }
  }, [user, getCollection, currentProjectId]);

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    await add({
      ...newReport,
      date: new Date().toISOString(),
      author: profile.displayName || user.displayName || "Utilizador",
      company_id: profile.company_id,
      project_id: currentProjectId || undefined
    });

    setIsModalOpen(false);
    setNewReport({
      title: "",
      type: "Diário",
      status: "Concluído"
    });
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todos" || r.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Relatórios & BI</h1>
          <p className="text-slate-500 font-medium mt-1">Geração de relatórios de obra, financeiros e produtividade.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Gerar Novo Relatório
        </button>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Relatório Diário de Obra (RDO)", icon: Clock, color: "blue" },
          { label: "Balanço Financeiro Mensal", icon: BarChart3, color: "emerald" },
          { label: "Inventário de Equipamentos", icon: PieChartIcon, color: "purple" },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-xl transition-all group"
          >
            <div className={cn(
              "p-4 rounded-2xl transition-colors",
              item.color === "blue" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" :
              item.color === "emerald" ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" :
              "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
            )}>
              <item.icon size={24} />
            </div>
            <p className="text-sm font-black text-slate-900 leading-tight">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar relatórios..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
            {["Todos", "Diário", "Semanal", "Mensal", "Financeiro"].map((f) => (
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
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold">A carregar relatórios...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Nenhum relatório encontrado.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-slate-50/50 transition-colors group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{report.title}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.type}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(report.date).toLocaleDateString('pt-AO')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autor</p>
                    <p className="text-xs font-black text-slate-700">{report.author}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    report.status === "Concluído" ? "bg-emerald-100 text-emerald-700" : 
                    report.status === "Em Revisão" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                  )}>
                    {report.status}
                  </span>
                  <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Download size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Report Modal */}
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
                  <h2 className="text-xl font-bold text-slate-900">Gerar Relatório</h2>
                  <p className="text-sm text-slate-500">Crie um novo documento de acompanhamento.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddReport} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título do Relatório</label>
                  <input 
                    required
                    type="text" 
                    value={newReport.title}
                    onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                    placeholder="Ex: Relatório Semanal de Obra - Luanda Sul"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
                    <select 
                      value={newReport.type}
                      onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Diário">Diário</option>
                      <option value="Semanal">Semanal</option>
                      <option value="Mensal">Mensal</option>
                      <option value="Financeiro">Financeiro</option>
                      <option value="Técnico">Técnico</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado Inicial</label>
                    <select 
                      value={newReport.status}
                      onChange={(e) => setNewReport({...newReport, status: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Concluído">Concluído</option>
                      <option value="Rascunho">Rascunho</option>
                      <option value="Em Revisão">Em Revisão</option>
                    </select>
                  </div>
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
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Gerar Relatório
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
