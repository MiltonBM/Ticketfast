import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (!username.trim() || !password.trim()) {
            setErrorMessage('⚠️ Complete todos los campos');
            toast.warning('⚠️ Complete todos los campos');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/users/login', { username, password });
            const userData = response.data;
            
            const fullUserResponse = await api.get(`/users/${userData.id}`);
            const fullUser = fullUserResponse.data;
            
            toast.success(`✅ Bienvenido ${fullUser.full_name}`);
            onLogin({
                id: fullUser.id,
                username: fullUser.username,
                full_name: fullUser.full_name,
                email: fullUser.email,
                department: fullUser.department,
                phone: fullUser.phone,
                role: fullUser.role,
                is_active: fullUser.is_active,
                can_report_lab_tickets: fullUser.can_report_lab_tickets || 0
            });
        } catch (error) {
            if (error.response?.status === 401) {
                setErrorMessage('❌ Credenciales incorrectas. Verifica tu usuario y contraseña.');
                toast.error('❌ Credenciales incorrectas');
            } else if (error.response?.status === 404) {
                setErrorMessage('❌ Usuario no encontrado. Verifica tus datos.');
                toast.error('❌ Usuario no encontrado');
            } else {
                setErrorMessage('❌ Error al conectar con el servidor.');
                toast.error('❌ Error al conectar con el servidor');
            }
            console.error('Login error:', error);
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
                maxWidth: '420px',
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
                        Sistema de Gestión de Tickets
                    </p>
                    <p style={{ color: '#999', fontSize: '12px', marginTop: '2px' }}>
                        © 2026 Ticketfast v3.0
                    </p>
                </div>

                {errorMessage && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        backgroundColor: errorMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                        color: errorMessage.includes('✅') ? '#155724' : '#721c24',
                        border: errorMessage.includes('✅') ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2A4A', marginBottom: '6px' }}>
                            👤 Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setErrorMessage('');
                            }}
                            placeholder="Ingresa tu usuario"
                            className="input-premium"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2A4A', marginBottom: '6px' }}>
                            🔒 Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrorMessage('');
                            }}
                            placeholder="Ingresa tu contraseña"
                            className="input-premium"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-premium" 
                        style={{ width: '100%', padding: '14px' }}
                        disabled={loading}
                    >
                        {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
                    </button>
                </form>

                <div style={{ 
                    marginTop: '24px', 
                    paddingTop: '20px', 
                    borderTop: '1px solid #eee',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '11px', color: '#ccc' }}>
                        © 2026 Ticketfast v3.0 - Todos los derechos reservados
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
