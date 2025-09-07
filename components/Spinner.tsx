
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-24 h-24',
    };

    return (
        <div className="flex justify-center items-center">
            <div
                className={`animate-spin rounded-full border-t-2 border-b-2 border-cyan-400 ${sizeClasses[size]}`}
            ></div>
        </div>
    );
};

export default Spinner;
