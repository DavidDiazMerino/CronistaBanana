import React, { useState } from 'react';
import Spinner from './Spinner';
import { ClockIcon, BranchIcon, HistoryIcon } from './Icons';
import type { Translation } from '../i18n';

/**
 * Renders the hero section with the character input form.
 * @param props.onGenerate - Triggered when the user submits a character name.
 * @param props.isLoading - Disables the form while data is loading.
 * @param props.t - Localized strings for UI text.
 */
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

export default HeroSection;

