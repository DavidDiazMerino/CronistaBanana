import React, { useState, useCallback, useEffect, useReducer } from 'react';
import type { FullTimelineData, AlternativeTimelineEvent, DivergencePoint, Language } from './types';
import { generateTimelineData, generateAlternativeTimeline } from './services/geminiService';
import { loadEventImages } from './utils/imageLoader';
import { translations } from './i18n';
import Spinner from './components/Spinner';
import { ClockIcon, HistoryIcon } from './components/Icons';
import esFlag from './assets/es.svg';
import gbFlag from './assets/gb.svg';
import HeroSection from './components/HeroSection';
import EventCard from './components/EventCard';
import TimelineNode from './components/TimelineNode';

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

    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        const active = isLoading ? 'real' : isAlternativeLoading ? 'alternative' : null;
        if (!active) {
            setLoadingMessage('');
            return;
        }
        let index = 0;
        const messages = t.waitingMessages[active];
        setLoadingMessage(messages[0]);
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setLoadingMessage(messages[index]);
        }, 3000);
        return () => clearInterval(interval);
    }, [isLoading, isAlternativeLoading, t]);

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
            dispatch({ type: 'SET', payload: { timelineData: data } });

            await loadEventImages(data.linea_temporal_real, dispatch);
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
            dispatch({ type: 'SET', payload: { activeAlternativeTimeline: newAlternativeEvents } });

            await loadEventImages(newAlternativeEvents, dispatch, images[baseEvent.id]);
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
                                {timelineData.linea_temporal_real.map((event, index) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        divergence={timelineData.puntos_divergencia.find(d => d.id === event.id)}
                                        onShowAlternative={handleShowAlternative}
                                        t={t}
                                        className="animate-slide-up"
                                        style={{ animationDelay: `${index * 150}ms` }}
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
                                    {activeAlternativeTimeline.map((event, index) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onShowAlternative={() => {}}
                                            isAlternative={true}
                                            t={t}
                                            className="animate-slide-up"
                                            style={{ animationDelay: `${index * 150}ms` }}
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
