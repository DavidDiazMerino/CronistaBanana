import React from 'react';

const ImageSkeleton: React.FC = () => (
    <div className="absolute inset-0 animate-pulse bg-gray-700" aria-hidden="true" />
);

export default ImageSkeleton;
