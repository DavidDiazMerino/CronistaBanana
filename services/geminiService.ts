
import { GoogleGenAI, Modality } from "@google/genai";
import { GEMINI_PROMPT_PROTOCOL, BLAS_DE_LEZO_BIOGRAPHY_URL } from '../constants';
import type { FullTimelineData, AlternativeTimelineEvent, DivergencePoint, TimelineEvent, Language } from '../types';
import { API_KEY } from '@/config';
import { timelineSchema, alternativeTimelineSchema } from './geminiSchemas';

const ai = new GoogleGenAI({ apiKey: API_KEY });

let blasBiographyPromise: Promise<string> | null = null;

/**
 * Fetches the biography of Blas de Lezo from a remote source.
 * The result is cached after the first successful request to avoid
 * repeated network calls on subsequent invocations.
 *
 * @returns Promise resolving to the biography text.
 * @throws {Error} If the biography cannot be retrieved.
 * @internal
 */
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



/**
 * Generates a historical timeline for the provided character using the Gemini API.
 * Additional RAG context is injected when the character is Blas de Lezo.
 *
 * @param character Name of the historical character to analyse.
 * @param lang Language for the returned titles and descriptions.
 * @returns A promise resolving to the complete timeline data structure.
 * @throws {Error} If the Gemini API request fails or returns malformed data.
 */
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

/**
 * Executes an asynchronous function with automatic retries.
 * Each retry waits for the specified delay and doubles the delay
 * on every subsequent attempt (exponential backoff).
 *
 * @template T
 * @param fn Function to execute.
 * @param retries Number of retry attempts before giving up. Defaults to 3.
 * @param delay Initial delay in milliseconds before retrying. Defaults to 1000.
 * @returns The resolved value from the provided function.
 * @throws Propagates the error from {@link fn} after all retries fail.
 * @internal
 */
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

/**
 * Generates a new image or edits an existing one using Gemini image models.
 * Provide only a prompt to create a fresh image, or include a base64 data URL
 * to apply edits to an existing JPEG. Prompts should succinctly describe the
 * desired scene and style (e.g., "17th-century naval battle, oil painting").
 *
 * @param prompt Text description of the desired image.
 * @param base64Image Optional existing image encoded as a `data:image/jpeg;base64,...` URL.
 * @returns Promise resolving to a base64-encoded JPEG data URL.
 * @throws {Error} If no image is produced or the Gemini API request fails.
 */
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


/**
 * Creates an alternative timeline based on a divergence point and the last
 * known real event for a character.
 *
 * @param character Name of the historical figure.
 * @param divergencePoint Divergence question and selected option.
 * @param lastRealEvent The last verified event from the real timeline.
 * @param lang Language for the resulting events.
 * @returns Promise resolving to a list of alternative timeline events.
 * @throws {Error} If the Gemini API request fails or returns malformed data.
 */
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
