import { generateOrEditImage } from '../services/geminiService';
import type { Dispatch } from 'react';
import type { TimelineEvent, AlternativeTimelineEvent } from '../types';

/**
 * Sequentially loads images for a set of timeline events.
 * Dispatches loading states and progress updates for each event.
 *
 * @param events - Events containing an identifier and a prompt for image generation.
 * @param dispatch - Reducer dispatch used to update loading state and progress.
 * @param initialImage - Optional base64 image to start image editing from.
 * @returns Promise that resolves when all event images have been processed.
 */
export async function loadEventImages(
    events: Array<Pick<TimelineEvent | AlternativeTimelineEvent, 'id' | 'prompt_imagen_consistente'>>,
    dispatch: Dispatch<any>,
    initialImage?: string
): Promise<void> {
    dispatch({ type: 'SET', payload: { imageProgress: { current: 0, total: events.length } } });

    let prevImage = initialImage;
    let completed = 0;
    for (const event of events) {
        dispatch({ type: 'ADD_IMAGE_LOADING', id: event.id });
        try {
            const newImage = await generateOrEditImage(event.prompt_imagen_consistente, prevImage);
            dispatch({ type: 'SET_IMAGE', id: event.id, url: newImage });
            prevImage = newImage;
        } catch (err) {
            console.error(`Failed to generate image for event ID ${event.id}:`, err);
        } finally {
            dispatch({ type: 'REMOVE_IMAGE_LOADING', id: event.id });
            completed++;
            dispatch({ type: 'SET', payload: { imageProgress: { current: completed, total: events.length } } });
        }
    }

    dispatch({ type: 'SET', payload: { imageProgress: null } });
}
