import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
  Wrench,
  MoreVertical
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from "../lib/utils";
import { useFirestore } from "../hooks/useFirestore";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { orderBy, limit } from "firebase/firestore";

interface Equipment {
  id?: string;
  name: string;
  type: string;
  status: "Operacional" | "Em Manutenção" | "Avariado" | "Inativo" | "Parado";
  location: string;
  health: number;
  lastMaintenance: string;
  nextMaintenance?: string;
  operator?: string;
  company_id: string;
  project_id?: string;
}

export default function Equipment() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { currentProjectId } = useProject();
  const { data: equipmentList, loading, add, getCollection } = useFirestore<Equipment>("equipment");

  const [newEquipment, setNewEquipment] = useState({
    name: "",
    type: "Pesado",
    status: "Operacional" as any,
    location: "",
    health: 100,
    lastMaintenance: new Date().toISOString().split('T')[0],
    nextMaintenance: "",
    operator: ""
  });

  useEffect(() => {
    if (user && profile?.company_id) {
      const unsubscribe = getCollection([
        orderBy("name", "asc"),
        limit(100)
      ], currentProjectId || undefined);
      return () => unsubscribe();
    }
  }, [user, profile?.company_id, getCollection, currentProjectId]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    await add({
      ...newEquipment,
      company_id: profile.company_id,
      project_id: currentProjectId || undefined
    });

    setIsModalOpen(false);
    setNewEquipment({
      name: "",
      type: "Pesado",
      status: "Operacional",
      location: "",
      health: 100,
      lastMaintenance: new Date().toISOString().split('T')[0],
      nextMaintenance: "",
      operator: ""
    });
  };

  const stats = useMemo(() => [
    { label: "Total Frota", value: equipmentList.length, icon: Truck, color: "blue" },
    { label: "Operacionais", value: equipmentList.filter(e => e.status === "Operacional").length, icon: CheckCircle2, color: "emerald" },
    { label: "Em Manutenção", value: equipmentList.filter(e => e.status === "Em Manutenção").length, icon: Wrench, color: "amber" },
    { label: "Críticos", value: equipmentList.filter(e => e.status === "Avariado").length, icon: AlertTriangle, color: "red" },
  ], [equipmentList]);

  const chartData = useMemo(() => [
    { name: 'Pesados', value: equipmentList.filter(e => e.type === "Pesado").length },
    { name: 'Transporte', value: equipmentList.filter(e => e.type === "Transporte").length },
    { name: 'Energia', value: equipmentList.filter(e => e.type === "Energia").length },
    { name: 'Outros', value: equipmentList.filter(e => !["Pesado", "Transporte", "Energia"].includes(e.type)).length },
  ], [equipmentList]);

  const filteredEquipment = useMemo(() => equipmentList.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                         e.type.toLowerCase().includes(search.toLowerCase()) ||
                         e.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todos" || e.type === filter;
    return matchesSearch && matchesFilter;
  }), [equipmentList, search, filter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão de Equipamentos</h1>
          <p className="text-slate-500 font-medium mt-1">Monitorização de frota, saúde mecânica e alocação.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Novo Equipamento
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6">Distribuição de Frota</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              {["Todos", "Pesados", "Transporte", "Energia", "Outros"].map((f) => (
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
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisar frota..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-bold">A carregar frota...</p>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-400">
                <Truck size={48} className="mb-4 opacity-20" />
                <p className="font-bold">Nenhum equipamento encontrado.</p>
              </div>
            ) : (
              filteredEquipment.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                          item.status === "Operacional" ? "bg-emerald-50 text-emerald-600" :
                          item.status === "Em Manutenção" ? "bg-amber-50 text-amber-600" :
                          "bg-red-50 text-red-600"
                        )}>
                          <Truck size={28} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 leading-tight">{item.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.type}</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl">
                        <MoreVertical size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Localização</p>
                        <p className="text-xs font-black text-slate-700 truncate">{item.location}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Próxima Manutenção</p>
                        <p className="text-xs font-black text-slate-700 truncate">{item.nextMaintenance || "N/A"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saúde Mecânica</p>
                        <p className={cn(
                          "text-xs font-black",
                          item.health > 80 ? "text-emerald-600" :
                          item.health > 50 ? "text-amber-600" : "text-red-600"
                        )}>{item.health}%</p>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.health}%` }}
                          className={cn(
                            "h-full rounded-full",
                            item.health > 80 ? "bg-emerald-500" :
                            item.health > 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      item.status === "Operacional" ? "bg-emerald-100 text-emerald-700" :
                      item.status === "Em Manutenção" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {item.status}
                    </span>
                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">
                      Ver Ficha
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Equipment Modal */}
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
                  <h2 className="text-xl font-bold text-slate-900">Novo Equipamento</h2>
                  <p className="text-sm text-slate-500">Registe uma nova unidade na frota.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEquipment} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Equipamento</label>
                  <input 
                    required
                    type="text" 
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                    placeholder="Ex: Escavadora CAT 320"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
                    <select 
                      value={newEquipment.type}
                      onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Pesado">Pesado</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Energia">Energia</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</label>
                    <input 
                      required
                      type="text" 
                      value={newEquipment.location}
                      onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                      placeholder="Ex: Estaleiro Central"
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
                    Registar Equipamento
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
