import { Type } from "@google/genai";

/**
 * Schema for the full timeline data returned by Gemini.
 * Fields:
 * - linea_temporal_real: Array of five real events from the character's life.
 * - puntos_divergencia: Array of divergence points offering two choices for each event.
 * - linea_temporal_alternativa_ejemplo: Example list of three "echo" events in an alternative timeline.
 */
export const timelineSchema = {
    type: Type.OBJECT,
    properties: {
        linea_temporal_real: {
            type: Type.ARRAY,
            description: "Lista de 5 eventos clave en la vida real del personaje.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Identificador único del evento." },
                    titulo: { type: Type.STRING, description: "Título del evento." },
                    descripcion_corta: { type: Type.STRING, description: "Descripción breve del evento." },
                    prompt_imagen_consistente: { type: Type.STRING, description: "Prompt para generar una imagen consistente del personaje." }
                },
                required: ["id", "titulo", "descripcion_corta", "prompt_imagen_consistente"]
            }
        },
        puntos_divergencia: {
            type: Type.ARRAY,
            description: "Lista de 5 puntos de divergencia, uno por cada evento real.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "ID que corresponde al evento real." },
                    titulo_pregunta: { type: Type.STRING, description: "Pregunta sobre la decisión en el punto de divergencia." },
                    opciones: {
                        type: Type.OBJECT,
                        properties: {
                            opcion_a: {
                                type: Type.OBJECT,
                                properties: {
                                    titulo_opcion: { type: Type.STRING, description: "Título de la opción histórica." },
                                    descripcion_consecuencia: { type: Type.STRING, description: "Consecuencia de la opción histórica." }
                                },
                                required: ["titulo_opcion", "descripcion_consecuencia"]
                            },
                            opcion_b: {
                                type: Type.OBJECT,
                                properties: {
                                    titulo_opcion: { type: Type.STRING, description: "Título de la opción alternativa." },
                                    descripcion_consecuencia: { type: Type.STRING, description: "Consecuencia de la opción alternativa." }
                                },
                                required: ["titulo_opcion", "descripcion_consecuencia"]
                            }
                        },
                        required: ["opcion_a", "opcion_b"]
                    }
                },
                required: ["id", "titulo_pregunta", "opciones"]
            }
        },
        linea_temporal_alternativa_ejemplo: {
            type: Type.ARRAY,
            description: "Lista de 3 eventos 'eco' en la línea temporal alternativa.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Identificador único del eco alternativo." },
                    titulo_eco: { type: Type.STRING, description: "Título del eco." },
                    descripcion_corta: { type: Type.STRING, description: "Descripción breve del eco." },
                    prompt_imagen_consistente: { type: Type.STRING, description: "Prompt para generar una imagen consistente en la nueva realidad." }
                },
                required: ["id", "titulo_eco", "descripcion_corta", "prompt_imagen_consistente"]
            }
        }
    },
    required: ["linea_temporal_real", "puntos_divergencia", "linea_temporal_alternativa_ejemplo"]
};

/**
 * Schema for the list of "eco" events produced after a divergence point.
 * Each entry includes:
 * - id: Unique identifier for the echo.
 * - titulo_eco: Title of the echo.
 * - descripcion_corta: Brief description of the echo.
 * - prompt_imagen_consistente: Incremental prompt for generating consistent images in the new reality.
 */
export const alternativeTimelineSchema = {
    type: Type.ARRAY,
    description: "Lista de 3 eventos 'eco' en la línea temporal alternativa.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.INTEGER, description: "Identificador único del eco alternativo." },
            titulo_eco: { type: Type.STRING, description: "Título del eco." },
            descripcion_corta: { type: Type.STRING, description: "Descripción breve del eco." },
            prompt_imagen_consistente: { type: Type.STRING, description: "Prompt incremental para generar una imagen consistente en la nueva realidad." }
        },
        required: ["id", "titulo_eco", "descripcion_corta", "prompt_imagen_consistente"]
    }
};

