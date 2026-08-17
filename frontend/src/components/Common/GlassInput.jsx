import React from 'react';

const GlassInput = ({ 
    label, name, value, onChange, type = 'text', 
    placeholder = '', required = false, className = '', 
    multiline = false, rows = 3 
}) => {
    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {multiline ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    rows={rows}
                    className={`input-premium ${className}`}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={`input-premium ${className}`}
                />
            )}
        </div>
    );
};

export default GlassInput;
