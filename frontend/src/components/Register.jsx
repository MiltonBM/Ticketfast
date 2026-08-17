import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Register = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        department: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('❌ Las contraseñas no coinciden');
            return;
        }
        
        if (formData.password.length < 6) {
            toast.error('❌ La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/users/register', {
                full_name: formData.full_name,
                email: formData.email,
                username: formData.username,
                password: formData.password,
                department: formData.department,
                phone: formData.phone
            });
            
            toast.success('✅ ' + response.data.message);
            // Limpiar formulario
            setFormData({
                full_name: '',
                email: '',
                username: '',
                password: '',
                confirmPassword: '',
                department: '',
                phone: ''
            });
            // Cambiar a login después de 3 segundos
            setTimeout(() => {
                if (onSwitchToLogin) onSwitchToLogin();
            }, 3000);
        } catch (error) {
            const msg = error.response?.data?.error || 'Error al registrar usuario';
            toast.error('❌ ' + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #1B2A4A 0%, #0D1B2A 100%)'
        }}>
            <div className="card-premium" style={{
                maxWidth: '480px',
                width: '100%',
                padding: '40px',
                animation: 'fadeInUp 0.6s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎫</div>
                    <h1 style={{ 
                        fontSize: '28px', 
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #D4A843, #F5D78C)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Ticketfast
                    </h1>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                        Crear nueva cuenta
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                            Nombre completo *
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Tu nombre completo"
                            className="input-premium"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                            Correo electrónico *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            className="input-premium"
                            required
                            disabled={loading}
                        />
                        <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                            Recibirás tus credenciales y notificaciones aquí
                        </p>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                            Usuario *
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Ej: juan.perez"
                            className="input-premium"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                            Contraseña *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Mínimo 6 caracteres"
                            className="input-premium"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                            Confirmar contraseña *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repite tu contraseña"
                            className="input-premium"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                            Departamento
                        </label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            placeholder="Ej: TI, RRHH, Finanzas"
                            className="input-premium"
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                            Teléfono
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Teléfono de contacto"
                            className="input-premium"
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-premium" 
                        style={{ width: '100%', padding: '14px' }}
                        disabled={loading}
                    >
                        {loading ? '⏳ Registrando...' : '🚀 Crear Cuenta'}
                    </button>
                </form>

                <div style={{ 
                    marginTop: '20px', 
                    paddingTop: '20px', 
                    borderTop: '1px solid #eee',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        ¿Ya tienes cuenta? 
                        <button 
                            onClick={onSwitchToLogin}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#D4A843',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginLeft: '4px'
                            }}
                        >
                            Iniciar Sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

