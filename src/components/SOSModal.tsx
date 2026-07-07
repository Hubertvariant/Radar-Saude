import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, Navigation, PhoneCall, X, Siren, CheckCircle, Info } from "lucide-react";
import { Hospital, EmergencyDispatch } from "../types";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number];
  hospitals: Hospital[];
  userName: string;
  userPhone: string;
  onDispatchCreated: (dispatch: EmergencyDispatch) => void;
  activeDispatch: EmergencyDispatch | null;
  onCancelDispatch: () => void;
}

export default function SOSModal({
  isOpen,
  onClose,
  userLocation,
  hospitals,
  userName,
  userPhone,
  onDispatchCreated,
  activeDispatch,
  onCancelDispatch,
}: SOSModalProps) {
  const [step, setStep] = useState<"confirm" | "form" | "active">("confirm");
  const [incidentType, setIncidentType] = useState("");
  const [customIncident, setCustomIncident] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    if (activeDispatch) {
      setStep("active");
    } else {
      setStep("confirm");
    }
  }, [activeDispatch, isOpen]);

  // Find the closest hospital
  useEffect(() => {
    if (hospitals.length > 0) {
      // Find closest with active professionals
      const sorted = [...hospitals].sort((a, b) => {
        const d1 = calculateDistance(userLocation[0], userLocation[1], a.lat, a.lng);
        const d2 = calculateDistance(userLocation[0], userLocation[1], b.lat, b.lng);
        return d1 - d2;
      });
      setSelectedHospital(sorted[0]);
    }
  }, [hospitals, userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!isOpen) return null;

  const handleTriggerSOS = () => {
    setStep("form");
  };

  const handleConfirmDispatch = () => {
    if (!selectedHospital) return;

    const distance = calculateDistance(
      userLocation[0],
      userLocation[1],
      selectedHospital.lat,
      selectedHospital.lng
    );

    // Dynamic arrival time based on distance (e.g. 5 minutes per km, min 3 mins)
    const arrivalMin = Math.max(3, Math.round(distance * 3.5));

    const newDispatch: EmergencyDispatch = {
      id: "SOS-" + Math.floor(Math.random() * 10000),
      patientName: userName || "Paciente Desconhecido",
      patientPhone: userPhone || "(00) 00000-0000",
      lat: userLocation[0],
      lng: userLocation[1],
      status: "acionando",
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
      estimatedArrivalMin: arrivalMin,
      secondsElapsed: 0,
    };

    onDispatchCreated(newDispatch);
    setStep("active");
  };

  const incidentOptions = [
    "Acidente de Trânsito",
    "Dor Forte no Peito / Infarto",
    "Falta de Ar Grave",
    "Desmaio / Perda de Consciência",
    "Fratura / Sangramento Grave",
    "Outro",
  ];  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glowing emergency accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500 animate-pulse"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-500">
            <Siren className="w-6 h-6 animate-pulse" />
            <span className="font-sans font-black text-sm tracking-wider uppercase">PEDIR SOCORRO (SOS)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Urgent warning and trigger */}
        {step === "confirm" && (
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-rose-50 border-2 border-rose-500/20 rounded-full flex items-center justify-center mb-4 text-rose-500 animate-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Acionar Serviço de Ambulância?</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mb-6">
              Este botão deve ser usado <strong>apenas em casos de real emergência</strong>.
              Ao confirmar, enviaremos suas coordenadas de GPS, dados médicos e telefone para a rede do SAMU e o hospital mais próximo.
            </p>

            {selectedHospital && (
              <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-6 text-left">
                <p className="text-[10px] text-slate-400 font-extrabold mb-1 tracking-wider uppercase">UNIDADE MAIS PRÓXIMA:</p>
                <p className="text-sm font-bold text-slate-800">{selectedHospital.name}</p>
                <p className="text-xs text-slate-500">{selectedHospital.address}</p>
              </div>
            )}

            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition uppercase"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleTriggerSOS}
                className="flex-1 px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black transition flex items-center justify-center gap-2 shadow-md shadow-rose-500/10 animate-pulse uppercase text-xs"
              >
                <AlertTriangle className="w-4 h-4" />
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Quick emergency form / incident selection */}
        {step === "form" && (
          <div className="p-6">
            <h3 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-wide">Selecione o tipo de ocorrência:</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {incidentOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIncidentType(opt)}
                  className={`p-3 text-left text-xs rounded-xl border font-semibold transition ${
                    incidentType === opt
                      ? "bg-rose-50 border-rose-500 text-rose-700"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {incidentType === "Outro" && (
              <div className="mb-6">
                <label className="block text-[10px] text-slate-500 font-extrabold mb-2 uppercase tracking-wider">DESCREVA RAPIDAMENTE O SINTOMA:</label>
                <textarea
                  value={customIncident}
                  onChange={(e) => setCustomIncident(e.target.value)}
                  placeholder="Ex: Queda de altura com desmaio..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:border-rose-500 h-20 resize-none transition"
                />
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-2.5">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Não se preocupe em preencher perfeitamente. Se não conseguir selecionar, apenas clique no botão de acionamento abaixo. A geolocalização e os dados de perfil já são suficientes.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="flex-1 px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition uppercase"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="flex-1 px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black transition flex items-center justify-center gap-2 shadow-md shadow-rose-500/10 uppercase text-xs"
              >
                <Siren className="w-4 h-4 animate-bounce" />
                ACIONAR SAMU 192
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Active dispatch state / simulated live tracker */}
        {step === "active" && activeDispatch && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                {/* Visual pulse backdrops */}
                <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></span>
                <span className="absolute -inset-2 rounded-full bg-rose-500/10 animate-ping duration-1000"></span>
                <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white relative shadow-lg">
                  <Siren className="w-8 h-8 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">
                {activeDispatch.status === "acionando"
                  ? "Conectando ao SAMU..."
                  : activeDispatch.status === "a_caminho"
                  ? "Ambulância a Caminho!"
                  : "Socorro no Local!"}
              </h3>
              <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sinal Ativo • ID: {activeDispatch.id}
              </p>
            </div>

            {/* Live Progress Bar */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 mb-6 text-white shadow-md">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-400 font-extrabold tracking-wider text-[10px] uppercase">STATUS DO SOCORRO:</span>
                <span className="text-rose-400 font-bold">
                  {activeDispatch.status === "acionando"
                    ? "REQUISITANDO..."
                    : activeDispatch.status === "a_caminho"
                    ? `Previsão: ~${activeDispatch.estimatedArrivalMin} min`
                    : "CHEGOU"}
                </span>
              </div>

              {/* Progress visual tracker */}
              <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full bg-rose-500 transition-all duration-1000"
                  style={{
                    width:
                      activeDispatch.status === "acionando"
                        ? "15%"
                        : activeDispatch.status === "a_caminho"
                        ? `${Math.max(15, 100 - activeDispatch.estimatedArrivalMin * 10)}%`
                        : "100%",
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Acionamento</span>
                <span>Rota</span>
                <span>Chegada</span>
              </div>
            </div>

            {/* Emergency details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-500">Solicitante:</span>
                <span className="text-slate-800 font-bold">{activeDispatch.patientName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-500">Telefone:</span>
                <span className="text-slate-800 font-bold">{activeDispatch.patientPhone}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-500">Hospital de Origem:</span>
                <span className="text-emerald-600 font-bold">{activeDispatch.hospitalName}</span>
              </div>
              <div className="flex items-start justify-between text-xs">
                <span className="text-slate-500">Coordenadas GPS:</span>
                <span className="text-slate-500 font-mono text-xs text-right">
                  {activeDispatch.lat.toFixed(6)}, {activeDispatch.lng.toFixed(6)}
                </span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 text-center">
              <p className="text-xs text-rose-700 leading-relaxed font-bold">
                🚑 Mantenha a calma! Nossa equipe médica foi notificada. Por favor, permaneça no local ou indique um local visível e acessível para a equipe de socorro.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <a
                href="tel:192"
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 uppercase tracking-wide shadow-sm"
              >
                <PhoneCall className="w-4 h-4" />
                Ligar 192 (SAMU)
              </a>
              <button
                type="button"
                onClick={onCancelDispatch}
                className="flex-1 px-4 py-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition uppercase tracking-wide"
              >
                Cancelar Socorro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
