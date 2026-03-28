import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  MoreHorizontal,
  X,
  Loader2,
  Clock,
  MoreVertical
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useFirestore } from "../hooks/useFirestore";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { orderBy } from "firebase/firestore";

interface Material {
  id?: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  price: number;
  trend: "up" | "down" | "stable";
  status: "Em Stock" | "Crítico" | "Esgotado";
  company_id: string;
  project_id?: string;
}

export default function Materials() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { currentProjectId } = useProject();
  const { data: materials, loading, add, getCollection } = useFirestore<Material>("materials");

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    category: "Construção",
    stock: 0,
    unit: "un",
    minStock: 10,
    price: 0,
    trend: "stable" as any,
    status: "Em Stock" as any
  });

  useEffect(() => {
    if (user) {
      const unsubscribe = getCollection([
        orderBy("name", "asc")
      ], currentProjectId || undefined);
      return () => unsubscribe();
    }
  }, [user, getCollection, currentProjectId]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const status = newMaterial.stock <= 0 ? "Esgotado" : 
                  newMaterial.stock <= newMaterial.minStock ? "Crítico" : "Em Stock";

    await add({
      ...newMaterial,
      status,
      company_id: profile.company_id,
      project_id: currentProjectId || undefined
    });

    setIsModalOpen(false);
    setNewMaterial({
      name: "",
      category: "Construção",
      stock: 0,
      unit: "un",
      minStock: 10,
      price: 0,
      trend: "stable",
      status: "Em Stock"
    });
  };

  const stats = [
    { label: "Total Itens", value: materials.length, icon: Package, color: "blue" },
    { label: "Em Stock", value: materials.filter(m => m.status === "Em Stock").length, icon: CheckCircle2, color: "emerald" },
    { label: "Nível Crítico", value: materials.filter(m => m.status === "Crítico").length, icon: AlertTriangle, color: "amber" },
    { label: "Esgotados", value: materials.filter(m => m.status === "Esgotado").length, icon: X, color: "red" },
  ];

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                         m.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todos" || m.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão de Materiais & Stock</h1>
          <p className="text-slate-500 font-medium mt-1">Controlo de inventário, categorias e tendências de preços.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Novo Material
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

      {/* Materials Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar materiais ou categorias..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
            {["Todos", "Construção", "Infraestrutura", "Eletricidade", "Saneamento"].map((f) => (
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

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold">A carregar inventário...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Nenhum material encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Atual</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Unit.</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tendência</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{item.stock}</span>
                        <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-slate-900">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1">
                        {item.trend === "up" ? (
                          <TrendingUp size={16} className="text-red-500" />
                        ) : item.trend === "down" ? (
                          <TrendingDown size={16} className="text-emerald-500" />
                        ) : (
                          <div className="w-4 h-0.5 bg-slate-300 rounded-full" />
                        )}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          item.trend === "up" ? "text-red-500" : 
                          item.trend === "down" ? "text-emerald-500" : "text-slate-400"
                        )}>
                          {item.trend === "up" ? "Alta" : item.trend === "down" ? "Baixa" : "Estável"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        item.status === "Em Stock" ? "bg-emerald-50 text-emerald-600" :
                        item.status === "Crítico" ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Material Modal */}
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
                  <h2 className="text-xl font-bold text-slate-900">Novo Material</h2>
                  <p className="text-sm text-slate-500">Adicione um novo item ao inventário.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Material</label>
                  <input 
                    required
                    type="text" 
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                    placeholder="Ex: Cimento Estrutural 42.5"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                    <select 
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({...newMaterial, category: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Construção">Construção</option>
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Eletricidade">Eletricidade</option>
                      <option value="Saneamento">Saneamento</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidade</label>
                    <select 
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="ton">Tonelada (ton)</option>
                      <option value="m">Metro (m)</option>
                      <option value="m2">Metro Quadrado (m2)</option>
                      <option value="m3">Metro Cúbico (m3)</option>
                      <option value="saco">Saco</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Inicial</label>
                    <input 
                      required
                      type="number" 
                      value={newMaterial.stock}
                      onChange={(e) => setNewMaterial({...newMaterial, stock: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço Unitário (AOA)</label>
                    <input 
                      required
                      type="number" 
                      value={newMaterial.price}
                      onChange={(e) => setNewMaterial({...newMaterial, price: Number(e.target.value)})}
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
                    Registar Material
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
