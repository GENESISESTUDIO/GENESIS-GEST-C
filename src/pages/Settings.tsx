import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database, 
  Smartphone,
  ChevronRight,
  Save,
  LogOut,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Perfil");
  const { user, profile, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    company: "",
    tax_id: "",
    address: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: user?.email || "",
        role: profile.role || "",
        phone: profile.phone || "",
        company: profile.company || "",
        tax_id: profile.tax_id || "",
        address: profile.address || ""
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updates: any = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        company: formData.company,
        tax_id: formData.tax_id,
        address: formData.address,
        updatedAt: new Date().toISOString()
      };

      // If user is pending, create a new company
      if (profile.company_id === 'pending' && formData.company) {
        const newCompanyId = `comp-${Math.random().toString(36).substring(2, 9)}`;
        const companyRef = doc(db, "companies", newCompanyId);
        await setDoc(companyRef, {
          id: newCompanyId,
          name: formData.company,
          tax_id: formData.tax_id,
          address: formData.address,
          owner_uid: user.uid,
          status: 'active',
          created_at: new Date().toISOString()
        });
        updates.company_id = newCompanyId;
        updates.role = 'admin'; // First user is admin
        updates.permissions = ['all'];
      }

      await updateDoc(userRef, updates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh page to apply changes
      if (updates.company_id) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { id: "Perfil", icon: User, label: "Perfil do Utilizador", description: "Informações pessoais e profissionais" },
    { id: "Notificações", icon: Bell, label: "Notificações", description: "Alertas, emails e push notifications" },
    { id: "Segurança", icon: Shield, label: "Segurança", description: "Palavra-passe e autenticação de dois fatores" },
    { id: "Empresa", icon: Globe, label: "Dados da Empresa", description: "NIF, Morada e Logótipo" },
    { id: "Integrações", icon: Database, label: "Integrações", description: "Conectar com outros sistemas e APIs" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configurações</h1>
        <p className="text-slate-500 font-medium mt-1">Gerencie as preferências da sua conta e da organização.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Menu */}
        <div className="w-full lg:w-80 shrink-0 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                activeTab === item.id ? "bg-white/20" : "bg-slate-100 text-slate-500 group-hover:bg-white"
              )}>
                <item.icon size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate">{item.label}</p>
                <p className={cn(
                  "text-[10px] truncate",
                  activeTab === item.id ? "text-blue-100" : "text-slate-400"
                )}>{item.description}</p>
              </div>
              <ChevronRight size={16} className={cn(
                "shrink-0 transition-transform",
                activeTab === item.id ? "translate-x-1" : "text-slate-300"
              )} />
            </button>
          ))}
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all text-left mt-8 border border-red-100"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <LogOut size={20} />
            </div>
            <p className="font-bold text-sm">Terminar Sessão</p>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{activeTab}</h2>
              <p className="text-sm text-slate-500">Altere as suas definições de {activeTab.toLowerCase()}.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {isSaving ? "A guardar..." : saveSuccess ? "Guardado!" : "Guardar Alterações"}
            </button>
          </div>

          <div className="p-8 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === "Perfil" && (
                <motion.div 
                  key="perfil"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 max-w-2xl"
                >
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-400 border-4 border-white shadow-xl overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          formData.name.split(' ').map(n => n[0]).join('')
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">{formData.name}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{formData.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Profissional</label>
                      <input 
                        type="email" 
                        disabled
                        value={formData.email}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo / Função</label>
                      <input 
                        type="text" 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "Empresa" && (
                <motion.div 
                  key="empresa"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 max-w-2xl"
                >
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Empresa</label>
                      <input 
                        type="text" 
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIF / Número Fiscal</label>
                      <input 
                        type="text" 
                        value={formData.tax_id}
                        onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Morada Sede</label>
                      <textarea 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 min-h-[100px] resize-none" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab !== "Perfil" && activeTab !== "Empresa" && (
                <motion.div 
                  key="other"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
                    <Database size={40} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Módulo em Desenvolvimento</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto mt-2">
                    Estamos a trabalhar para trazer as definições de {activeTab.toLowerCase()} o mais breve possível.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
