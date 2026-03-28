import { 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal, 
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useFirestore } from "../hooks/useFirestore";
import { Task } from "../types/entities";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { where, orderBy } from "firebase/firestore";

export default function TaskManager() {
  const [filter, setFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { currentProjectId } = useProject();
  const { data: tasks, loading, add, update, remove, getCollection } = useFirestore<Task>("tasks");

  const [newTask, setNewTask] = useState({
    title: "",
    priority: "Média" as any,
    status: "Pendente" as any,
    deadline: "",
    assigned_to: ""
  });

  useEffect(() => {
    if (user) {
      const unsubscribe = getCollection([
        orderBy("due_date", "asc")
      ], currentProjectId || undefined);
      return () => unsubscribe();
    }
  }, [user, getCollection, currentProjectId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    await add({
      ...newTask,
      priority: newTask.priority === "Alta" ? "high" : newTask.priority === "Média" ? "medium" : "low",
      company_id: profile.company_id,
      project_id: currentProjectId || "default",
      due_date: newTask.deadline,
      assigned_to: newTask.assigned_to || user.displayName || "Utilizador",
    } as any);

    setIsModalOpen(false);
    setNewTask({
      title: "",
      priority: "Média",
      status: "Pendente",
      deadline: "",
      assigned_to: ""
    });
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    if (task.id) {
      await update(task.id, { status: newStatus });
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todas" || 
                         (filter === "Pendentes" && task.status === "pending") ||
                         (filter === "Em curso" && task.status === "in_progress") ||
                         (filter === "Concluídas" && task.status === "completed");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Tarefas</h1>
          <p className="text-slate-500 mt-1">Gerencie as atividades diárias e prazos da sua equipa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Nova Tarefa
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {["Todas", "Pendentes", "Em curso", "Concluídas"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Procurar tarefa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold">A carregar tarefas...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400">
            <CheckCircle2 size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Nenhuma tarefa encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarefa</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridade</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prazo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleTaskStatus(task)}
                          className="focus:outline-none"
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="text-emerald-500" size={20} />
                          ) : (
                            <Circle className="text-slate-300 hover:text-blue-500 transition-colors" size={20} />
                          )}
                        </button>
                        <span className={cn("text-sm font-semibold", task.status === "completed" && "text-slate-400 line-through")}>
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                        task.priority === "high" || task.priority === "critical" ? "bg-red-50 text-red-600" :
                        task.priority === "medium" ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      )}>
                        <AlertCircle size={12} />
                        {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : task.priority === "critical" ? "Crítica" : "Baixa"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-lg",
                        task.status === "completed" ? "text-emerald-600 bg-emerald-50" :
                        task.status === "in_progress" ? "text-blue-600 bg-blue-50" :
                        "text-slate-500 bg-slate-100"
                      )}>
                        {task.status === "completed" ? "Concluída" : task.status === "in_progress" ? "Em curso" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        {task.due_date || (task as any).deadline}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {(task.assigned_to || (task as any).assigned || "U").split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-700">{task.assigned_to || (task as any).assigned}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => task.id && remove(task.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
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
                  <h2 className="text-xl font-bold text-slate-900">Nova Tarefa</h2>
                  <p className="text-sm text-slate-500">Adicione uma nova atividade à equipa.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título da Tarefa</label>
                  <input 
                    required
                    type="text" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Ex: Revisão de fundações"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridade</label>
                    <select 
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prazo</label>
                    <input 
                      required
                      type="text" 
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      placeholder="Ex: 25 Mar"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável</label>
                  <input 
                    type="text" 
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                    placeholder="Nome do responsável"
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
                    Criar Tarefa
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
