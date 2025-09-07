
export interface TimelineEvent {
  id: number;
  titulo: string;
  descripcion_corta: string;
  prompt_imagen_consistente: string;
}

export interface DivergenceOption {
  titulo_opcion: string;
  descripcion_consecuencia: string;
}

export interface DivergencePoint {
  id: number;
  titulo_pregunta: string;
  opciones: {
    opcion_a: DivergenceOption;
    opcion_b: DivergenceOption;
  };
}

export interface AlternativeTimelineEvent {
  id: number;
  titulo_eco: string;
  descripcion_corta: string;
  prompt_imagen_consistente: string;
}

export interface FullTimelineData {
  linea_temporal_real: TimelineEvent[];
  puntos_divergencia: DivergencePoint[];
  linea_temporal_alternativa_ejemplo: AlternativeTimelineEvent[];
}
