import React from 'react';

const Card3D = ({ children, className = '' }) => {
    return (
        <div className={`card-premium ${className}`}>
            {children}
        </div>
    );
};

export default Card3D;
