export interface Hospital {
  id: number;
  name: string;
  type: "UPA" | "Hospital" | "UBS" | "Pronto-Socorro";
  lat: number;
  lng: number;
  address: string;
  city: string;
  queue: number; // Number of people currently in line
  activeProfessionals: number; // Active doctors/nurses
  avgServiceTime: number; // average minutes per patient (e.g. 15)
}

export interface User {
  name: string;
  cpf: string;
  phone: string;
  cep?: string;
  hasDisability: boolean;
  profilePhoto?: string;
}

export interface Triage {
  id: string;
  patientName: string;
  patientCpf: string;
  patientPhone: string;
  symptoms: string[];
  intensity: "leve" | "moderado" | "grave";
  duration: string;
  description: string;
  hospitalId: number;
  hospitalName: string;
  status: "aguardando" | "atendido";
  createdAt: string;
  classification: "Verde" | "Amarelo" | "Vermelho";
  urgencyFactor: number; // minutes to add/subtract or adjust
}

export interface EmergencyDispatch {
  id: string;
  patientName: string;
  patientPhone: string;
  lat: number;
  lng: number;
  status: "acionando" | "a_caminho" | "chegou";
  hospitalId: number;
  hospitalName: string;
  estimatedArrivalMin: number;
  secondsElapsed: number;
}
