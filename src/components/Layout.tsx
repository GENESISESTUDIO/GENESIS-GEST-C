import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  FileText, 
  Settings, 
  Users, 
  Globe,
  Database, 
  Smartphone,
  ChevronRight,
  Save,
  LogOut,
  Loader2,
  CheckCircle2,
  Menu,
  X,
  Bell,
  Search,
  HardHat,
  Package,
  Truck,
  DollarSign,
  MessageSquare,
  ShieldAlert,
  LogIn,
  ChevronDown
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useProject } from "@/src/contexts/ProjectContext";
import { useFirestore } from "@/src/hooks/useFirestore";
import { signInWithGoogle, signOut } from "@/src/firebase";
import GenesisAI from "./GenesisAI";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: "dashboard" },
  { icon: Briefcase, label: "Projetos", path: "/projects", permission: "projects" },
  { icon: FileText, label: "Relatórios (RDO)", path: "/reports", permission: "reports" },
  { icon: CheckSquare, label: "Tarefas", path: "/tasks", permission: "tasks" },
  { icon: HardHat, label: "Equipa & RH", path: "/team", permission: "team" },
  { icon: Truck, label: "Equipamentos", path: "/equipment", permission: "equipment" },
  { icon: Package, label: "Materiais", path: "/materials", permission: "materials" },
  { icon: DollarSign, label: "Financeiro", path: "/financial", permission: "financial" },
  { icon: ShieldAlert, label: "Impedimentos", path: "/issues", permission: "issues" },
  { icon: Settings, label: "Configurações", path: "/settings", permission: "settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const { currentProjectId, setCurrentProjectId } = useProject();
  const { data: projects, getCollection: getProjects } = useFirestore<{ id: string; name: string }>("projects");
  const location = useLocation();

  useEffect(() => {
    if (user && profile?.company_id) {
      const unsubscribe = getProjects();
      return () => unsubscribe();
    }
  }, [user, profile?.company_id]);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (!profile) return false;
    if (profile.role === 'admin' || profile.permissions.includes('all')) return true;
    return profile.permissions.includes(item.permission);
  });

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">A carregar GENESIS CC...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#0F172A] text-white flex flex-col transition-all duration-300 ease-in-out z-50 shadow-2xl"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Briefcase size={24} />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-extrabold text-lg tracking-tight">GENESIS CC</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{profile?.company_id === 'genesis-cc-gest' ? 'GENESIS CC GEST' : 'Gestão de Obras'}</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto no-scrollbar">
          {filteredSidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                {isActive && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />}
                <item.icon size={20} className={cn(isActive ? "text-blue-500" : "group-hover:text-white")} />
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-semibold text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {user ? (
            <>
              <div className={cn("bg-slate-800/50 rounded-2xl p-4 mb-4", !isSidebarOpen && "hidden")}>
                <p className="text-xs text-slate-500 font-medium">Plano Atual</p>
                <p className="text-sm font-bold text-white">Enterprise</p>
                <div className="mt-2 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-4 p-3 w-full text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={20} />
                {isSidebarOpen && <span className="font-semibold text-sm">Sair do Sistema</span>}
              </button>
            </>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-4 p-3 w-full text-blue-400 hover:text-white transition-colors rounded-xl hover:bg-blue-500/10"
            >
              <LogIn size={20} />
              {isSidebarOpen && <span className="font-semibold text-sm">Entrar com Google</span>}
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <Menu size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            
            {/* Project Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsProjectSelectorOpen(!isProjectSelectorOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group"
              >
                <Briefcase size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-slate-900">
                  {currentProject?.name || "Selecionar Projeto"}
                </span>
                <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isProjectSelectorOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isProjectSelectorOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50"
                  >
                    <div className="p-2 mb-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seus Projetos</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                      {projects.map(project => (
                        <button 
                          key={project.id}
                          onClick={() => {
                            setCurrentProjectId(project.id);
                            setIsProjectSelectorOpen(false);
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-xl text-sm font-semibold transition-all mb-1",
                            currentProjectId === project.id ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          {project.name}
                        </button>
                      ))}
                    </div>
                    <Link 
                      to="/projects" 
                      onClick={() => setIsProjectSelectorOpen(false)}
                      className="block w-full text-center p-3 mt-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                    >
                      Gerenciar Projetos
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisa global..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-900">{profile?.displayName || user.displayName || "Utilizador"}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{profile?.role || "Membro"}</p>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                      {(profile?.displayName || user.displayName || "U").charAt(0)}
                    </div>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/10">
                  <ShieldAlert size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Acesso Restrito</h2>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Por favor, inicie sessão com a sua conta profissional para aceder à plataforma GENESIS CC GEST.
                </p>
                <button 
                  onClick={handleLogin}
                  className="mt-8 flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  <LogIn size={20} />
                  Entrar com Google
                </button>
              </div>
            ) : profile?.company_id === 'pending' && location.pathname !== '/settings' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-600/10">
                  <Globe size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Configuração de Empresa</h2>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  A sua conta ainda não está associada a uma empresa. Por favor, complete o registo da sua empresa ou contacte o administrador.
                </p>
                <Link 
                  to="/settings"
                  className="mt-8 flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Settings size={20} />
                  Configurar Empresa
                </Link>
              </div>
            ) : !currentProjectId && location.pathname !== '/projects' && location.pathname !== '/settings' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/10">
                  <Briefcase size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Selecione um Projeto</h2>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Para gerir as operações, relatórios e equipas, é necessário selecionar um projeto ativo primeiro.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => setCurrentProjectId(project.id)}
                      className="flex items-center gap-4 p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-500">Clique para selecionar</p>
                      </div>
                    </button>
                  ))}
                  <Link
                    to="/projects"
                    className="flex items-center gap-4 p-6 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <X size={24} className="rotate-45" />
                    </div>
                    <div>
                      <p className="font-bold">Novo Projeto</p>
                      <p className="text-xs text-white/60">Criar novo projeto</p>
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        {/* AI Agent Trigger */}
        <button 
          onClick={() => setIsChatOpen(true)}
          className="absolute bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <MessageSquare size={24} />
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Falar com Genesis AI
          </span>
        </button>

        {/* AI Chat Drawer */}
        <GenesisAI isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>
    </div>
  );
}
