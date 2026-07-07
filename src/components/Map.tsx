import React, { useMemo, useState } from "react";
import { Hospital } from "../types";
import { Navigation, Compass, Star, MapPin, Search, Plus, Minus, Info, Layers } from "lucide-react";

interface MapProps {
  userLocation: [number, number];
  hospitals: Hospital[];
  selectedHospitalId: number | null;
  onSelectHospital: (id: number) => void;
  activeDispatchRoute?: {
    hospitalId: number;
    progress: number; // 0 to 1
  } | null;
}

export default function Map({
  userLocation,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  activeDispatchRoute,
}: MapProps) {
  // Navigation states
  const [viewMode, setViewMode] = useState<"real" | "radar">("real");
  const [mapType, setMapType] = useState<"m" | "h">("m"); // 'm' = normal, 'h' = hybrid (satellite)
  const [realZoom, setRealZoom] = useState(15);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Map coordinates to 0-500 canvas coordinates for vector mode
  const points = useMemo(() => {
    const allCoords = [
      { lat: userLocation[0], lng: userLocation[1], id: -1, isUser: true },
      ...hospitals.map((h) => ({ lat: h.lat, lng: h.lng, id: h.id, isUser: false })),
    ];

    const lats = allCoords.map((c) => c.lat);
    const lngs = allCoords.map((c) => c.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    // Create coords with 50px padding in a 500x500 viewport
    return allCoords.map((c) => {
      // Invert Y because SVG coordinates increase downwards, whereas latitudes increase upwards
      const x = 50 + ((c.lng - minLng) / lngRange) * 400;
      const y = 450 - ((c.lat - minLat) / latRange) * 400;
      return { id: c.id, x, y, isUser: c.isUser };
    });
  }, [userLocation, hospitals]);

  const userPoint = points.find((p) => p.isUser);
  const selectedPoint = points.find((p) => p.id === selectedHospitalId);

  const selectedHospital = useMemo(() => {
    return hospitals.find((h) => h.id === selectedHospitalId) || null;
  }, [hospitals, selectedHospitalId]);

  // Dynamic center coordinates for the real map
  const mapCenter = useMemo(() => {
    if (selectedHospital) {
      return { lat: selectedHospital.lat, lng: selectedHospital.lng, label: selectedHospital.name };
    }
    return { lat: userLocation[0], lng: userLocation[1], label: "Sua Localização" };
  }, [selectedHospital, userLocation]);

  // Background street grids for vector mode
  const streets = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; name: string }> = [];
    const roadNames = [
      "Av. da Saúde Pública",
      "Rua do Resgate Rápido",
      "Av. Principal do SUS",
      "Rua da Triagem",
      "Av. dos Médicos",
      "Rua da Esperança",
    ];

    if (userPoint) {
      points.forEach((p, idx) => {
        if (idx < 5) {
          lines.push({
            x1: 10,
            y1: p.y,
            x2: 490,
            y2: p.y,
            name: roadNames[idx % roadNames.length],
          });
          lines.push({
            x1: p.x,
            y1: 10,
            x2: p.x,
            y2: 490,
            name: roadNames[(idx + 2) % roadNames.length],
          });
        }
      });
    }
    return lines;
  }, [points, userPoint]);

  // Drag / Pan handlers for vector mode
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Ambulance coordinates when SOS is active
  const ambulanceCoords = useMemo(() => {
    if (!activeDispatchRoute || !userPoint) return null;
    const hospPt = points.find((p) => p.id === activeDispatchRoute.hospitalId);
    if (!hospPt) return null;

    const t = activeDispatchRoute.progress;
    return {
      x: hospPt.x + (userPoint.x - hospPt.x) * t,
      y: hospPt.y + (userPoint.y - hospPt.y) * t,
    };
  }, [activeDispatchRoute, points, userPoint]);

  const activeDispatchHospPt = useMemo(() => {
    if (!activeDispatchRoute) return null;
    return points.find((p) => p.id === activeDispatchRoute.hospitalId) || null;
  }, [activeDispatchRoute, points]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col select-none rounded-2xl border border-slate-800">
      
      {/* Top Map HUD - Contains View Toggles & Map Info */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Status Badge */}
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 pointer-events-auto shrink-0">
            <Compass className="w-4.5 h-4.5 text-emerald-400 animate-spin-slow shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Sinal GPS</p>
              <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ativo (Real)
              </p>
            </div>
          </div>

          {/* Map Selector TABS (Segmented Control) */}
          <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl flex items-center gap-1 pointer-events-auto">
            <button
              onClick={() => setViewMode("real")}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition flex items-center gap-1.5 uppercase tracking-wider ${
                viewMode === "real"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🌐</span>
              <span className="hidden xs:inline">Mapa Real</span>
              <span className="xs:hidden">Google</span>
            </button>
            <button
              onClick={() => setViewMode("radar")}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition flex items-center gap-1.5 uppercase tracking-wider ${
                viewMode === "radar"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>📊</span>
              <span className="hidden xs:inline">Radar Vetorial</span>
              <span className="xs:hidden">Vetorial</span>
            </button>
          </div>

          {/* Right Controls: Layers & Zoom Actions */}
          <div className="flex gap-1.5 pointer-events-auto">
            {viewMode === "real" && (
              <button
                onClick={() => setMapType((t) => (t === "m" ? "h" : "m"))}
                className="p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition text-slate-200 rounded-lg shadow-lg flex items-center gap-1 text-[10px] font-black uppercase shrink-0"
                title={mapType === "m" ? "Ativar Modo Satélite" : "Ativar Modo Mapa"}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{mapType === "m" ? "Satélite" : "Mapa"}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (viewMode === "real") {
                  setRealZoom((z) => Math.min(z + 1, 20));
                } else {
                  setZoom((z) => Math.min(z + 0.2, 2.5));
                }
              }}
              className="p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition text-slate-200 rounded-lg shadow-lg"
              title="Aumentar Zoom"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (viewMode === "real") {
                  setRealZoom((z) => Math.max(z - 1, 10));
                } else {
                  setZoom((z) => Math.max(z - 0.2, 0.6));
                }
              }}
              className="p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition text-slate-200 rounded-lg shadow-lg"
              title="Diminuir Zoom"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (viewMode === "real") {
                  setRealZoom(15);
                } else {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }
              }}
              className="p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition text-slate-200 rounded-lg shadow-lg"
              title="Centralizar"
            >
              <Navigation className="w-4 h-4 rotate-45" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Content View Switcher */}
      {viewMode === "real" ? (
        /* GOOGLE MAPS DYNAMIC IFRAME */
        <div className="flex-1 min-h-0 w-full relative bg-slate-950">
          <iframe
            src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${realZoom}&t=${mapType}&output=embed&iwloc=near`}
            className="w-full h-full border-0 rounded-2xl filter brightness-95 contrast-105"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer"
            title="Google Maps"
          />
          

        </div>
      ) : (
        /* SVG VECTOR RADAR SIMULATION */
        <div className="flex-1 min-h-0 w-full relative bg-slate-950">
          <svg
          id="radar-map"
          className="w-full h-full cursor-grab active:cursor-grabbing bg-slate-950"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          viewBox="0 0 500 500"
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: "center" }}>
            {/* Radar background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="1" />
              </pattern>
              <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.08)" />
                <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
              </radialGradient>
            </defs>

            {/* Ambient Glow */}
            {userPoint && (
              <circle cx={userPoint.x} cy={userPoint.y} r="250" fill="url(#radar-glow)" />
            )}

            {/* Grid pattern */}
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#grid)" />

            {/* Street blocks */}
            {streets.map((st, i) => (
              <g key={`street-${i}`}>
                <line
                  x1={st.x1}
                  y1={st.y1}
                  x2={st.x2}
                  y2={st.y2}
                  stroke="#1e293b"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.65"
                />
                <line
                  x1={st.x1}
                  y1={st.y1}
                  x2={st.x2}
                  y2={st.y2}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
              </g>
            ))}

            {/* Routes to selected hospital */}
            {userPoint && selectedPoint && (
              <g>
                <path
                  d={`M ${userPoint.x} ${userPoint.y} L ${selectedPoint.x} ${userPoint.y} L ${selectedPoint.x} ${selectedPoint.y}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                  opacity="0.85"
                />
                <path
                  d={`M ${userPoint.x} ${userPoint.y} L ${selectedPoint.x} ${userPoint.y} L ${selectedPoint.x} ${selectedPoint.y}`}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.15"
                />
              </g>
            )}

            {/* SOS ambulance path route */}
            {activeDispatchRoute && userPoint && activeDispatchHospPt && (
              <path
                d={`M ${activeDispatchHospPt.x} ${activeDispatchHospPt.y} L ${activeDispatchHospPt.x} ${userPoint.y} L ${userPoint.x} ${userPoint.y}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5 5"
                opacity="0.75"
              />
            )}

            {/* Hospital Markers */}
            {points.filter(p => !p.isUser).map((pt) => {
              const h = hospitals.find((hosp) => hosp.id === pt.id);
              if (!h) return null;

              const isSelected = h.id === selectedHospitalId;
              const isCongested = h.queue >= 20;
              const isMedium = h.queue >= 10 && h.queue < 20;
              const markerColor = isCongested
                ? "text-rose-500 fill-rose-500/20"
                : isMedium
                ? "text-amber-500 fill-amber-500/20"
                : "text-emerald-500 fill-emerald-500/20";

              return (
                <g
                  key={`hosp-group-${h.id}`}
                  className="transition-transform duration-300 cursor-pointer hover:scale-110"
                  onClick={() => onSelectHospital(h.id)}
                >
                  {/* Ping wave */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? "22" : "14"}
                    className="animate-ping"
                    fill="none"
                    stroke={isSelected ? "#10b981" : isCongested ? "#f43f5e" : "#10b981"}
                    strokeWidth="1"
                    opacity="0.3"
                  />

                  {/* Main point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? "18" : "12"}
                    className={`${markerColor} stroke-slate-900 stroke-2`}
                  />

                  {/* Mini Cross Symbol */}
                  <path
                    d={`M ${pt.x - 4} ${pt.y} L ${pt.x + 4} ${pt.y} M ${pt.x} ${pt.y - 4} L ${pt.x} ${pt.y + 4}`}
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Hospital Tag Name */}
                  <g transform={`translate(${pt.x}, ${pt.y - (isSelected ? 26 : 20)})`}>
                    <rect
                      x="-65"
                      y="-12"
                      width="130"
                      height="20"
                      rx="6"
                      fill="#0f172a"
                      stroke={isSelected ? "#10b981" : "#334155"}
                      strokeWidth={isSelected ? "1.5" : "1"}
                      className="shadow-md"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill={isSelected ? "#34d399" : "#e2e8f0"}
                      fontSize="9"
                      fontWeight={isSelected ? "bold" : "600"}
                      className="font-sans"
                    >
                      {h.name.length > 20 ? h.name.substring(0, 18) + "..." : h.name}
                    </text>
                    {/* Fila count tag */}
                    <rect
                      x="25"
                      y="-16"
                      width="35"
                      height="10"
                      rx="3"
                      fill={isCongested ? "#ef4444" : isMedium ? "#f59e0b" : "#10b981"}
                    />
                    <text
                      x="42.5"
                      y="-9"
                      textAnchor="middle"
                      fill="white"
                      fontSize="7"
                      fontWeight="bold"
                    >
                      {h.queue}f
                    </text>
                  </g>
                </g>
              );
            })}

            {/* User Marker */}
            {userPoint && (
              <g transform={`translate(${userPoint.x}, ${userPoint.y})`} className="cursor-pointer">
                <circle
                  cx="0"
                  cy="0"
                  r="24"
                  className="animate-ping"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="12"
                  fill="rgba(16, 185, 129, 0.25)"
                  className="animate-pulse"
                />
                <circle cx="0" cy="0" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                <g transform="translate(0, 18)">
                  <rect x="-35" y="-8" width="70" height="15" rx="4" fill="#10b981" />
                  <text x="0" y="2" textAnchor="middle" fill="slate-950" fontSize="8" fontWeight="bold">
                    Você está aqui
                  </text>
                </g>
              </g>
            )}

            {/* SOS Ambulance Marker */}
            {ambulanceCoords && (
              <g transform={`translate(${ambulanceCoords.x}, ${ambulanceCoords.y})`} className="animate-bounce">
                <circle cx="0" cy="0" r="15" fill="#ef4444" className="animate-ping" opacity="0.5" />
                <circle cx="0" cy="0" r="12" fill="#ef4444" stroke="white" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fontSize="11">🚑</text>
                <g transform="translate(0, -18)">
                  <rect x="-40" y="-8" width="80" height="15" rx="4" fill="#ef4444" />
                  <text x="0" y="2" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                    Ambulância
                  </text>
                </g>
              </g>
            )}
          </g>
        </svg>
        </div>
      )}

      {/* Map Legend (Visible in both modes or easily references color meanings) */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-750/80 px-2.5 py-1.5 rounded-xl text-[9px] sm:text-[10px] text-slate-300 flex items-center gap-3 sm:gap-4 shadow-xl">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Rápido (&lt;10f)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Médio (10-20f)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Fila Cheia (&gt;20f)</span>
        </div>
      </div>
    </div>
  );
}
