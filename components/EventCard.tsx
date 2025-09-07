import React from 'react';
import ImageCard from './ImageCard';
import { BranchIcon } from './Icons';
import type { TimelineEvent, AlternativeTimelineEvent, DivergencePoint } from '../types';
import type { Translation } from '../i18n';

export type EventCardProps = {
    event: TimelineEvent | AlternativeTimelineEvent;
    divergence?: DivergencePoint;
    onShowAlternative: (divergence: DivergencePoint) => void;
    isAlternative?: boolean;
    t: Translation;
} &
    Omit<
        React.ComponentProps<typeof ImageCard>,
        'eventId' | 'errorText' | 'alt' | 'loadingLabel'
    > &
    React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays a timeline event along with its generated image and divergence options.
 * @param props.event - The timeline event to show.
 * @param props.divergence - Divergence point metadata for alternative history.
 * @param props.onShowAlternative - Callback fired to load an alternative timeline.
 * @param props.isAlternative - Marks the card as part of the alternative timeline.
 * @param props.t - Localized strings for UI text.
 */
const EventCard: React.FC<EventCardProps> = ({
    event,
    divergence,
    onShowAlternative,
    isAlternative = false,
    t,
    className = '',
    style,
    ...imageProps
}) => {
    const title = 'titulo' in event ? event.titulo : event.titulo_eco;

    return (
        <div
            className={`relative group w-full lg:w-2/3 mx-auto p-4 transition-transform duration-700 ease-out hover:scale-[1.02] ${className}`}
            style={style}
        >
            <div className="bg-parchment/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50 p-6 transition-all duration-300 hover:border-accent/50 hover:shadow-accent/10">
                <h3 className="text-2xl font-serif font-bold text-cyan-300 mb-2">{title}</h3>
                <p className="font-sans text-sepia mb-4">{event.descripcion_corta}</p>
                <ImageCard
                    eventId={event.id}
                    alt={t.imageAlt(title)}
                    errorText={t.imageError}
                    loadingLabel={t.loading}
                    {...imageProps}
                />
                {divergence && !isAlternative && (
                    <div className="mt-6 p-4 border-t-2 border-dashed border-gray-600">
                        <h4 className="text-lg font-serif font-semibold text-yellow-300 mb-3 flex items-center"><BranchIcon className="w-5 h-5 mr-2"/> {t.divergenceTitle}</h4>
                        <p className="font-sans italic text-sepia mb-4">"{divergence.titulo_pregunta}"</p>
                        <button onClick={() => onShowAlternative(divergence)} className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-400 rounded-lg hover:bg-yellow-500/40 transition-colors">
                            {t.exploreAlternative}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCard;

