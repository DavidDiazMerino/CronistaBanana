
import React, { useState, useCallback } from 'react';
import type { FullTimelineData, TimelineEvent, AlternativeTimelineEvent, DivergencePoint } from './types';
import { generateTimelineData, generateOrEditImage, generateAlternativeTimeline } from './services/geminiService';
import { APP_TITLE, APP_DESCRIPTION } from './constants';
import Spinner from './components/Spinner';
import { ClockIcon, BranchIcon, HistoryIcon } from './components/Icons';

const HeroSection: React.FC<{ onGenerate: (character: string) => void; isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const [character, setCharacter] = useState('Blas de Lezo');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (character.trim() && !isLoading) {
            onGenerate(character.trim());
        }
    };

    return (
        <div className="text-center p-8 bg-gray-900/50 rounded-lg shadow-2xl shadow-cyan-500/10 backdrop-blur-sm">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200 mb-4">{APP_TITLE}</h1>
            <p className="text-lg text-gray-300 mb-6">{APP_DESCRIPTION}</p>

            <div className="text-left max-w-2xl mx-auto text-gray-300 mb-8">
                <p className="mb-3 font-semibold">Sigue estos pasos:</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>
                        <strong>Escribe</strong> el nombre de un personaje histórico. Para la demo puedes comenzar con
                        <em> Blas de Lezo</em>.
                    </li>
                    <li>
                        <strong>Genera</strong> su línea temporal real basada en información histórica curada.
                    </li>
                    <li>
                        <strong>Explora</strong> puntos de divergencia y crea líneas alternativas con imágenes del modelo
                        <em> Nano Banana</em> de Google Gemini.
                    </li>
                </ol>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <input
                    type="text"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    placeholder="Escribe un personaje histórico"
                    className="w-full sm:w-80 px-4 py-3 bg-gray-800/70 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-300"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner size="sm" /> : 'Generar Línea Temporal'}
                </button>
            </form>
        </div>
    );
};

const ImageCard: React.FC<{ eventId: number; images: Record<string, string>; imageLoading: Set<number>; prompt: string; }> = ({ eventId, images, imageLoading, prompt }) => {
    return (
        <div className="aspect-video bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 shadow-lg">
            {imageLoading.has(eventId) && <Spinner size="md" />}
            {!imageLoading.has(eventId) && !images[eventId] && <p className="text-gray-500">Error al generar imagen</p>}
            {images[eventId] && <img src={images[eventId]} alt={prompt} className="w-full h-full object-cover transition-opacity duration-500 opacity-0" onLoad={e => e.currentTarget.style.opacity = '1'} />}
        </div>
    );
};

const TimelineNode: React.FC<{ isLast?: boolean }> = ({ isLast = false }) => (
    <div className="absolute left-1/2 -ml-[1px] top-12 w-0.5 h-full bg-gray-700">
        <div className="absolute left-1/2 -ml-2 top-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-cyan-400"></div>
        {isLast && <div className="absolute left-1/2 -ml-2 bottom-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-cyan-400"></div>}
    </div>
);

// Fix: Omit 'eventId' from EventCard props as it's derived from the 'event' prop internally.
const EventCard: React.FC<{ event: TimelineEvent | AlternativeTimelineEvent; divergence?: DivergencePoint; onShowAlternative: (divergence: DivergencePoint) => void; isAlternative?: boolean; } & Omit<React.ComponentProps<typeof ImageCard>, 'prompt' | 'eventId'>> = ({ event, divergence, onShowAlternative, isAlternative = false, ...imageProps }) => {
    const title = 'titulo' in event ? event.titulo : event.titulo_eco;

    return (
        <div className="relative group w-full lg:w-2/3 mx-auto p-4">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50 p-6 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-cyan-500/10">
                <h3 className="text-2xl font-bold text-cyan-300 mb-2">{title}</h3>
                <p className="text-gray-300 mb-4">{event.descripcion_corta}</p>
                <ImageCard prompt={event.prompt_imagen_consistente} eventId={event.id} {...imageProps} />
                {divergence && !isAlternative && (
                    <div className="mt-6 p-4 border-t-2 border-dashed border-gray-600">
                        <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center"><BranchIcon className="w-5 h-5 mr-2"/> Punto de Divergencia</h4>
                        <p className="italic text-gray-400 mb-4">"{divergence.titulo_pregunta}"</p>
                        <button onClick={() => onShowAlternative(divergence)} className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-400 rounded-lg hover:bg-yellow-500/40 transition-colors">
                            Explorar línea temporal alternativa
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [characterName, setCharacterName] = useState<string>('');
    const [timelineData, setTimelineData] = useState<FullTimelineData | null>(null);
    const [images, setImages] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [activeAlternativeTimeline, setActiveAlternativeTimeline] = useState<AlternativeTimelineEvent[] | null>(null);
    const [isAlternativeLoading, setIsAlternativeLoading] = useState(false);

    const handleGenerateTimeline = async (character: string) => {
        setIsLoading(true);
        setError(null);
        setTimelineData(null);
        setImages({});
        setActiveAlternativeTimeline(null);
        setCharacterName(character);

        try {
            const data = await generateTimelineData(character);
            setTimelineData(data);

            let prevImage: string | undefined = undefined;
            for (const event of data.linea_temporal_real) {
                setImageLoading(prev => new Set(prev).add(event.id));
                try {
                    const newImage = await generateOrEditImage(event.prompt_imagen_consistente, prevImage);
                    setImages(prev => ({ ...prev, [event.id]: newImage }));
                    prevImage = newImage;
                } catch (err) {
                    console.error(`Failed to generate image for real event ID ${event.id}:`, err);
                } finally {
                    setImageLoading(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(event.id);
                        return newSet;
                    });
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleShowAlternative = useCallback(async (divergencePoint: DivergencePoint) => {
        if (!timelineData || !characterName) return;

        setIsAlternativeLoading(true);
        setActiveAlternativeTimeline(null);
        setError(null);

        const baseEvent = timelineData.linea_temporal_real.find(e => e.id === divergencePoint.id);
        if (!baseEvent || !images[baseEvent.id]) {
            setError("No se pudo encontrar el evento base o su imagen para la divergencia.");
            setIsAlternativeLoading(false);
            return;
        }

        try {
            const newAlternativeEvents = await generateAlternativeTimeline(characterName, divergencePoint, baseEvent);
            setActiveAlternativeTimeline(newAlternativeEvents);

            let prevImage: string | undefined = images[baseEvent.id];
            for (const event of newAlternativeEvents) {
                setImageLoading(prev => new Set(prev).add(event.id));
                try {
                    const newImage = await generateOrEditImage(event.prompt_imagen_consistente, prevImage);
                    setImages(prev => ({ ...prev, [event.id]: newImage }));
                    prevImage = newImage;
                } catch (err) {
                    console.error(`Failed to generate image for alternative event ID ${event.id}:`, err);
                } finally {
                    setImageLoading(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(event.id);
                        return newSet;
                    });
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar la línea temporal alternativa.");
        } finally {
            setIsAlternativeLoading(false);
        }
    }, [timelineData, characterName, images]);

    const imageCardProps = { images, imageLoading };

    return (
        <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-900/40 text-white font-sans">
            <main className="container mx-auto px-4 py-12">
                <HeroSection onGenerate={handleGenerateTimeline} isLoading={isLoading} />

                {isLoading && <div className="mt-12"><Spinner size="lg" /></div>}

                {error && <div className="mt-12 text-center p-4 bg-red-500/20 text-red-300 rounded-lg">{error}</div>}

                {timelineData && (
                    <div className="mt-16">
                        <section id="real-timeline">
                            <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-cyan-300 flex items-center justify-center gap-3"><ClockIcon className="w-8 h-8"/> Línea Temporal Real</h2>
                            <div className="relative flex flex-col items-center gap-12">
                                <TimelineNode isLast={!activeAlternativeTimeline} />
                                {timelineData.linea_temporal_real.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        divergence={timelineData.puntos_divergencia.find(d => d.id === event.id)}
                                        onShowAlternative={handleShowAlternative}
                                        {...imageCardProps}
                                    />
                                ))}
                            </div>
                        </section>

                        {isAlternativeLoading && <div className="mt-12"><Spinner size="lg" /></div>}

                        {activeAlternativeTimeline && (
                            <section id="alternative-timeline" className="mt-16 animate-fade-in">
                                <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 flex items-center justify-center gap-3"><HistoryIcon className="w-8 h-8"/> Línea Temporal Alternativa</h2>
                                <div className="relative flex flex-col items-center gap-12">
                                    <TimelineNode isLast={true} />
                                    {activeAlternativeTimeline.map(event => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onShowAlternative={() => {}}
                                            isAlternative={true}
                                            {...imageCardProps}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
