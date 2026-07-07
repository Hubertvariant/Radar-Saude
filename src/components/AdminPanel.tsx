import React, { useState } from "react";
import { Hospital, User, Triage, EmergencyDispatch } from "../types";
import {
  Users,
  Building,
  Activity,
  Heart,
  Plus,
  Trash,
  Sliders,
  Check,
  Award,
  AlertTriangle,
  UserCheck,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  LogOut,
  Info
} from "lucide-react";

interface AdminPanelProps {
  hospitals: Hospital[];
  users: User[];
  triages: Triage[];
  activeDispatch: EmergencyDispatch | null;
  onUpdateHospitalQueue: (hospitalId: number, queue: number) => void;
  onUpdateHospitalProfessionals: (hospitalId: number, count: number) => void;
  onAddHospital: (hospital: Omit<Hospital, "id">) => void;
  onDeleteHospital: (id: number) => void;
  onLogout: () => void;
  onResolveTriage: (triageId: string) => void;
}

export default function AdminPanel({
  hospitals,
  users,
  triages,
  activeDispatch,
  onUpdateHospitalQueue,
  onUpdateHospitalProfessionals,
  onAddHospital,
  onDeleteHospital,
  onLogout,
  onResolveTriage,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "filas" | "triagem" | "usuarios" | "hospitais">("dashboard");

  // Form states for adding a new hospital
  const [newHospName, setNewHospName] = useState("");
  const [newHospCity, setNewHospCity] = useState("Londrina");
  const [newHospAddr, setNewHospAddr] = useState("");
  const [newHospLat, setNewHospLat] = useState<number | "">("");
  const [newHospLng, setNewHospLng] = useState<number | "">("");
  const [newHospType, setNewHospType] = useState<Hospital["type"]>("UPA");
  const [newHospWait, setNewHospWait] = useState<number>(10);
  const [newHospDoctors, setNewHospDoctors] = useState<number>(3);

  // Stats calculations
  const totalHospitals = hospitals.length;
  const totalUsers = users.length;
  const pcdUsersCount = users.filter((u) => u.hasDisability).length;
  const avgQueue = hospitals.length
    ? Math.round(hospitals.reduce((acc, h) => acc + h.queue, 0) / hospitals.length)
    : 0;

  const handleAddHospitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName || !newHospAddr || newHospLat === "" || newHospLng === "") {
      alert("Por favor, preencha todos os campos do hospital.");
      return;
    }

    onAddHospital({
      name: newHospName,
      city: newHospCity,
      address: newHospAddr,
      lat: Number(newHospLat),
      lng: Number(newHospLng),
      type: newHospType,
      queue: Number(newHospWait),
      activeProfessionals: Number(newHospDoctors),
      avgServiceTime: 12,
    });

    // Reset fields
    setNewHospName("");
    setNewHospAddr("");
    setNewHospLat("");
    setNewHospLng("");
    alert("Unidade de Saúde adicionada com sucesso!");
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <Building className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">Painel Administrativo</h1>
            <p className="text-xs text-emerald-400 font-medium">Radar Saúde • SUS Gestão Digital</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-900/60 rounded-xl font-semibold text-xs transition"
        >
          <LogOut className="w-4 h-4" />
          Encerrar Sessão Admin
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 overflow-x-auto shrink-0 flex gap-2">
        {(["dashboard", "filas", "triagem", "usuarios", "hospitais"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              activeTab === tab
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab === "dashboard" && "Dashboard"}
            {tab === "filas" && "Gerenciar Filas"}
            {tab === "triagem" && `Fichas de Triagem (${triages.filter((t) => t.status === "aguardando").length})`}
            {tab === "usuarios" && "Usuários Cadastrados"}
            {tab === "hospitais" && "Cadastro de Unidades"}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{totalHospitals}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Hospitais / UPAs</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{totalUsers}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Usuários Ativos</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{avgQueue} min</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Fila Média SUS</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{pcdUsersCount}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Pacientes PcD</p>
                </div>
              </div>
            </div>

            {/* Active SOS Tracker */}
            {activeDispatch && (
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">CHAMADO DE EMERGÊNCIA EM ANDAMENTO</h4>
                    <p className="text-xs text-rose-300">
                      Ambulância enviada para <strong>{activeDispatch.patientName}</strong> do hospital <strong>{activeDispatch.hospitalName}</strong>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-[10px] font-bold uppercase">
                    Status: {activeDispatch.status}
                  </span>
                </div>
              </div>
            )}

            {/* Content grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left card: Hospitals status ranking */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-sm text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Status das Filas por Unidade
                </h3>
                <div className="space-y-3">
                  {hospitals.map((h) => {
                    const isCongested = h.queue >= 20;
                    const isMedium = h.queue >= 10 && h.queue < 20;
                    const queueColor = isCongested
                      ? "text-rose-400 bg-rose-950/40 border-rose-900/30"
                      : isMedium
                      ? "text-amber-400 bg-amber-950/40 border-amber-900/30"
                      : "text-emerald-400 bg-emerald-950/40 border-emerald-900/30";

                    return (
                      <div
                        key={h.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-xs text-white">{h.name}</div>
                          <div className="text-[10px] text-slate-500">{h.address}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400">
                            👨‍⚕️ {h.activeProfessionals} méd.
                          </span>
                          <span className={`text-xs font-bold font-mono px-3 py-1 rounded-lg border ${queueColor}`}>
                            {h.queue} pessoas
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right card: Active triages */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-sm text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  Triagens Recentes Recebidas
                </h3>
                <div className="space-y-3">
                  {triages.filter((t) => t.status === "aguardando").length === 0 ? (
                    <p className="text-center text-slate-500 py-10 text-xs">Nenhuma ficha de triagem ativa no momento.</p>
                  ) : (
                    triages
                      .filter((t) => t.status === "aguardando")
                      .slice(0, 4)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${
                                t.classification === "Vermelho"
                                  ? "bg-rose-500"
                                  : t.classification === "Amarelo"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}></span>
                              <span className="font-bold text-xs text-white">{t.patientName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Destino: <strong>{t.hospitalName}</strong> • {t.createdAt}
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("triagem")}
                            className="p-1.5 bg-slate-850 hover:bg-emerald-600 rounded-lg text-slate-400 hover:text-white transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GERENCIAR FILAS */}
        {activeTab === "filas" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-base text-white mb-1">Atualização Dinâmica de Ocupação</h3>
              <p className="text-xs text-slate-400 mb-6">Controle as variáveis clínicas que determinam o cálculo do tempo estimado do SUS para cada postinho.</p>

              <div className="space-y-6">
                {hospitals.map((h) => {
                  return (
                    <div
                      key={h.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-xs text-emerald-400 tracking-wider uppercase">{h.type} • {h.name}</h4>
                          <p className="text-[11px] text-slate-500">{h.address}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-2 rounded-xl text-center min-w-32">
                          <p className="text-[10px] text-slate-400 font-semibold mb-0.5">ESTIMATIVA ATUAL:</p>
                          <p className="text-sm font-black text-white font-mono">
                            {Math.round((h.queue * 12) / h.activeProfessionals)} min
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Queue slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Pessoas na Fila:</span>
                            <span className="text-emerald-400 font-bold">{h.queue} pacientes</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={h.queue}
                            onChange={(e) => onUpdateHospitalQueue(h.id, Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Doctors slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Médicos/Profissionais Ativos:</span>
                            <span className="text-emerald-400 font-bold">{h.activeProfessionals} em plantão</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="12"
                            value={h.activeProfessionals}
                            onChange={(e) => onUpdateHospitalProfessionals(h.id, Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRE-TRIAGENS DE PACIENTES */}
        {activeTab === "triagem" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-base text-white">Fichas Clínicas Recebidas</h3>
                  <p className="text-xs text-slate-400">Triagens preenchidas pelos pacientes no app para agilizar o acolhimento local.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-900/60 rounded-full text-xs font-bold">
                  {triages.filter((t) => t.status === "aguardando").length} Fichas Ativas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {triages.filter((t) => t.status === "aguardando").length === 0 ? (
                  <div className="col-span-2 text-center py-16 bg-slate-950 border border-slate-850 rounded-xl">
                    <p className="text-slate-500 text-xs">Nenhum paciente pré-triado aguardando atendimento.</p>
                  </div>
                ) : (
                  triages
                    .filter((t) => t.status === "aguardando")
                    .map((t) => {
                      return (
                        <div
                          key={t.id}
                          className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-extrabold text-sm text-white">{t.patientName}</h4>
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">CPF: {t.patientCpf}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                t.classification === "Vermelho"
                                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse"
                                  : t.classification === "Amarelo"
                                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                              }`}>
                                {t.classification}
                              </span>
                            </div>

                            <div className="bg-slate-900/50 rounded-xl p-3 mb-4 border border-slate-900 space-y-2">
                              <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">SINTOMAS DECLARADOS:</p>
                                <p className="text-[11px] text-slate-300 font-medium">
                                  {t.symptoms.join(", ")} ({t.intensity})
                                </p>
                              </div>
                              {t.description && (
                                <div>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase">DESCRIÇÃO ADICIONAL:</p>
                                  <p className="text-[11px] text-slate-400 italic">"{t.description}"</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                                <div>Duração: <strong>{t.duration}</strong></div>
                                <div className="text-right">Destino: <strong className="text-emerald-400">{t.hospitalName}</strong></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                            <span className="text-[10px] text-slate-500">Enviada às {t.createdAt}</span>
                            <button
                              onClick={() => onResolveTriage(t.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Admitir Paciente
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USUARIOS CADASTRADOS */}
        {activeTab === "usuarios" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-base text-white mb-1">Pacientes Cadastrados</h3>
              <p className="text-xs text-slate-400 mb-6">Base de cidadãos integrados ao aplicativo Radar Saúde na região.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {users.map((u, i) => {
                  return (
                    <div
                      key={u.cpf + i}
                      className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                        {u.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-white truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">CPF: {u.cpf}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1">
                          📱 {u.phone}
                          {u.hasDisability && (
                            <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-900/60 text-emerald-400 font-bold rounded-full text-[8px] uppercase">
                              PcD
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CADASTRO DE UNIDADES */}
        {activeTab === "hospitais" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form to add */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit">
              <h3 className="font-bold text-base text-white mb-1">Nova Unidade SUS</h3>
              <p className="text-xs text-slate-400 mb-5">Adicione novos postinhos, UPAs ou Hospitais ao mapa do Radar.</p>

              <form onSubmit={handleAddHospitalSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da Unidade *</label>
                  <input
                    type="text"
                    required
                    value={newHospName}
                    onChange={(e) => setNewHospName(e.target.value)}
                    placeholder="Ex: UBS Vila Nova"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Endereço Completo *</label>
                  <input
                    type="text"
                    required
                    value={newHospAddr}
                    onChange={(e) => setNewHospAddr(e.target.value)}
                    placeholder="Av. Principal, 120 - Centro"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newHospLat}
                      onChange={(e) => setNewHospLat(e.target.value !== "" ? Number(e.target.value) : "")}
                      placeholder="-23.3045"
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newHospLng}
                      onChange={(e) => setNewHospLng(e.target.value !== "" ? Number(e.target.value) : "")}
                      placeholder="-51.1696"
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tipo de Unidade</label>
                    <select
                      value={newHospType}
                      onChange={(e) => setNewHospType(e.target.value as Hospital["type"])}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="UBS">UBS (Postinho)</option>
                      <option value="UPA">UPA</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Pronto-Socorro">Pronto-Socorro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Fila Inicial</label>
                    <input
                      type="number"
                      value={newHospWait}
                      onChange={(e) => setNewHospWait(Number(e.target.value))}
                      placeholder="10"
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Profissionais de Plantão</label>
                  <input
                    type="number"
                    value={newHospDoctors}
                    onChange={(e) => setNewHospDoctors(Number(e.target.value))}
                    placeholder="3"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Unidade
                </button>
              </form>
            </div>

            {/* List to delete */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-base text-white mb-1">Unidades Registradas</h3>
              <p className="text-xs text-slate-400 mb-5">Lista e exclusão de postos e hospitais ativos no radar regional.</p>

              <div className="space-y-2">
                {hospitals.map((h) => {
                  return (
                    <div
                      key={h.id}
                      className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 text-emerald-400 rounded">
                            {h.type}
                          </span>
                          <span className="font-bold text-xs text-white">{h.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{h.address}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Remover a unidade ${h.name} permanentemente?`)) {
                            onDeleteHospital(h.id);
                          }
                        }}
                        className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl text-rose-400 transition"
                        title="Remover hospital"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
