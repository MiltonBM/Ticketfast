import React from 'react';

const Button3D = ({ 
    children, onClick, type = 'button', 
    variant = 'primary', className = '', size = 'md' 
}) => {
    const variants = {
        primary: 'btn-premium',
        secondary: 'btn-premium btn-premium-secondary',
        success: 'btn-premium btn-premium-success',
        danger: 'btn-premium btn-premium-danger',
        warning: 'btn-premium btn-premium-warning'
    };

    const sizes = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${variants[variant] || variants.primary} ${sizes[size] || ''} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button3D;
