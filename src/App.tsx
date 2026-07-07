import React, { useState, useEffect, useMemo } from "react";
import {
  Siren,
  ClipboardList,
  Activity,
  LogOut,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  Smartphone,
  Upload,
  User,
  Lock,
  ArrowRight,
  Menu,
  X,
  FileText,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Sparkles,
  Award
} from "lucide-react";
import { Hospital, User as UserType, Triage, EmergencyDispatch } from "./types";
import Map from "./components/Map";
import TriageModal from "./components/TriageModal";
import SOSModal from "./components/SOSModal";
import AdminPanel from "./components/AdminPanel";

const DEFAULT_HOSPITALS: Hospital[] = [
  {
    id: 1,
    name: "UPA Sabará",
    type: "UPA",
    lat: -23.3150,
    lng: -51.1710,
    address: "Av. Arthur Thomas, 1800 - Jd. Sabará",
    city: "Londrina",
    queue: 12,
    activeProfessionals: 3,
    avgServiceTime: 12
  },
  {
    id: 2,
    name: "Hospital de Clínicas (HU)",
    type: "Hospital",
    lat: -23.3210,
    lng: -51.1350,
    address: "Av. Robert Koch, 60 - Vila Operária",
    city: "Londrina",
    queue: 28,
    activeProfessionals: 5,
    avgServiceTime: 15
  },
  {
    id: 3,
    name: "UPA Centro-Oeste",
    type: "UPA",
    lat: -23.3080,
    lng: -51.1920,
    address: "Av. Leste Oeste, 901 - Centro",
    city: "Londrina",
    queue: 6,
    activeProfessionals: 2,
    avgServiceTime: 10
  },
  {
    id: 4,
    name: "Hospital Zona Sul",
    type: "Hospital",
    lat: -23.3395,
    lng: -51.1550,
    address: "Rua das Orquídeas, 120 - Pq. das Indústrias",
    city: "Londrina",
    queue: 21,
    activeProfessionals: 4,
    avgServiceTime: 14
  },
  {
    id: 5,
    name: "UBS Guanabara",
    type: "UBS",
    lat: -23.3220,
    lng: -51.1650,
    address: "Rua Higienópolis, 150 - Jd. Guanabara",
    city: "Londrina",
    queue: 4,
    activeProfessionals: 2,
    avgServiceTime: 11
  }
];

export default function App() {
  const [screen, setScreen] = useState<"splash" | "login" | "main" | "admin">("splash");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<"map" | "list">("map");
  const [transportMode, setTransportMode] = useState<"walk" | "bike" | "car">("car");
  const [userLocation, setUserLocation] = useState<[number, number]>([-23.3045, -51.1696]); // Default center

  // Auth & Profile state
  const [user, setUser] = useState<UserType | null>(null);
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasDisability, setHasDisability] = useState(false);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Toast & Custom Confirm states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; timestamp: number } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const timestamp = Date.now();
    setToast({ message, type, timestamp });
    setTimeout(() => {
      setToast((prev) => (prev && prev.timestamp === timestamp ? null : prev));
    }, 4000);
  };

  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ message, onConfirm });
  };

  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (msg: string) => {
      showToast(msg, "info");
    };

    window.confirm = (msg: string) => {
      try {
        return originalConfirm(msg);
      } catch (e) {
        console.warn("window.confirm blocked, defaulting to true", e);
        return true;
      }
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  // Profile Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileCep, setProfileCep] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Admin login state
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Data persistence states
  const [hospitals, setHospitals] = useState<Hospital[]>(DEFAULT_HOSPITALS);
  const [triages, setTriages] = useState<Triage[]>([]);
  const [activeDispatch, setActiveDispatch] = useState<EmergencyDispatch | null>(null);

  // Active user's pending triage ticket if they completed it
  const [userTriage, setUserTriage] = useState<Triage | null>(null);

  // Modals
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Selected Hospital state
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

  const [currentAddress, setCurrentAddress] = useState("Av. Higienópolis, Londrina - Centro");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Helper to shift initial default hospitals around any arbitrary coordinate
  const updateHospitalsWithBaseLocation = (lat: number, lng: number) => {
    const DEFAULT_LAT_CENTER = -23.3045;
    const DEFAULT_LNG_CENTER = -51.1696;
    const latOffset = lat - DEFAULT_LAT_CENTER;
    const lngOffset = lng - DEFAULT_LNG_CENTER;

    setHospitals((prev) => {
      return prev.map((h) => {
        // Only shift default hospitals (id 1 to 5)
        if (h.id >= 1 && h.id <= 5) {
          const defaultH = DEFAULT_HOSPITALS.find((dh) => dh.id === h.id);
          if (defaultH) {
            return {
              ...h,
              lat: Number((defaultH.lat + latOffset).toFixed(5)),
              lng: Number((defaultH.lng + lngOffset).toFixed(5)),
              city: h.city === "Londrina" ? "Sua Região" : h.city
            };
          }
        }
        return h;
      });
    });
  };

  const refreshGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocalização não suportada neste navegador.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation([lat, lng]);
        updateHospitalsWithBaseLocation(lat, lng);
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        console.error("GPS Error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Permissão de GPS negada pelo navegador.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Posição GPS indisponível no momento.");
            break;
          case error.TIMEOUT:
            setGpsError("Tempo limite esgotado ao buscar GPS.");
            break;
          default:
            setGpsError("Falha desconhecida ao obter GPS.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const simulateNewLocation = () => {
    const cities = [
      { name: "São Paulo (Centro)", lat: -23.5505, lng: -46.6333 },
      { name: "Curitiba (Centro)", lat: -25.4290, lng: -49.2671 },
      { name: "Rio de Janeiro (Copacabana)", lat: -22.9711, lng: -43.1837 },
      { name: "Belo Horizonte (Centro)", lat: -19.9167, lng: -43.9345 },
      { name: "Londrina (Padrão)", lat: -23.3045, lng: -51.1696 }
    ];
    
    const choiceStr = cities.map((c, i) => `${i + 1} - ${c.name}`).join("\n");
    const input = prompt(`Escolha um local para simular a mudança de GPS real e ver o Radar Saúde recalcular em tempo real:\n\n${choiceStr}\n\nDigite o número de 1 a 5:`);
    
    if (input) {
      const idx = parseInt(input) - 1;
      if (idx >= 0 && idx < cities.length) {
        const selected = cities[idx];
        setUserLocation([selected.lat, selected.lng]);
        updateHospitalsWithBaseLocation(selected.lat, selected.lng);
        alert(`Simulando GPS em: ${selected.name}\nTodas as distâncias, rotas de ambulância (SAMU) e hospitais foram movidos e recalculados para esta nova área!`);
      }
    }
  };

  // Reverse Geocoding via Nominatim API to show real address of device
  useEffect(() => {
    if (userLocation[0] === -23.3045 && userLocation[1] === -51.1696) {
      setCurrentAddress("Av. Higienópolis, Londrina - Centro");
      return;
    }

    setCurrentAddress("Buscando endereço...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${userLocation[0]}&lon=${userLocation[1]}&format=json`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        if (data && data.address) {
          const addr = data.address;
          const street = addr.road || addr.suburb || addr.pedestrian || "";
          const city = addr.city || addr.town || addr.village || addr.municipality || "";
          const state = addr.state ? `, ${addr.state}` : "";
          if (street && city) {
            setCurrentAddress(`${street}, ${city}${state}`);
          } else if (city) {
            setCurrentAddress(`${city}${state}`);
          } else {
            setCurrentAddress(data.display_name.split(",").slice(0, 3).join(","));
          }
        } else {
          setCurrentAddress(`Lat: ${userLocation[0].toFixed(4)}, Lng: ${userLocation[1].toFixed(4)}`);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Geocoding fetch failed or aborted:", err);
        setCurrentAddress(`Lat: ${userLocation[0].toFixed(4)}, Lng: ${userLocation[1].toFixed(4)}`);
      });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [userLocation]);

  // Simulated GPS loading or real location check on startup
  useEffect(() => {
    // 1. Splash screen countdown
    const splashTimer = setTimeout(() => {
      let savedUser: string | null = null;
      try {
        savedUser = localStorage.getItem("radarSaudeUser");
      } catch (e) {
        console.warn("localStorage.getItem('radarSaudeUser') failed:", e);
      }

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setScreen("main");
        } catch (e) {
          setScreen("login");
        }
      } else {
        setScreen("login");
      }
    }, 2000);

    // 2. Fetch or mock user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          updateHospitalsWithBaseLocation(lat, lng);
        },
        () => {
          // Fallback to Londrina center
          setUserLocation([-23.3045, -51.1696]);
        }
      );
    }

    // 3. Load hospitals, triages and active dispatches from localStorage if available
    let savedHospitals: string | null = null;
    let savedTriages: string | null = null;
    try {
      savedHospitals = localStorage.getItem("radarSaudeHospitals");
      savedTriages = localStorage.getItem("radarSaudeTriages");
    } catch (e) {
      console.warn("localStorage.getItem for data failed:", e);
    }

    if (savedHospitals) {
      try {
        setHospitals(JSON.parse(savedHospitals));
      } catch (e) {}
    }

    if (savedTriages) {
      try {
        setTriages(JSON.parse(savedTriages));
      } catch (e) {}
    }

    return () => clearTimeout(splashTimer);
  }, []);

  // Sync hospitals, triages to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("radarSaudeHospitals", JSON.stringify(hospitals));
    } catch (e) {
      console.warn("localStorage.setItem('radarSaudeHospitals') failed:", e);
    }
  }, [hospitals]);

  useEffect(() => {
    try {
      localStorage.setItem("radarSaudeTriages", JSON.stringify(triages));
    } catch (e) {
      console.warn("localStorage.setItem('radarSaudeTriages') failed:", e);
    }
    // Find active user's triage ticket if any
    if (user && triages.length > 0) {
      const active = triages.find(
        (t) => t.patientCpf === user.cpf && t.status === "aguardando"
      );
      setUserTriage(active || null);
    } else {
      setUserTriage(null);
    }
  }, [triages, user]);

  // Live simulation for active SOS Ambulance dispatch routing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeDispatch) {
      interval = setInterval(() => {
        setActiveDispatch((prev) => {
          if (!prev) return null;
          const nextSecs = prev.secondsElapsed + 1;
          const totalDurationSecs = 20; // 20 seconds simulation run
          const progress = Math.min(1, nextSecs / totalDurationSecs);

          let nextStatus: EmergencyDispatch["status"] = prev.status;
          let nextArrivalMin = prev.estimatedArrivalMin;

          if (progress >= 1) {
            nextStatus = "chegou";
            nextArrivalMin = 0;
          } else if (progress > 0.15) {
            nextStatus = "a_caminho";
            // Dynamically decrease minutes
            nextArrivalMin = Math.max(1, prev.estimatedArrivalMin - 1);
          }

          if (progress >= 1) {
            // Arrived trigger
            alert("🚑 ALERTA SAMU: A ambulância de socorro acaba de chegar ao seu local de chamada!");
          }

          return {
            ...prev,
            secondsElapsed: nextSecs,
            status: nextStatus,
            estimatedArrivalMin: nextArrivalMin,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDispatch]);

  // Format inputs
  const formatCPF = (val: string) => {
    const digits = val.replace(/\D/g, "").substring(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").substring(0, 11);
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatCEP = (val: string) => {
    const digits = val.replace(/\D/g, "").substring(0, 8);
    return digits.replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 5 || !name.trim().includes(" ")) {
      showToast("Por favor, insira seu nome completo (nome e sobrenome).", "error");
      return;
    }
    if (cpf.replace(/\D/g, "").length !== 11) {
      showToast("CPF inválido.", "error");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      showToast("Número de telefone inválido.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("As senhas não coincidem.", "error");
      return;
    }

    const newUser: UserType = {
      name,
      cpf,
      phone,
      cep: cep || undefined,
      hasDisability,
      profilePhoto: proofFile || undefined,
    };

    setUser(newUser);
    try {
      localStorage.setItem("radarSaudeUser", JSON.stringify(newUser));
    } catch (e) {
      console.warn("localStorage.setItem('radarSaudeUser') failed:", e);
    }
    setScreen("main");
    showToast("Cadastro efetuado com sucesso no Radar Saúde!", "success");
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === "HOSP2024" && adminPassword === "admin123") {
      setAdminLoginOpen(false);
      setScreen("admin");
      setAdminCode("");
      setAdminPassword("");
      showToast("Autenticado como administrador hospitalar.", "success");
    } else {
      showToast("Código do Hospital ou senha de administrador incorretos.", "error");
    }
  };

  // Distance calculator helper
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  // Travel speed in km/h based on mode
  const speeds = { walk: 5, bike: 15, car: 40 };

  // Advanced calculation of wait times and detailed recommendations
  const computedHospitals = useMemo(() => {
    const urgencyOffset = userTriage ? userTriage.urgencyFactor : 0;
    const disabilityBonus = user?.hasDisability ? -15 : 0; // priority skip for PcD

    return hospitals.map((h) => {
      const distance = getDistance(userLocation[0], userLocation[1], h.lat, h.lng);
      const travelTimeMin = Math.round((distance / speeds[transportMode]) * 60);

      // (Queue * average minutes) / active doctors
      const queueWaitMin = Math.round((h.queue * h.avgServiceTime) / h.activeProfessionals);

      // Final waiting room time accounting for priority factors
      const priorityQueueMin = Math.max(0, queueWaitMin + urgencyOffset + disabilityBonus);

      const totalTimeMin = travelTimeMin + priorityQueueMin;

      return {
        ...h,
        distance,
        travelTimeMin,
        queueWaitMin,
        priorityQueueMin,
        totalTimeMin,
      };
    }).sort((a, b) => a.totalTimeMin - b.totalTimeMin); // Sort by total time to get the fastest suggetion!
  }, [hospitals, userLocation, transportMode, user, userTriage]);

  // Suggested Hospital recommendation
  const suggestion = useMemo(() => {
    if (computedHospitals.length === 0) return null;
    const best = computedHospitals[0];

    // Find the closest hospital geographically
    const closestGeographically = [...computedHospitals].sort((a, b) => a.distance - b.distance)[0];

    if (best.id !== closestGeographically.id) {
      const savedTime = closestGeographically.totalTimeMin - best.totalTimeMin;
      if (savedTime > 8) {
        return {
          hospital: best,
          reason: `Apesar do ${closestGeographically.name} estar mais perto (${closestGeographically.distance}km), a fila lá é maior. Escolhendo o ${best.name}, você economizará aproximadamente ${savedTime} minutos no tempo total de atendimento.`,
        };
      }
    }

    return {
      hospital: best,
      reason: `Esta é a sua melhor escolha. Menor tempo estimado de atendimento (${best.totalTimeMin} min total) considerando deslocamento e fila local.`,
    };
  }, [computedHospitals]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-slate-900">
      {/* 1. SPLASH SCREEN */}
      {screen === "splash" && (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
          <div className="text-center space-y-5 animate-pulse">
            <div className="w-24 h-24 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto text-4xl shadow-xl font-black">
              S
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">Radar Saúde</h1>
              <p className="text-sm text-emerald-400 font-bold tracking-wider uppercase mt-1">SUS Inteligente</p>
            </div>
          </div>
          <div className="mt-12 w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
        </div>
      )}

      {/* 2. LOGIN / REGISTER SCREEN */}
      {screen === "login" && (
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-slate-100">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 transition-all duration-300">
            <div className="bg-slate-950 p-6 sm:p-8 text-center text-white relative">
              <span className="absolute top-4 right-4 text-[9px] font-black bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full tracking-wider uppercase">
                SUS DIGITAL
              </span>
              <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-3 shadow-md shadow-emerald-500/20">
                S
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Radar Saúde</h2>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
                Monitore o tempo de espera estimado do SUS em tempo real e faça triagem digital inteligente.
              </p>
            </div>

            <form onSubmit={handleRegister} className="p-5 sm:p-8 space-y-4.5 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">Cadastro de Acesso Rápido</h3>
                <button
                  type="button"
                  onClick={() => {
                    setName("João da Silva Sauro");
                    setCpf("123.456.789-10");
                    setPhone("(43) 99999-8877");
                    setCep("86015-000");
                    setPassword("123456");
                    setConfirmPassword("123456");
                    setHasDisability(false);
                  }}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg transition border border-emerald-200 flex items-center gap-1 uppercase self-start sm:self-auto"
                  title="Preencher dados fictícios instantaneamente para testar o sistema"
                >
                  ⚡ Autopreencher para Teste
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Nome Completo *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">👤</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome e Sobrenome"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">CPF *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">💳</span>
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Telefone Celular *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">📱</span>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">CEP Residencial (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">📍</span>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(formatCEP(e.target.value))}
                    placeholder="00000-000"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Senha de Acesso *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔒</span>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-9 pr-9 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                    >
                      {passwordVisible ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Confirmar Senha *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔒</span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* PcD switch section */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-extrabold text-xs text-slate-800">Paciente Especial / PcD</label>
                    <p className="text-[10px] text-slate-500">Ativa a fila de prioridade legal no SUS.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDisability}
                      onChange={(e) => setHasDisability(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4.5 after:width-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {hasDisability && (
                  <div className="border-t border-emerald-200/40 pt-2.5 flex flex-col gap-2">
                    <label className="text-[9.5px] text-slate-500 font-semibold uppercase">Enviar Laudo ou Comprovante Oficial *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById("proof-file-input");
                          if (fileInput) fileInput.click();
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition ${
                          proofFile
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {proofFile ? "Documento Pronto ✓" : "Upload Documento"}
                      </button>
                      <input
                        id="proof-file-input"
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProofFile(file.name);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-black text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  <Activity className="w-4 h-4" />
                  Acessar Radar Saúde
                </button>

                <div className="text-center pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400">Funcionário de hospital?</p>
                  <button
                    type="button"
                    onClick={() => setAdminLoginOpen(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-extrabold text-xs mt-0.5 underline"
                  >
                    Acesso Administrativo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MAIN APP ENVIRONMENT */}
      {screen === "main" && user && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F3F4F6] font-sans">
          {/* Main Top Nav */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md shrink-0">
                  S
                </div>
                <div>
                  <h1 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none hidden sm:block">Localização Atual</h1>
                  <div className="flex items-center text-slate-800 mt-0.5 sm:mt-1 group cursor-pointer" onClick={refreshGPS} title="Clique para atualizar sua localização via GPS real">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shrink-0"></span>
                    <span className="font-semibold text-[11px] sm:text-sm truncate max-w-[110px] xs:max-w-[140px] sm:max-w-none group-hover:text-emerald-600 transition">{currentAddress}</span>
                    <span className="ml-1 text-slate-400 group-hover:text-emerald-500 text-[10px] hidden sm:inline">🔄</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Controls and Profile button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 shadow-sm transition"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </button>

              <button
                onClick={() => {
                  askConfirm("Deseja realmente sair do aplicativo?", () => {
                    setUser(null);
                    try {
                      localStorage.removeItem("radarSaudeUser");
                    } catch (e) {
                      console.warn("localStorage.removeItem failed:", e);
                    }
                    setScreen("login");
                    showToast("Você saiu da sua conta.", "info");
                  });
                }}
                className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition border border-slate-200 shadow-sm shrink-0"
                title="Sair"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden relative h-[calc(100vh-4rem)] min-h-0">
            {/* Mobile backdrop */}
            {sidebarOpen && (
              <div
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950/60 z-20 md:hidden animate-fade-in"
              />
            )}
            {/* Sidebar Controls Panel */}
            <aside
              className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 overflow-y-auto h-full z-30 fixed md:relative top-0 bottom-0 left-0 ${
                sidebarOpen ? "w-[290px] md:w-80 translate-x-0" : "w-[290px] -translate-x-full md:w-0 md:-translate-x-full"
              }`}
            >
              <div className="p-5 space-y-6">
                {/* Visual view toggles */}
                <div className="space-y-2">
                  <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visualização</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveView("map")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        activeView === "map"
                          ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      🗺️ Mapa
                    </button>
                    <button
                      onClick={() => setActiveView("list")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        activeView === "list"
                          ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      📋 Lista ({hospitals.length})
                    </button>
                  </div>
                </div>

                {/* Transport Toggles */}
                <div className="space-y-2">
                  <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modo de Transporte</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(["walk", "bike", "car"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTransportMode(mode)}
                        className={`py-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                          transportMode === mode
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="text-lg">
                          {mode === "walk" && "🚶"}
                          {mode === "bike" && "🚴"}
                          {mode === "car" && "🚗"}
                        </span>
                        <span className="text-[9px] font-bold uppercase">
                          {mode === "walk" && "A pé"}
                          {mode === "bike" && "Bike"}
                          {mode === "car" && "Carro"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urgent Action buttons: SOS and TRIAGE */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  {/* RED ALERT SOS BUTTON */}
                  <button
                    onClick={() => setSosModalOpen(true)}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex flex-col items-center justify-center space-y-0.5 transition-all active:scale-95 shadow-lg shadow-red-500/20 group font-bold tracking-tighter uppercase"
                  >
                    <Siren className="w-5 h-5 animate-pulse text-white" />
                    <span className="text-[13px] font-black tracking-tighter text-white">ACIONAR EMERGÊNCIA</span>
                    <span className="text-[9px] text-red-100 uppercase font-medium">Ambulância Imediata (192)</span>
                  </button>

                  {/* PRE-TRIAGE BLUE BUTTON */}
                  {!userTriage ? (
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-xs">Auto-Triagem Digital</span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-semibold">Opcional</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">Descreva seus sintomas antes de chegar para agilizar o encaminhamento no balcão.</p>
                      <button
                        onClick={() => setTriageModalOpen(true)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 uppercase"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Iniciar Triagem Prévia
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/30 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">
                          Triagem Ativa no SUS
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        Você está pré-triado em: <strong>{userTriage.hospitalName}</strong> com prioridade <strong>{userTriage.classification}</strong>.
                      </p>
                      <button
                        onClick={() => {
                          askConfirm("Deseja cancelar sua ficha de triagem atual para fazer uma nova?", () => {
                            setTriages((prev) => prev.filter((t) => t.id !== userTriage.id));
                            showToast("Ficha de triagem cancelada.", "info");
                          });
                        }}
                        className="text-[10px] text-rose-400 font-bold hover:underline"
                      >
                        Cancelar e Refazer Triagem
                      </button>
                    </div>
                  )}
                </div>

                {/* Suggested Destination Card */}
                {suggestion && (
                  <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/25 relative text-slate-200">
                    <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-emerald-500 text-[9px] font-black text-white rounded-md uppercase tracking-wider">
                      Recomendado
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-xs text-white">{suggestion.hospital.name}</h3>
                        <p className="text-[10px] text-slate-400">{suggestion.hospital.distance} km de distância</p>
                      </div>
                      <div className="text-right text-emerald-400">
                        <div className="text-xl font-black leading-none font-mono">{suggestion.hospital.totalTimeMin}</div>
                        <div className="text-[8px] font-black uppercase tracking-wider">minutos</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/60 italic mt-2">
                      "{suggestion.reason}"
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedHospitalId(suggestion.hospital.id);
                          setActiveView("map");
                        }}
                        className="text-[10px] text-emerald-400 font-extrabold hover:underline flex items-center gap-1"
                      >
                        Ver Rota no Mapa
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer Coordinates */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-sans font-black text-[9px] tracking-wider uppercase">SINAL GPS ATIVO</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">
                    {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={refreshGPS}
                    disabled={gpsLoading}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[9px] font-black text-slate-300 hover:text-white rounded-lg transition disabled:opacity-50 uppercase tracking-wide"
                    title="Obter coordenadas exatas do aparelho via API Geolocation"
                  >
                    {gpsLoading ? (
                      <span className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "🔄"
                    )}
                    {gpsLoading ? "Buscando..." : "Atualizar GPS"}
                  </button>
                  <button
                    onClick={simulateNewLocation}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[9px] font-black text-slate-300 hover:text-white rounded-lg transition uppercase tracking-wide"
                    title="Simular coordenadas em outra região brasileira para testar o sistema"
                  >
                    📍 Simular Outro
                  </button>
                </div>
                {gpsError && (
                  <p className="text-[8.5px] text-rose-400 font-medium text-center leading-tight">
                    {gpsError}
                  </p>
                )}
              </div>
            </aside>

            {/* Main Stage: Map or List */}
            <main className="flex-1 relative flex flex-col bg-[#F3F4F6] p-2 sm:p-4 gap-2 sm:gap-4">
              {/* If active dispatch is running, show warning alert */}
              {activeDispatch && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-spin-slow">🚑</span>
                    <div>
                      <h4 className="text-xs font-black text-red-600 uppercase tracking-wider">SOCORRO REQUISITADO EM ANDAMENTO</h4>
                      <p className="text-[11px] text-slate-600">
                        O veículo está a caminho do seu local. Previsão: <strong>{activeDispatch.estimatedArrivalMin} minutos</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSosModalOpen(true)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold uppercase transition shadow-sm"
                  >
                    Ver Painel SOS
                  </button>
                </div>
              )}

              {activeView === "map" ? (
                <div className="flex-1 min-h-0 relative w-full flex flex-col">
                  <Map
                    userLocation={userLocation}
                    hospitals={computedHospitals}
                    selectedHospitalId={selectedHospitalId}
                    onSelectHospital={(id) => setSelectedHospitalId(id)}
                    activeDispatchRoute={
                      activeDispatch && activeDispatch.status !== "chegou"
                        ? {
                            hospitalId: activeDispatch.hospitalId,
                            progress: activeDispatch.secondsElapsed / 20,
                          }
                        : null
                    }
                  />

                  {/* Selected Hospital Overlay Card */}
                  {selectedHospitalId !== null && (
                    (() => {
                      const h = computedHospitals.find((hosp) => hosp.id === selectedHospitalId);
                      if (!h) return null;

                      const isCongested = h.queue >= 20;
                      const isMedium = h.queue >= 10 && h.queue < 20;
                      const queueColor = isCongested
                        ? "text-rose-500"
                        : isMedium
                        ? "text-amber-500"
                        : "text-emerald-500";

                      return (
                        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xl max-w-md mx-auto animate-slide-up text-slate-800">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                                {h.type}
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-900 mt-1.5">{h.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">{h.address}</p>
                            </div>
                            <button
                              onClick={() => setSelectedHospitalId(null)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                              <p className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wide">ATENDIMENTO SUS:</p>
                              <div className="flex items-baseline gap-1">
                                <span className="font-black text-slate-900 text-base font-mono">{h.priorityQueueMin}</span>
                                <span className="text-[10px] text-slate-500">min</span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                Fila: <strong className={queueColor}>{h.queue}f</strong> | Dr: <strong>{h.activeProfessionals}</strong>
                              </p>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                              <p className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wide">VIAGEM ({transportMode === "walk" ? "A pé" : transportMode === "bike" ? "Bike" : "Carro"}):</p>
                              <div className="flex items-baseline gap-1">
                                <span className="font-black text-slate-900 text-base font-mono">{h.travelTimeMin}</span>
                                <span className="text-[10px] text-slate-500">min</span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                Dist: <strong>{h.distance} km</strong>
                              </p>
                            </div>
                          </div>

                          {/* Dynamic recommendation check inside card */}
                          <div className="bg-slate-900 rounded-xl p-3 sm:p-3.5 mt-4 border border-slate-800 flex items-center justify-between text-white shadow-md gap-2">
                            <div>
                              <p className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wide">TEMPO TOTAL:</p>
                              <p className="text-sm sm:text-base font-black text-emerald-400 font-mono">{h.totalTimeMin} min</p>
                            </div>
                            <button
                              onClick={() => {
                                setTriageModalOpen(true);
                              }}
                              className="px-2.5 sm:px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] sm:text-xs font-black rounded-xl transition flex items-center gap-1 shadow-md shadow-emerald-500/10 uppercase shrink-0"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              Fazer Triagem
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 overflow-y-auto shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="font-extrabold text-lg text-slate-800">Unidades Públicas Encontradas</h3>
                    <p className="text-xs text-slate-500">Ordenados pelo menor tempo de atendimento (viagem + fila legal).</p>
                  </div>

                  <div className="space-y-4">
                    {computedHospitals.map((h, idx) => {
                      const isCongested = h.queue >= 20;
                      const isMedium = h.queue >= 10 && h.queue < 20;
                      const queueColor = isCongested
                        ? "text-rose-500 bg-rose-50 border-rose-200/50"
                        : isMedium
                        ? "text-amber-500 bg-amber-50 border-amber-200/50"
                        : "text-emerald-500 bg-emerald-50 border-emerald-200/50";

                      const isRecommended = idx === 0;

                      return isRecommended ? (
                        <div
                          key={h.id}
                          className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/70 relative text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm hover:bg-emerald-50"
                        >
                          <div className="absolute -top-3 left-6 px-2.5 py-1 bg-emerald-500 text-[10px] font-black text-white rounded-md uppercase tracking-wider shadow-sm">
                            Recomendado
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                              ★
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                                  {h.type}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-900">{h.name}</h4>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1">📍 {h.address}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-2">
                                <span>🚗 Distância: <strong>{h.distance} km</strong></span>
                                <span>⏱️ Deslocamento: <strong>{h.travelTimeMin} min</strong></span>
                                <span>👨‍⚕️ Médicos ativos: <strong>{h.activeProfessionals}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-emerald-100 pt-3 sm:pt-0 shrink-0">
                            <div className="text-left sm:text-right">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">TEMPO TOTAL:</p>
                              <p className="text-xl font-black text-emerald-600 font-mono leading-none">{h.totalTimeMin} min</p>
                              <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded border uppercase mt-1.5 shadow-sm ${queueColor}`}>
                                Fila: {h.queue}f
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedHospitalId(h.id);
                                setActiveView("map");
                              }}
                              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition shadow-md shadow-emerald-500/10 uppercase"
                            >
                              Ver Rota
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={h.id}
                          className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm hover:border-slate-300"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                                  {h.type}
                                </span>
                                <h4 className="font-bold text-sm text-slate-800">{h.name}</h4>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">📍 {h.address}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-2">
                                <span>🚗 Distância: <strong>{h.distance} km</strong></span>
                                <span>⏱️ Deslocamento: <strong>{h.travelTimeMin} min</strong></span>
                                <span>👨‍⚕️ Médicos ativos: <strong>{h.activeProfessionals}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
                            <div className="text-left sm:text-right">
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">TEMPO TOTAL:</p>
                              <p className="text-lg font-black text-slate-700 font-mono leading-none">{h.totalTimeMin} min</p>
                              <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded border uppercase mt-1.5 shadow-sm ${queueColor}`}>
                                Fila: {h.queue}f
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedHospitalId(h.id);
                                setActiveView("map");
                              }}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm uppercase"
                            >
                              Ver Rota
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* Bottom Bar / Metrics Status */}
          <footer className="h-10 bg-white border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between text-[10px] font-medium text-slate-500 shrink-0 z-10 shadow-sm overflow-hidden">
            <div className="flex gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
              <div className="flex items-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 sm:mr-2 animate-pulse"></span>
                <span className="hidden xs:inline">Sincronizado</span>
                <span className="xs:hidden">Ativo</span>
              </div>
              <div className="flex items-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 sm:mr-2"></span>
                Tempo Real
              </div>
              <div className="flex items-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 sm:mr-2"></span>
                Busca: 15km
              </div>
            </div>
            <div className="hidden md:block italic text-slate-400">Radar Saúde SUS • Acelerando o atendimento público de saúde</div>
          </footer>
        </div>
      )}

      {/* 4. ADMIN STAGE FOR HOSPITAL STAFF */}
      {screen === "admin" && (
        <AdminPanel
          hospitals={hospitals}
          users={[
            { name: "Hubert Adulto", cpf: "123.456.789-00", phone: "(43) 98888-7777", hasDisability: true },
            { name: "Maria Oliveira", cpf: "987.654.321-11", phone: "(43) 99999-8888", hasDisability: false },
            { name: "João Silva", cpf: "456.123.789-22", phone: "(43) 97777-6666", hasDisability: false },
            ...(user ? [user] : []),
          ]}
          triages={triages}
          activeDispatch={activeDispatch}
          onUpdateHospitalQueue={(id, q) => {
            setHospitals((prev) =>
              prev.map((h) => (h.id === id ? { ...h, queue: q } : h))
            );
          }}
          onUpdateHospitalProfessionals={(id, p) => {
            setHospitals((prev) =>
              prev.map((h) => (h.id === id ? { ...h, activeProfessionals: p } : h))
            );
          }}
          onAddHospital={(h) => {
            const newH: Hospital = {
              ...h,
              id: hospitals.length > 0 ? Math.max(...hospitals.map((hos) => hos.id)) + 1 : 1,
            };
            setHospitals((prev) => [...prev, newH]);
          }}
          onDeleteHospital={(id) => {
            setHospitals((prev) => prev.filter((h) => h.id !== id));
          }}
          onLogout={() => {
            setScreen("login");
          }}
          onResolveTriage={(tid) => {
            setTriages((prev) =>
              prev.map((t) => (t.id === tid ? { ...t, status: "atendido" } : t))
            );
            alert("Ficha de triagem atualizada para: ADMITIDO.");
          }}
        />
      )}

      {/* 5. MODAL: PROFILE */}
      {profileModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-indigo-400">
                <User className="w-5 h-5" />
                <span className="font-sans font-bold text-sm uppercase tracking-wide">Meu Perfil do SUS</span>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 text-2xl font-black flex items-center justify-center mx-auto mb-2">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-extrabold text-white text-sm">{user.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">CPF: {user.cpf}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Telefone Cadastrado</label>
                  <input
                    type="text"
                    value={user.phone}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-850 text-slate-400 text-xs rounded-xl p-3 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">CEP de Residência</label>
                  <input
                    type="text"
                    value={user.cep || "Não informado"}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-850 text-slate-400 text-xs rounded-xl p-3 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-indigo-300">Acesso a Atendimento Prioritário</span>
                    <p className="text-[10px] text-slate-400">Deficiência / Mobilidade reduzida.</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase ${
                    user.hasDisability
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}>
                    {user.hasDisability ? "Sim" : "Não"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 shrink-0 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Fechar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TRIAGE MODAL */}
      <TriageModal
        isOpen={triageModalOpen}
        onClose={() => setTriageModalOpen(false)}
        hospitals={hospitals}
        userName={user?.name || "Cidadão"}
        userCpf={user?.cpf || "000.000.000-00"}
        userPhone={user?.phone || ""}
        onTriageSubmitted={(newTriage) => {
          setTriages((prev) => [newTriage, ...prev]);
        }}
      />

      {/* 7. EMERGENCY SOS MODAL */}
      <SOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        userLocation={userLocation}
        hospitals={hospitals}
        userName={user?.name || "Paciente"}
        userPhone={user?.phone || ""}
        onDispatchCreated={(newDispatch) => {
          setActiveDispatch(newDispatch);
        }}
        activeDispatch={activeDispatch}
        onCancelDispatch={() => {
          askConfirm("Deseja realmente cancelar o pedido de socorro emergencial?", () => {
            setActiveDispatch(null);
            setSosModalOpen(false);
            showToast("Chamado de emergência cancelado com sucesso.", "success");
          });
        }}
      />

      {/* 8. STAFF ADMIN LOGIN POPUP */}
      {adminLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-850 to-indigo-900 p-6 text-center border-b border-slate-800">
              <div className="text-3xl mb-1">🔐</div>
              <h3 className="text-base font-bold text-white">Acesso Administrativo</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Disponível para funcionários credenciados do SUS</p>
            </div>

            <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-200/80 leading-normal">
                Código Padrão: <strong>HOSP2024</strong> <br />
                Senha de Acesso: <strong>admin123</strong>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Código do Hospital</label>
                <input
                  type="text"
                  required
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Ex: HOSP2024"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Senha Admin</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdminLoginOpen(false)}
                  className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST SYSTEM */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-2xl border bg-slate-900 border-slate-800 text-white animate-fade-in max-w-sm w-[90%] md:w-auto">
          {toast.type === "success" && (
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
          )}
          {toast.type === "error" && (
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs shrink-0 font-bold">✕</span>
          )}
          {toast.type === "info" && (
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 font-bold">ℹ</span>
          )}
          <span className="text-[11px] sm:text-xs font-bold text-slate-100">{toast.message}</span>
        </div>
      )}

      {/* GLOBAL CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">Confirmação</h4>
            </div>
            <p className="text-xs text-slate-300 leading-normal font-medium">
              {confirmModal.message}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition uppercase tracking-wider shadow-lg shadow-emerald-500/10"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
