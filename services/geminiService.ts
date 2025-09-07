
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GEMINI_PROMPT_PROTOCOL, BLAS_DE_LEZO_BIOGRAPHY_URL } from '../constants';
import type { FullTimelineData, AlternativeTimelineEvent, DivergencePoint, TimelineEvent, Language } from '../types';
import { API_KEY } from '@/config';

const ai = new GoogleGenAI({ apiKey: API_KEY });

let blasBiographyPromise: Promise<string> | null = null;
const getBlasDeLezoBiography = async (): Promise<string> => {
    if (!blasBiographyPromise) {
        blasBiographyPromise = fetch(BLAS_DE_LEZO_BIOGRAPHY_URL).then(res => {
            if (!res.ok) {
                throw new Error('Failed to load Blas de Lezo biography');
            }
            return res.text();
        });
    }
    return blasBiographyPromise;
};

const timelineSchema = {
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


export const generateTimelineData = async (character: string, lang: Language): Promise<FullTimelineData> => {
    let ragContext = "Usa tu conocimiento interno sobre la biografía del [PERSONAJE_HISTORICO] como fuente de verdad primaria para esta tarea.";

    // Use detailed RAG context if the character is Blas de Lezo
    if (character.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('blas de lezo')) {
        try {
            ragContext = await getBlasDeLezoBiography();
        } catch (error) {
            console.error('Error loading Blas de Lezo biography:', error);
        }
    }

    const prompt = GEMINI_PROMPT_PROTOCOL
        .replace('[CONTEXTO_RAG]', ragContext)
        .replace(/\[PERSONAJE_HISTORICO\]/g, character);

    const languageInstruction = `Devuelve todos los títulos, descripciones y prompts de imagen en ${lang === 'es' ? 'español' : 'inglés'}.`;
    const fullPrompt = `${prompt}\n\n${languageInstruction}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: timelineSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as FullTimelineData;

    } catch (error) {
        console.error("Error generating timeline data:", error);
        throw new Error("Failed to generate timeline data from Gemini API.");
    }
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Retrying... attempts left: ${retries - 1}`);
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2); // exponential backoff
        }
        console.error("Image generation failed after multiple retries:", error);
        throw error;
    }
};

export const generateOrEditImage = async (prompt: string, base64Image?: string): Promise<string> => {
    return withRetry(async () => {
        if (base64Image) {
            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image.split(',')[1],
                },
            };
            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:image/jpeg;base64,${base64ImageBytes}`;
                }
            }
            throw new Error("Image edit operation did not return an image.");

        } else {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `${prompt}, cinematic lighting, dramatic, high detail, historical painting style`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
            throw new Error("No image was generated.");
        }
    });
};

const alternativeTimelineSchema = {
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

export const generateAlternativeTimeline = async (character: string, divergencePoint: DivergencePoint, lastRealEvent: TimelineEvent, lang: Language): Promise<AlternativeTimelineEvent[]> => {
    const prompt = `
        ROL: Eres un "Cronista Contrafactual", un experto en historia y narrativa.
        TAREA: Genera una línea de tiempo alternativa plausible y dramática.

        CONTEXTO: Estamos explorando la vida de ${character}. El último evento conocido en su línea temporal real fue:
        - Título: ${lastRealEvent.titulo}
        - Descripción: ${lastRealEvent.descripcion_corta}

        PUNTO DE DIVERGENCIA: En lugar de lo que realmente sucedió, considera este escenario alternativo:
        - Pregunta: ${divergencePoint.titulo_pregunta}
        - Opción Elegida: ${divergencePoint.opciones.opcion_b.titulo_opcion}
        - Consecuencia Inmediata: ${divergencePoint.opciones.opcion_b.descripcion_consecuencia}

        MISIÓN: Basado en esta divergencia, genera una lista de 3 "ecos" o consecuencias futuras. 
        - Cada eco debe tener 'id', 'titulo_eco', 'descripcion_corta', y 'prompt_imagen_consistente'.
        - Los 'id' deben ser únicos y empezar desde ${divergencePoint.id * 100 + 1}.
        - Los 'prompt_imagen_consistente' deben ser incrementales, asumiendo que se parte de una imagen del personaje en el momento del evento "${lastRealEvent.titulo}" y se le aplican los cambios de la nueva realidad. El primer prompt debe describir los cambios iniciales, y los siguientes deben basarse en la imagen alternativa anterior.

        OUTPUT ESPERADO: Devuelve un único array JSON con los 3 ecos, siguiendo el schema proporcionado.
    `;

    const languageInstruction = `Devuelve todos los títulos, descripciones y prompts de imagen en ${lang === 'es' ? 'español' : 'inglés'}.`;
    const fullPrompt = `${prompt}\n\n${languageInstruction}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: alternativeTimelineSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AlternativeTimelineEvent[];

    } catch (error) {
        console.error("Error generating alternative timeline data:", error);
        throw new Error("Failed to generate alternative timeline data from Gemini API.");
    }
};
