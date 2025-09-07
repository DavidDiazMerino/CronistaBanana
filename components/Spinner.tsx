
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label = 'Loading...' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-24 h-24',
    };

    return (
        <div className="flex justify-center items-center" role="status" aria-live="polite" aria-label={label}>
            <div
                className={`animate-spin rounded-full border-t-2 border-b-2 border-cyan-400 ${sizeClasses[size]}`}
            ></div>
            <span className="sr-only">{label}</span>
        </div>
    );
};

export default Spinner;
