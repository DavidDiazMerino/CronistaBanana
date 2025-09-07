import React from 'react';

/**
 * Renders the vertical connector line within the timeline.
 * @param props.isLast - Indicates whether this node is the final one.
 */
const TimelineNode: React.FC<{ isLast?: boolean }> = ({ isLast = false }) => (
    <div className="absolute left-1/2 -ml-[1px] top-12 w-0.5 h-full bg-gray-700">
        <div className="absolute left-1/2 -ml-2 top-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-cyan-400"></div>
        {isLast && <div className="absolute left-1/2 -ml-2 bottom-0 w-4 h-4 rounded-full bg-gray-700 border-2 border-cyan-400"></div>}
    </div>
);

export default TimelineNode;

