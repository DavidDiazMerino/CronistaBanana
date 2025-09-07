import React from 'react';
import ImageSkeleton from './ImageSkeleton';
import Spinner from './Spinner';

/**
 * Displays an event image with loading and error fallbacks.
 * @param props.eventId - Identifier for the timeline event.
 * @param props.images - Map of generated image URLs.
 * @param props.imageLoading - Set of image IDs currently loading.
 * @param props.alt - Alternate text for the image.
 * @param props.errorText - Message shown when an image fails to load.
 * @param props.loadingLabel - Accessible label displayed during loading.
 */
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

export default ImageCard;

