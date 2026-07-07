import React, { useState } from "react";
import { ClipboardList, Stethoscope, CheckCircle, ArrowRight, ShieldAlert, X, AlertCircle } from "lucide-react";
import { Hospital, Triage } from "../types";

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  userName: string;
  userCpf: string;
  userPhone: string;
  onTriageSubmitted: (triage: Triage) => void;
}

export default function TriageModal({
  isOpen,
  onClose,
  hospitals,
  userName,
  userCpf,
  userPhone,
  onTriageSubmitted,
}: TriageModalProps) {
  const [step, setStep] = useState<"questions" | "result" | "success">("questions");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<"leve" | "moderado" | "grave">("leve");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [hasRiskFactors, setHasRiskFactors] = useState<string[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

  const [computedClassification, setComputedClassification] = useState<"Verde" | "Amarelo" | "Vermelho">("Verde");
  const [computedUrgencyFactor, setComputedUrgencyFactor] = useState(0);

  if (!isOpen) return null;

  const symptomOptions = [
    { label: "Febre Alta", value: "Febre" },
    { label: "Dificuldade de Respirar", value: "Falta de Ar" },
    { label: "Dor de Cabeça Forte", value: "Cefaleia" },
    { label: "Dor no Peito / Aperto", value: "Dor Torácica" },
    { label: "Tosse Seca ou com Catarro", value: "Tosse" },
    { label: "Vômitos / Diarreia", value: "Distúrbio Gastrointestinal" },
    { label: "Dor de Garganta", value: "Dor de Garganta" },
    { label: "Tontura / Fraqueza Geral", value: "Tontura" },
  ];

  const riskOptions = [
    "Hipertensão (Pressão Alta)",
    "Diabetes",
    "Problemas Cardíacos",
    "Asma / Bronquite",
    "Gestante",
    "Idade acima de 60 anos",
  ];

  const handleSymptomToggle = (val: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  const handleRiskToggle = (val: string) => {
    setHasRiskFactors((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  };

  const handleCalculateTriage = () => {
    if (selectedSymptoms.length === 0) {
      alert("Por favor, selecione pelo menos um sintoma.");
      return;
    }

    // Advanced algorithm to compute triage level
    let level: "Verde" | "Amarelo" | "Vermelho" = "Verde";
    let urgencyFactor = 0; // minutes to deduct from queue wait (skipping line)

    const hasSevereSymptoms =
      selectedSymptoms.includes("Falta de Ar") ||
      selectedSymptoms.includes("Dor Torácica");

    if (intensity === "grave" && hasSevereSymptoms) {
      level = "Vermelho";
      urgencyFactor = -120; // Maximum queue bypass (virtually immediate)
    } else if (intensity === "grave" || (intensity === "moderado" && hasSevereSymptoms) || hasRiskFactors.length >= 2) {
      level = "Amarelo";
      urgencyFactor = -45; // High priority queue bypass
    } else {
      level = "Verde";
      urgencyFactor = 0; // Regular queue
    }

    setComputedClassification(level);
    setComputedUrgencyFactor(urgencyFactor);
    setStep("result");

    // Pre-select closest or best hospital
    if (hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].id);
    }
  };

  const handleSubmitTriage = () => {
    if (!selectedHospitalId) return;

    const hospital = hospitals.find((h) => h.id === selectedHospitalId);
    if (!hospital) return;

    const newTriage: Triage = {
      id: "TRI-" + Math.floor(Math.random() * 100000),
      patientName: userName,
      patientCpf: userCpf,
      patientPhone: userPhone,
      symptoms: selectedSymptoms,
      intensity,
      duration: duration || "Recente",
      description,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      status: "aguardando",
      createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      classification: computedClassification,
      urgencyFactor: computedUrgencyFactor,
    };

    onTriageSubmitted(newTriage);
    setStep("success");
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setIntensity("leve");
    setDuration("");
    setDescription("");
    setHasRiskFactors([]);
    setSelectedHospitalId(null);
    setStep("questions");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-850">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-emerald-600">
            <ClipboardList className="w-5 h-5" />
            <span className="font-sans font-black text-sm tracking-wider uppercase">PRÉ-TRIAGEM INTELIGENTE (SUS)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6 bg-white">
          {step === "questions" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-1">Quais sintomas você está sentindo?</h3>
                <p className="text-[11px] text-slate-500 mb-3">Marque todos os sintomas que se aplicam ao seu estado atual.</p>
                <div className="grid grid-cols-2 gap-2">
                  {symptomOptions.map((opt) => {
                    const isChecked = selectedSymptoms.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSymptomToggle(opt.value)}
                        className={`p-3 text-left text-xs rounded-xl border font-semibold transition flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isChecked && <span className="text-emerald-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-1.5">Qual a intensidade desses sintomas?</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(["leve", "moderado", "grave"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`p-3 text-center text-xs rounded-xl border font-bold uppercase tracking-wider transition ${
                        intensity === lvl
                          ? lvl === "leve"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : lvl === "moderado"
                            ? "bg-amber-50 border-amber-500 text-amber-700"
                            : "bg-rose-50 border-rose-500 text-rose-700"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-1.5">Há quanto tempo começaram os sintomas?</h3>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: Desde ontem de manhã, há 4 horas..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-1">Fatores de risco ou condições crônicas?</h3>
                <p className="text-[11px] text-slate-500 mb-3">Esses dados ajudam a priorizar o atendimento de grupos de risco.</p>
                <div className="grid grid-cols-2 gap-2">
                  {riskOptions.map((opt) => {
                    const isChecked = hasRiskFactors.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleRiskToggle(opt)}
                        className={`p-2.5 text-left text-[11px] rounded-xl border font-semibold transition flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{opt}</span>
                        {isChecked && <span className="text-emerald-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-1.5">Descrição adicional (Opcional)</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Alguma informação extra importante para os médicos da rede..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 h-20 resize-none transition"
                />
              </div>

              <button
                type="button"
                onClick={handleCalculateTriage}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-black transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md shadow-emerald-500/10"
              >
                <Stethoscope className="w-4 h-4" />
                Analisar Triagem Clínica
              </button>
            </div>
          )}

          {step === "result" && (
            <div className="space-y-6">
              <div className="text-center pb-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1.5">SUA CLASSIFICAÇÃO SUGERIDA:</p>
                <div
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs tracking-wider uppercase border ${
                    computedClassification === "Vermelho"
                      ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                      : computedClassification === "Amarelo"
                      ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    computedClassification === "Vermelho"
                      ? "bg-rose-500"
                      : computedClassification === "Amarelo"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}></span>
                  Protocolo: {computedClassification}
                </div>

                <p className="text-xs text-slate-600 mt-3 max-w-sm mx-auto leading-relaxed">
                  {computedClassification === "Vermelho"
                    ? "ATENÇÃO: Caso de emergência grave! Recomendamos o atendimento imediato. Seus dados de triagem darão prioridade máxima na recepção."
                    : computedClassification === "Amarelo"
                    ? "Urgente: Recomenda-se atendimento em breve. Sua triagem ajudará a agilizar sua admissão no posto."
                    : "Pouco Urgente: Atendimento regular. Recomendamos escolher o postinho com menor fila para ser atendido mais rápido."}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Selecione para qual postinho/hospital enviar os dados:</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {hospitals.map((h) => {
                    const isSelected = h.id === selectedHospitalId;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedHospitalId(h.id)}
                        className={`w-full p-3.5 text-left rounded-xl border flex items-center justify-between transition ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-xs text-slate-800">{h.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{h.address}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50 shadow-sm">
                            Fila: {h.queue}f
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("questions")}
                  className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition uppercase"
                >
                  Alterar Sintomas
                </button>
                <button
                  type="button"
                  onClick={handleSubmitTriage}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 uppercase"
                  disabled={!selectedHospitalId}
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar e Enviar Ficha
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center text-center p-6 space-y-5 bg-white">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-800 mb-1 uppercase tracking-tight">Triagem Enviada com Sucesso!</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Sua ficha clínica de pré-triagem foi transmitida digitalmente para o sistema interno da unidade médica selecionada.
                </p>
              </div>

              <div className="w-full bg-slate-900 border border-slate-850 rounded-2xl p-4 text-left space-y-2 text-white shadow-md">
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">CUPOM DE ENTRADA SUS DIGITAL:</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Paciente:</span>
                  <span className="text-white font-bold">{userName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Classificação:</span>
                  <span className={`font-black uppercase text-xs ${
                    computedClassification === "Vermelho"
                      ? "text-rose-400"
                      : computedClassification === "Amarelo"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}>
                    {computedClassification}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Unidade Destino:</span>
                  <span className="text-emerald-400 font-bold">
                    {hospitals.find((h) => h.id === selectedHospitalId)?.name}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center font-semibold mt-2 leading-relaxed">
                  ✓ Apresente seu CPF na recepção física para resgatar sua triagem automática.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition uppercase shadow-sm"
              >
                Concluir e Voltar ao Mapa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
