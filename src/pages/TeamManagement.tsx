import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  Calendar,
  X,
  Loader2,
  MoreVertical,
  Shield,
  Lock,
  Users
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useFirestore } from "../hooks/useFirestore";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface Worker {
  id?: string;
  full_name: string;
  id_number: string;
  category: string;
  status: "Ativo" | "Férias" | "Inativo";
  phone_number: string;
  hire_date: string;
  salary: number;
  company_id: string;
  project_id?: string;
}

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  role: 'admin' | 'manager' | 'engineer' | 'operator';
  company_id: string;
  permissions: string[];
  accessible_projects: string[];
}

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState<'workers' | 'collaborators'>('workers');
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const { user, profile } = useAuth();
  const { currentProjectId } = useProject();
  const { data: workers, loading: loadingWorkers, add: addWorker, getCollection: getWorkers } = useFirestore<Worker>("workers");
  const { data: collaborators, loading: loadingCollaborators, getCollection: getCollaborators } = useFirestore<UserProfile>("users");
  const { data: projects, getCollection: getProjects } = useFirestore<any>("projects");

  const [newWorker, setNewWorker] = useState({
    full_name: "",
    id_number: "",
    category: "Peão",
    status: "Ativo" as any,
    phone_number: "",
    hire_date: new Date().toISOString().split('T')[0],
    salary: 0,
    project_id: currentProjectId || ""
  });

  useEffect(() => {
    if (user && profile?.company_id) {
      const unsubWorkers = getWorkers([], currentProjectId || undefined);
      const unsubCollaborators = getCollaborators();
      const unsubProjects = getProjects();
      return () => {
        unsubWorkers();
        unsubCollaborators();
        unsubProjects();
      };
    }
  }, [user, profile?.company_id, currentProjectId, getWorkers, getCollaborators, getProjects]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    await addWorker({
      ...newWorker,
      company_id: profile.company_id,
      project_id: currentProjectId || undefined
    });

    setIsModalOpen(false);
    setNewWorker({
      full_name: "",
      id_number: "",
      category: "Peão",
      status: "Ativo",
      phone_number: "",
      hire_date: new Date().toISOString().split('T')[0],
      salary: 0,
      project_id: currentProjectId || ""
    });
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser.uid);
      await updateDoc(userRef, {
        role: selectedUser.role,
        permissions: selectedUser.permissions,
        accessible_projects: selectedUser.accessible_projects
      });
      setIsPermissionModalOpen(false);
    } catch (error) {
      console.error("Error updating permissions:", error);
    }
  };

  const filteredWorkers = useMemo(() => workers.filter(w => {
    const matchesSearch = w.full_name.toLowerCase().includes(search.toLowerCase()) ||
                         w.id_number.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todas" || w.category === filter;
    return matchesSearch && matchesFilter;
  }), [workers, search, filter]);

  const filteredCollaborators = useMemo(() => collaborators.filter(c => 
    (c.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  ), [collaborators, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão de Equipa & RH</h1>
          <p className="text-slate-500 font-medium mt-1">Controle de pessoal, categorias profissionais e salários.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={18} />
            Processar Salários
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <UserPlus size={20} />
            Admitir Trabalhador
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('workers')}
          className={cn(
            "px-8 py-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'workers' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Trabalhadores (Obra)
        </button>
        <button 
          onClick={() => setActiveTab('collaborators')}
          className={cn(
            "px-8 py-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'collaborators' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Colaboradores (Staff)
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'workers' ? "Pesquisar por nome ou BI..." : "Pesquisar por nome ou email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
          />
        </div>
        {activeTab === 'workers' ? (
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none shadow-sm"
          >
            <option value="Todas">Todas as Categorias</option>
            <option value="Engenheiro">Engenheiros</option>
            <option value="Encarregado">Encarregados</option>
            <option value="Operador">Operadores</option>
            <option value="Peão">Peões</option>
          </select>
        ) : (
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 shadow-sm flex items-center">
            Filtros desativados
          </div>
        )}
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
          <Filter size={18} />
          Mais Filtros
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'workers' ? (
          loadingWorkers ? (
            <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold">A carregar equipa...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-400">
              <UserPlus size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Nenhum trabalhador encontrado.</p>
            </div>
          ) : (
            filteredWorkers.map((worker, index) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {worker.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight">{worker.full_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">BI: {worker.id_number}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Phone size={14} className="text-blue-500" />
                    <span className="text-xs font-bold">{worker.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Briefcase size={14} className="text-blue-500" />
                    <span className="text-xs font-bold">{worker.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span className="text-xs font-bold">Admitido em {new Date(worker.hire_date).toLocaleDateString('pt-AO')}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Salário Base</p>
                    <p className="text-sm font-black text-slate-900">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(worker.salary)}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    worker.status === "Ativo" ? "bg-emerald-100 text-emerald-700" : 
                    worker.status === "Férias" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  )}>
                    {worker.status}
                  </span>
                </div>

                <button className="w-full mt-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10">
                  Ver Ficha Completa
                </button>
              </motion.div>
            ))
          )
        ) : (
          loadingCollaborators ? (
            <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold">A carregar colaboradores...</p>
            </div>
          ) : filteredCollaborators.length === 0 ? (
            <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-400">
              <Users size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Nenhum colaborador encontrado.</p>
            </div>
          ) : (
            filteredCollaborators.map((collab, index) => (
              <motion.div
                key={collab.uid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
                      {collab.displayName?.charAt(0) || collab.email?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight">{collab.displayName || "Sem Nome"}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{collab.email}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Shield size={14} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">{collab.role}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Lock size={14} className="text-blue-500" />
                    <span className="text-xs font-bold">{collab.permissions.length} Permissões Ativas</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Briefcase size={14} className="text-blue-500" />
                    <span className="text-xs font-bold">{collab.accessible_projects.length} Projetos Atribuídos</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedUser(collab);
                    setIsPermissionModalOpen(true);
                  }}
                  className="w-full mt-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10"
                >
                  Gerir Acessos & Cargo
                </button>
              </motion.div>
            ))
          )
        )}
      </div>

      {/* Permission Management Modal */}
      <AnimatePresence>
        {isPermissionModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Acessos de {selectedUser.displayName}</h2>
                  <p className="text-sm text-slate-500">Configure o cargo e permissões do colaborador.</p>
                </div>
                <button onClick={() => setIsPermissionModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdatePermissions} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* Role Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargo na Empresa</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['admin', 'manager', 'engineer', 'operator'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedUser({...selectedUser, role: role as any})}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all",
                          selectedUser.role === role ? "border-blue-600 bg-blue-50" : "border-slate-100 hover:border-slate-200"
                        )}
                      >
                        <p className="text-sm font-bold text-slate-900 capitalize">{role}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {role === 'admin' ? 'Controlo total do sistema' : 
                           role === 'manager' ? 'Gestão de projetos e equipas' :
                           role === 'engineer' ? 'Acesso técnico e relatórios' : 'Acesso básico operacional'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Module Permissions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Módulos Permitidos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['dashboard', 'projects', 'reports', 'tasks', 'team', 'equipment', 'materials', 'financial', 'issues', 'settings'].map((perm) => (
                      <label key={perm} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox"
                          checked={selectedUser.permissions.includes(perm) || selectedUser.permissions.includes('all')}
                          disabled={selectedUser.permissions.includes('all')}
                          onChange={(e) => {
                            const newPerms = e.target.checked 
                              ? [...selectedUser.permissions, perm]
                              : selectedUser.permissions.filter(p => p !== perm);
                            setSelectedUser({...selectedUser, permissions: newPerms});
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-700 capitalize">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Project Access */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Projetos Acessíveis</h4>
                  <div className="space-y-2">
                    {projects.map(project => (
                      <label key={project.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox"
                          checked={selectedUser.accessible_projects.includes(project.id) || selectedUser.role === 'admin'}
                          disabled={selectedUser.role === 'admin'}
                          onChange={(e) => {
                            const newProjects = e.target.checked 
                              ? [...selectedUser.accessible_projects, project.id]
                              : selectedUser.accessible_projects.filter(p => p !== project.id);
                            setSelectedUser({...selectedUser, accessible_projects: newProjects});
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-700">{project.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsPermissionModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Guardar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Worker Modal */}
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
                  <h2 className="text-xl font-bold text-slate-900">Admitir Trabalhador</h2>
                  <p className="text-sm text-slate-500">Registe um novo colaborador na equipa.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddWorker} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={newWorker.full_name}
                    onChange={(e) => setNewWorker({...newWorker, full_name: e.target.value})}
                    placeholder="Ex: António Manuel Silva"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nº do BI</label>
                    <input 
                      required
                      type="text" 
                      value={newWorker.id_number}
                      onChange={(e) => setNewWorker({...newWorker, id_number: e.target.value})}
                      placeholder="Ex: 001234567LA041"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</label>
                    <input 
                      required
                      type="tel" 
                      value={newWorker.phone_number}
                      onChange={(e) => setNewWorker({...newWorker, phone_number: e.target.value})}
                      placeholder="Ex: 923 000 000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                    <select 
                      value={newWorker.category}
                      onChange={(e) => setNewWorker({...newWorker, category: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Engenheiro">Engenheiro</option>
                      <option value="Encarregado">Encarregado</option>
                      <option value="Operador">Operador</option>
                      <option value="Peão">Peão</option>
                      <option value="Administrativo">Administrativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salário Base (AOA)</label>
                    <input 
                      required
                      type="number" 
                      value={newWorker.salary}
                      onChange={(e) => setNewWorker({...newWorker, salary: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
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
                    Confirmar Admissão
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
