import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  ChevronRight,
  MoreHorizontal,
  FileSpreadsheet,
  Upload,
  X,
  Loader2
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Project } from "@/src/types/entities";
import { useFirestore } from "@/src/hooks/useFirestore";
import { useAuth } from "@/src/contexts/AuthContext";
import { useProject } from "@/src/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { orderBy } from "firebase/firestore";

export default function ProjectList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os Estados");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { setCurrentProjectId } = useProject();
  const navigate = useNavigate();
  const { data: projects, loading, add, getCollection } = useFirestore<Project>("projects");

  const [newProject, setNewProject] = useState({
    project_name: "",
    client_name: "",
    total_budget: 0,
    location: "",
    start_date: "",
    end_date: "",
    project_manager: "",
    status: "active" as any
  });

  useEffect(() => {
    if (user) {
      const unsubscribe = getCollection([
        orderBy("project_name", "asc")
      ]);
      return () => unsubscribe();
    }
  }, [user, getCollection]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    await add({
      ...newProject,
      total_budget: Number(newProject.total_budget),
      company_id: profile.company_id
    });

    setIsModalOpen(false);
    setNewProject({
      project_name: "",
      client_name: "",
      total_budget: 0,
      location: "",
      start_date: "",
      end_date: "",
      project_manager: "",
      status: "active"
    });
  };

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    navigate("/");
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.project_name.toLowerCase().includes(search.toLowerCase()) ||
      project.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (project.project_manager || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "Todos os Estados" || 
                         (statusFilter === "Ativos" && project.status === "active") ||
                         (statusFilter === "Planeamento" && project.status === "planning") ||
                         (statusFilter === "Concluídos" && project.status === "completed");
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portfólio de Projetos</h1>
          <p className="text-slate-500 font-medium mt-1">Gestão centralizada de orçamentos, prazos e execuções.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Upload size={18} />
            Importar Orçamento
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={20} />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, cliente ou gestor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none"
          >
            <option>Todos os Estados</option>
            <option>Ativos</option>
            <option>Planeamento</option>
            <option>Concluídos</option>
          </select>
          <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-100 transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="font-bold">A carregar projetos...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-20 flex flex-col items-center justify-center text-slate-400">
          <FileSpreadsheet size={48} className="mb-4 opacity-20" />
          <p className="font-bold">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      project.status === "active" ? "bg-blue-50 text-blue-600" :
                      project.status === "on_hold" ? "bg-red-50 text-red-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {project.status === "active" ? "Ativo" : project.status === "on_hold" ? "Atrasado" : project.status === "planning" ? "Planeamento" : "Concluído"}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{project.project_name}</h3>
                    <p className="text-sm text-slate-500 font-bold">{project.client_name}</p>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Orçamento</p>
                    <p className="text-sm font-black text-slate-900">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(project.total_budget)}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Prazo Final</p>
                    <p className="text-sm font-black text-slate-900">{project.end_date || "N/A"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={16} className="text-blue-500" />
                    <span className="text-xs font-bold">{project.location || "Sem localização"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-xs font-bold">{project.project_manager || "Sem gestor"}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gestão Ativa</span>
                  </div>
                  <button 
                    onClick={() => handleSelectProject(project.id)}
                    className="flex items-center gap-1 text-xs font-black text-blue-600 hover:gap-2 transition-all"
                  >
                    Gerir Projeto
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Novo Projeto</h2>
                  <p className="text-sm text-slate-500">Registe um novo empreendimento no portfólio.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Projeto</label>
                    <input 
                      required
                      type="text" 
                      value={newProject.project_name}
                      onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                      placeholder="Ex: Edifício Horizonte"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</label>
                    <input 
                      required
                      type="text" 
                      value={newProject.client_name}
                      onChange={(e) => setNewProject({...newProject, client_name: e.target.value})}
                      placeholder="Nome da imobiliária ou cliente"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orçamento Total (AOA)</label>
                    <input 
                      required
                      type="number" 
                      value={newProject.total_budget}
                      onChange={(e) => setNewProject({...newProject, total_budget: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</label>
                    <input 
                      required
                      type="text" 
                      value={newProject.location}
                      onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                      placeholder="Ex: Luanda, Angola"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Início</label>
                    <input 
                      required
                      type="date" 
                      value={newProject.start_date}
                      onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Conclusão</label>
                    <input 
                      required
                      type="date" 
                      value={newProject.end_date}
                      onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gestor de Projeto</label>
                  <input 
                    required
                    type="text" 
                    value={newProject.project_manager}
                    onChange={(e) => setNewProject({...newProject, project_manager: e.target.value})}
                    placeholder="Nome do engenheiro responsável"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Criar Projeto
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
