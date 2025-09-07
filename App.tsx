
import React, { useState, useCallback, useEffect, useReducer } from 'react';
import type { FullTimelineData, TimelineEvent, AlternativeTimelineEvent, DivergencePoint, Language } from './types';
import { generateTimelineData, generateOrEditImage, generateAlternativeTimeline } from './services/geminiService';
import { translations, type Translation } from './i18n';
import Spinner from './components/Spinner';
import ImageSkeleton from './components/ImageSkeleton';
import { ClockIcon, BranchIcon, HistoryIcon } from './components/Icons';
import esFlag from './assets/es.svg';
import gbFlag from './assets/gb.svg';

const HeroSection: React.FC<{ onGenerate: (character: string) => void; isLoading: boolean; t: Translation }> = ({ onGenerate, isLoading, t }) => {
    const [character, setCharacter] = useState('Blas de Lezo');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (character.trim() && !isLoading) {
            onGenerate(character.trim());
        }
    };

    return (
        <div className="text-center p-8 bg-gray-900/50 rounded-lg shadow-2xl shadow-cyan-500/10 backdrop-blur-sm">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200 mb-4">{t.appTitle}</h1>
            <p className="text-lg text-gray-300 mb-6">{t.appDescription}</p>

            <div className="text-left max-w-2xl mx-auto text-gray-300 mb-8">
                <p className="mb-3 font-semibold">{t.stepsIntro}</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li className="bg-gray-800/40 border-l-4 border-cyan-500 p-3">
                        <div className="flex items-start gap-2">
                            <ClockIcon className="w-5 h-5 text-cyan-400 mt-1" />
                            <span>{t.step1}</span>
                        </div>
                    </li>
                    <li className="bg-gray-800/40 border-l-4 border-cyan-500 p-3">
                        <div className="flex items-start gap-2">
                            <BranchIcon className="w-5 h-5 text-cyan-400 mt-1" />
                            <span>{t.step2}</span>
                        </div>
                    </li>
                    <li className="bg-gray-800/40 border-l-4 border-cyan-500 p-3">
                        <div className="flex items-start gap-2">
                            <HistoryIcon className="w-5 h-5 text-cyan-400 mt-1" />
                            <span>{t.step3}</span>
                        </div>
                    </li>
                </ol>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <input
                    type="text"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    placeholder={t.placeholder}
                    aria-label={t.placeholder}
                    className="w-full sm:w-80 px-4 py-3 bg-gray-800/70 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-300"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner size="sm" label={t.loading} /> : t.generateButton}
                </button>
            </form>
        </div>
    );
};

const ImageCard: React.FC<{ eventId: number; images: Record<string, string>; imageLoading: Set<number>; alt: string; errorText: string; loadingLabel: string; }> = ({ eventId, images, imageLoading, alt, errorText, loadingLabel }) => {
    return (
        <div className="relative aspect-video bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 shadow-lg">
            {imageLoading.has(eventId) && <ImageSkeleton />}
            {imageLoading.has(eventId) && <Spinner size="md" label={loadingLabel} />}
            {!imageLoading.has(eventId) && !images[eventId] && <p className="text-gray-500">{errorText}</p>}
            {images[eventId] && (
                <img
                    src={images[eventId]}
                    alt={alt}
                    className="w-full h-full object-cover transition-opacity duration-500 opacity-0"
                    onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                />
            )}
        </div>
    );
};

const TimelineNode: React.FC<{ isLast?: boolean }> = ({ isLast = false }) => (
    <div className="absolute left-1/2 -ml-[1px] top-12 w-0.5 h-full bg-gray-700">
        <div className="absolute left-1/2 -ml-2 top-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-cyan-400"></div>
        {isLast && <div className="absolute left-1/2 -ml-2 bottom-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-cyan-400"></div>}
    </div>
);

// Fix: Omit derived props from ImageCard as they are provided within this component.
const EventCard: React.FC<{ event: TimelineEvent | AlternativeTimelineEvent; divergence?: DivergencePoint; onShowAlternative: (divergence: DivergencePoint) => void; isAlternative?: boolean; t: Translation; } & Omit<React.ComponentProps<typeof ImageCard>, 'eventId' | 'errorText' | 'alt' | 'loadingLabel'>> = ({ event, divergence, onShowAlternative, isAlternative = false, t, ...imageProps }) => {
    const title = 'titulo' in event ? event.titulo : event.titulo_eco;

    return (
        <div className="relative group w-full lg:w-2/3 mx-auto p-4">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50 p-6 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-cyan-500/10">
                <h3 className="text-2xl font-bold text-cyan-300 mb-2">{title}</h3>
                <p className="text-gray-300 mb-4">{event.descripcion_corta}</p>
                <ImageCard
                    eventId={event.id}
                    alt={t.imageAlt(title)}
                    errorText={t.imageError}
                    loadingLabel={t.loading}
                    {...imageProps}
                />
                {divergence && !isAlternative && (
                    <div className="mt-6 p-4 border-t-2 border-dashed border-gray-600">
                        <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center"><BranchIcon className="w-5 h-5 mr-2"/> {t.divergenceTitle}</h4>
                        <p className="italic text-gray-400 mb-4">"{divergence.titulo_pregunta}"</p>
                        <button onClick={() => onShowAlternative(divergence)} className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-400 rounded-lg hover:bg-yellow-500/40 transition-colors">
                            {t.exploreAlternative}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

type AppState = {
    characterName: string;
    timelineData: FullTimelineData | null;
    images: Record<string, string>;
    isLoading: boolean;
    imageLoading: Set<number>;
    error: string | null;
    activeAlternativeTimeline: AlternativeTimelineEvent[] | null;
    isAlternativeLoading: boolean;
    imageProgress: { current: number; total: number } | null;
};

type Action =
    | { type: 'SET'; payload: Partial<AppState> }
    | { type: 'ADD_IMAGE_LOADING'; id: number }
    | { type: 'REMOVE_IMAGE_LOADING'; id: number }
    | { type: 'SET_IMAGE'; id: number; url: string };

const initialState: AppState = {
    characterName: '',
    timelineData: null,
    images: {},
    isLoading: false,
    imageLoading: new Set(),
    error: null,
    activeAlternativeTimeline: null,
    isAlternativeLoading: false,
    imageProgress: null,
};

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET':
            return { ...state, ...action.payload };
        case 'ADD_IMAGE_LOADING':
            return { ...state, imageLoading: new Set(state.imageLoading).add(action.id) };
        case 'REMOVE_IMAGE_LOADING':
            const newSet = new Set(state.imageLoading);
            newSet.delete(action.id);
            return { ...state, imageLoading: newSet };
        case 'SET_IMAGE':
            return { ...state, images: { ...state.images, [action.id]: action.url } };
        default:
            return state;
    }
}

const App: React.FC = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { characterName, timelineData, images, isLoading, imageLoading, error, activeAlternativeTimeline, isAlternativeLoading, imageProgress } = state;
    const [language, setLanguage] = useState<Language>('es');
    const t = translations[language];

    const waitingMessages = {
        real: [
            'Viajando al pasado para recuperar datos perdidos…',
            'Consultando archivos polvorientos de la historia…',
            'Convenciendo a cronistas gruñones para que hablen…',
        ],
        alternative: [
            'Abriendo portales al multiverso…',
            'Interrogando a viajeros temporales indiscretos…',
            'Negociando con realidades paralelas…',
        ],
    };
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        const active = isLoading ? 'real' : isAlternativeLoading ? 'alternative' : null;
        if (!active) {
            setLoadingMessage('');
            return;
        }
        let index = 0;
        const messages = waitingMessages[active];
        setLoadingMessage(messages[0]);
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setLoadingMessage(messages[index]);
        }, 3000);
        return () => clearInterval(interval);
    }, [isLoading, isAlternativeLoading]);

    useEffect(() => {
        if (activeAlternativeTimeline) {
            document.getElementById('alternative-timeline')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeAlternativeTimeline]);

    useEffect(() => {
        document.documentElement.lang = language;
        document.title = t.appTitle;
    }, [language, t.appTitle]);

    const handleGenerateTimeline = async (character: string) => {
        dispatch({
            type: 'SET',
            payload: {
                isLoading: true,
                error: null,
                timelineData: null,
                images: {},
                activeAlternativeTimeline: null,
                characterName: character,
            },
        });

        try {
            const data = await generateTimelineData(character, language);
            dispatch({ type: 'SET', payload: { timelineData: data, imageProgress: { current: 0, total: data.linea_temporal_real.length } } });

            let prevImage: string | undefined = undefined;
            let completed = 0;
            for (const event of data.linea_temporal_real) {
                dispatch({ type: 'ADD_IMAGE_LOADING', id: event.id });
                try {
                    const newImage = await generateOrEditImage(event.prompt_imagen_consistente, prevImage);
                    dispatch({ type: 'SET_IMAGE', id: event.id, url: newImage });
                    prevImage = newImage;
                } catch (err) {
                    console.error(`Failed to generate image for real event ID ${event.id}:`, err);
                } finally {
                    dispatch({ type: 'REMOVE_IMAGE_LOADING', id: event.id });
                    completed++;
                    dispatch({ type: 'SET', payload: { imageProgress: { current: completed, total: data.linea_temporal_real.length } } });
                }
            }
            dispatch({ type: 'SET', payload: { imageProgress: null } });
        } catch (err) {
            dispatch({ type: 'SET', payload: { error: err instanceof Error ? err.message : t.unknownError } });
        } finally {
            dispatch({ type: 'SET', payload: { isLoading: false } });
        }
    };
    
    const handleShowAlternative = useCallback(async (divergencePoint: DivergencePoint) => {
        if (!timelineData || !characterName) return;

        dispatch({ type: 'SET', payload: { isAlternativeLoading: true, activeAlternativeTimeline: null, error: null } });

        const baseEvent = timelineData.linea_temporal_real.find(e => e.id === divergencePoint.id);
        if (!baseEvent || !images[baseEvent.id]) {
            dispatch({ type: 'SET', payload: { error: t.baseEventError, isAlternativeLoading: false } });
            return;
        }

        try {
            const newAlternativeEvents = await generateAlternativeTimeline(characterName, divergencePoint, baseEvent, language);
            dispatch({ type: 'SET', payload: { activeAlternativeTimeline: newAlternativeEvents, imageProgress: { current: 0, total: newAlternativeEvents.length } } });

            let prevImage: string | undefined = images[baseEvent.id];
            let completed = 0;
            for (const event of newAlternativeEvents) {
                dispatch({ type: 'ADD_IMAGE_LOADING', id: event.id });
                try {
                    const newImage = await generateOrEditImage(event.prompt_imagen_consistente, prevImage);
                    dispatch({ type: 'SET_IMAGE', id: event.id, url: newImage });
                    prevImage = newImage;
                } catch (err) {
                    console.error(`Failed to generate image for alternative event ID ${event.id}:`, err);
                } finally {
                    dispatch({ type: 'REMOVE_IMAGE_LOADING', id: event.id });
                    completed++;
                    dispatch({ type: 'SET', payload: { imageProgress: { current: completed, total: newAlternativeEvents.length } } });
                }
            }
            dispatch({ type: 'SET', payload: { imageProgress: null } });
        } catch (err) {
            dispatch({ type: 'SET', payload: { error: err instanceof Error ? err.message : t.alternativeGenerationError } });
        } finally {
            dispatch({ type: 'SET', payload: { isAlternativeLoading: false } });
        }
    }, [timelineData, characterName, images, language, t.baseEventError, t.alternativeGenerationError]);

    const imageCardProps = { images, imageLoading };

    return (
        <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-900/40 text-white font-sans relative">
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setLanguage(prev => prev === 'es' ? 'en' : 'es')}
                    className="px-3 py-1 bg-gray-800 rounded text-sm border border-gray-600 hover:border-cyan-400 transition-colors"
                    aria-label={language === 'es' ? t.switchToEnglish : t.switchToSpanish}
                >
                    <img
                        src={language === 'es' ? esFlag : gbFlag}
                        alt={language === 'es' ? 'Bandera de España' : 'Bandera del Reino Unido'}
                        className="w-6 h-4 rounded"
                    />
                </button>
            </div>
            <main className="container mx-auto px-4 py-12">
                <HeroSection onGenerate={handleGenerateTimeline} isLoading={isLoading} t={t} />

                {isLoading && (
                    <div className="mt-12 text-center" role="status" aria-live="polite">
                        <Spinner size="lg" label={t.loading} />
                        <p className="mt-4 text-gray-300 italic">{loadingMessage}</p>
                        {imageProgress && (
                            <>
                                <progress value={imageProgress.current} max={imageProgress.total} className="mt-4 w-64" />
                                <p className="mt-2 text-gray-300">{t.imageProgress(imageProgress.current, imageProgress.total)}</p>
                            </>
                        )}
                    </div>
                )}

                {error && <div className="mt-12 text-center p-4 bg-red-500/20 text-red-300 rounded-lg">{error}</div>}

                {timelineData && (
                    <div className="mt-16">
                        <section
                            id="real-timeline"
                            className={activeAlternativeTimeline ? 'opacity-40 transition-opacity' : ''}
                        >
                            <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-cyan-300 flex items-center justify-center gap-3"><ClockIcon className="w-8 h-8"/> {t.realTimeline}</h2>
                            <div className="relative flex flex-col items-center gap-12">
                                <TimelineNode isLast={!activeAlternativeTimeline} />
                                {timelineData.linea_temporal_real.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        divergence={timelineData.puntos_divergencia.find(d => d.id === event.id)}
                                        onShowAlternative={handleShowAlternative}
                                        t={t}
                                        {...imageCardProps}
                                    />
                                ))}
                            </div>
                        </section>

                        {isAlternativeLoading && (
                            <div className="mt-12 text-center" role="status" aria-live="polite">
                                <Spinner size="lg" label={t.loading} />
                                <p className="mt-4 text-gray-300 italic">{loadingMessage}</p>
                                {imageProgress && (
                                    <>
                                        <progress value={imageProgress.current} max={imageProgress.total} className="mt-4 w-64" />
                                        <p className="mt-2 text-gray-300">{t.imageProgress(imageProgress.current, imageProgress.total)}</p>
                                    </>
                                )}
                            </div>
                        )}

                        {activeAlternativeTimeline && (
                            <section id="alternative-timeline" className="mt-16 animate-fade-in">
                                <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 flex items-center justify-center gap-3"><HistoryIcon className="w-8 h-8"/> {t.alternativeTimeline}</h2>
                                <div className="relative flex flex-col items-center gap-12">
                                    <TimelineNode isLast={true} />
                                    {activeAlternativeTimeline.map(event => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onShowAlternative={() => {}}
                                            isAlternative={true}
                                            t={t}
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
