import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Clock,
  ArrowUpRight,
  ShieldAlert,
  HardHat,
  AlertTriangle,
  ChevronRight,
  FileCheck,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { useFirestore } from "../hooks/useFirestore";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";

const financialData = [
  { name: "Sem 1", planeado: 4000, real: 2400 },
  { name: "Sem 2", planeado: 3000, real: 1398 },
  { name: "Sem 3", planeado: 2000, real: 9800 },
  { name: "Sem 4", planeado: 2780, real: 3908 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { currentProjectId } = useProject();
  const { data: projects, loading: loadingProjects, getCollection: getProjects } = useFirestore<any>("projects");
  const { data: team, loading: loadingTeam, getCollection: getTeam } = useFirestore<any>("workers");
  const { data: issues, loading: loadingIssues, getCollection: getIssues } = useFirestore<any>("issues");
  const { data: financial, loading: loadingFinancial, getCollection: getFinancial } = useFirestore<any>("financial");

  useEffect(() => {
    if (user) {
      const unsubProjects = getProjects();
      const unsubTeam = getTeam([], currentProjectId || undefined);
      const unsubIssues = getIssues([], currentProjectId || undefined);
      const unsubFinancial = getFinancial([], currentProjectId || undefined);
      return () => {
        unsubProjects();
        unsubTeam();
        unsubIssues();
        unsubFinancial();
      };
    }
  }, [user, currentProjectId, getProjects, getTeam, getIssues, getFinancial]);

  const stats = [
    { 
      label: "Projetos Ativos", 
      value: projects.length.toString().padStart(2, '0'), 
      icon: Briefcase, 
      color: "text-blue-600", 
      bg: "bg-blue-50", 
      trend: "+12%",
      loading: loadingProjects
    },
    { 
      label: "Mão de Obra", 
      value: team.length.toString(), 
      icon: HardHat, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50", 
      trend: `${Math.round((team.length / 150) * 100)}% Ativos`,
      loading: loadingTeam
    },
    { 
      label: "Impedimentos", 
      value: issues.length.toString(), 
      icon: ShieldAlert, 
      color: "text-red-600", 
      bg: "bg-red-50", 
      trend: `${issues.filter(i => i.severity === 'Crítica').length} Críticos`,
      loading: loadingIssues
    },
    { 
      label: "Valor Medido", 
      value: `${(financial.reduce((acc, curr) => acc + (curr.type === 'Receita' ? Number(curr.amount) : -Number(curr.amount)), 0) / 1000000).toFixed(1)}M`, 
      icon: FileCheck, 
      color: "text-violet-600", 
      bg: "bg-violet-50", 
      trend: "Acumulado",
      loading: loadingFinancial
    },
  ];

  const issueData = [
    { name: "Solo Rochoso", value: issues.filter(i => i.type === 'Geotécnico').length || 1, color: "#3B82F6" },
    { name: "Atraso Chuva", value: issues.filter(i => i.type === 'Climático').length || 1, color: "#EF4444" },
    { name: "Rede Terceiros", value: issues.filter(i => i.type === 'Logístico').length || 1, color: "#F59E0B" },
    { name: "Equipamento", value: issues.filter(i => i.type === 'Equipamento').length || 1, color: "#10B981" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Consola Executiva</h1>
          <p className="text-slate-500 font-medium mt-1">Visão estratégica em tempo real de todas as operações.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-4">
            {team.slice(0, 4).map((member, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden">
                {member.photoURL ? <img src={member.photoURL} alt="" className="w-full h-full object-cover" /> : (member.full_name ? member.full_name[0] : member.displayName ? member.displayName[0] : '?')}
              </div>
            ))}
            {team.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                +{team.length - 4}
              </div>
            )}
          </div>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            Gerar Relatório Consolidado
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                {stat.loading ? (
                  <Loader2 className="animate-spin text-slate-300 ml-auto" size={20} />
                ) : (
                  <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">{stat.trend}</span>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Performance */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Performance Financeira</h3>
              <p className="text-sm text-slate-500 font-medium">Comparativo entre Orçamento Planeado vs Real Medido</p>
            </div>
            <div className="flex bg-slate-50 p-1 rounded-xl">
              <button className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-bold shadow-sm">Semanal</button>
              <button className="px-4 py-1.5 text-slate-500 text-xs font-bold">Mensal</button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    border: 'none', 
                    borderRadius: '16px',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="planeado" fill="#E2E8F0" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="real" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Issues Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-2">Impedimentos</h3>
          <p className="text-sm text-slate-500 font-medium mb-8">Distribuição por tipo de ocorrência</p>
          
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {issueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-4">
            {issueData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Critical Alerts Section */}
      {issues.filter(i => i.severity === 'Crítica').length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 flex items-start gap-6">
          <div className="p-4 bg-red-100 text-red-600 rounded-2xl">
            <AlertTriangle size={32} />
          </div>
          <div className="flex-1">
            <h4 className="text-red-900 text-xl font-black">Alertas Críticos de Obra</h4>
            <p className="text-red-700 font-medium mt-1">Existem {issues.filter(i => i.severity === 'Crítica').length} impedimentos de severidade crítica que requerem parecer técnico imediato.</p>
            <div className="mt-6 flex gap-3">
              <button className="px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">Ver Impedimentos</button>
              <button className="px-6 py-3 bg-white text-red-600 text-sm font-bold rounded-2xl border border-red-200 hover:bg-red-50 transition-all">Ignorar por agora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
