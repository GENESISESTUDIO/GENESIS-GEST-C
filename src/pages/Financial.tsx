import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Download,
  X,
  Loader2
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { useFirestore } from "../hooks/useFirestore";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { orderBy, limit } from "firebase/firestore";

interface Transaction {
  id?: string;
  type: "Receita" | "Despesa";
  category: string;
  amount: number;
  date: string;
  status: "Confirmado" | "Pendente" | "Cancelado";
  description?: string;
  company_id: string;
  project_id?: string;
}

export default function Financial() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { currentProjectId } = useProject();
  const { data: transactions, loading, add, getCollection } = useFirestore<Transaction>("financial");

  const [newTransaction, setNewTransaction] = useState({
    type: "Receita" as any,
    category: "Medição de Obra",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    status: "Confirmado" as any,
    description: ""
  });

  useEffect(() => {
    if (user && profile?.company_id) {
      const unsubscribe = getCollection([
        orderBy("date", "desc"),
        limit(50)
      ], currentProjectId || undefined);
      return () => unsubscribe();
    }
  }, [user, profile?.company_id, getCollection, currentProjectId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    await add({
      ...newTransaction,
      company_id: profile.company_id,
      project_id: currentProjectId || undefined
    });

    setIsModalOpen(false);
    setNewTransaction({
      type: "Receita",
      category: "Medição de Obra",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      status: "Confirmado",
      description: ""
    });
  };

  const totals = useMemo(() => {
    const receita = transactions
      .filter(t => t.type === "Receita" && t.status === "Confirmado")
      .reduce((acc, t) => acc + t.amount, 0);
    
    const despesa = transactions
      .filter(t => t.type === "Despesa" && t.status === "Confirmado")
      .reduce((acc, t) => acc + t.amount, 0);

    return { receita, despesa, saldo: receita - despesa };
  }, [transactions]);

  const stats = useMemo(() => [
    { label: "Saldo Total", value: totals.saldo, icon: DollarSign, color: "blue", trend: "+12.5%" },
    { label: "Receitas Totais", value: totals.receita, icon: TrendingUp, color: "emerald", trend: "+5.2%" },
    { label: "Despesas Totais", value: totals.despesa, icon: TrendingDown, color: "red", trend: "-2.1%" },
  ], [totals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão Financeira</h1>
          <p className="text-slate-500 font-medium mt-1">Fluxo de caixa, orçamentos e controlo de custos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all">
            <Download size={20} />
            Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={20} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                "bg-red-50 text-red-600"
              )}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(stat.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900">Transações Recentes</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <Search size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <Filter size={20} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold">A carregar transações...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <DollarSign size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Nenhuma transação registada.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {t.type === "Receita" ? (
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ArrowUpRight size={18} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <ArrowDownRight size={18} />
                          </div>
                        )}
                        <span className="text-sm font-black text-slate-900">{t.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-700">{t.category}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "text-sm font-black",
                        t.type === "Receita" ? "text-emerald-600" : "text-red-600"
                      )}>{formatCurrency(t.amount)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-400">{t.date}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        t.status === "Confirmado" ? "bg-emerald-100 text-emerald-700" : 
                        t.status === "Pendente" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>
                        {t.status}
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

      {/* Add Transaction Modal */}
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
                  <h2 className="text-xl font-bold text-slate-900">Novo Lançamento</h2>
                  <p className="text-sm text-slate-500">Registe uma nova receita ou despesa.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: "Receita"})}
                    className={cn(
                      "py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      newTransaction.type === "Receita" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Receita
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: "Despesa"})}
                    className={cn(
                      "py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      newTransaction.type === "Despesa" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Despesa
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                  <select 
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Medição de Obra">Medição de Obra</option>
                    <option value="Adiantamento">Adiantamento</option>
                    <option value="Salários">Salários</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Materiais">Materiais</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor (AOA)</label>
                    <input 
                      required
                      type="number" 
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
                    <input 
                      required
                      type="date" 
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
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
                    Confirmar Lançamento
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
