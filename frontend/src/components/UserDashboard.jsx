import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const UserDashboard = ({ user, onLogout }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [formData, setFormData] = useState({
        user_name: user.full_name || user.username,
        user_department: user.department || '',
        user_phone: user.phone || '',
        user_email: user.email || '',
        computer_model: '',
        computer_serial: '',
        computer_os: '',
        failure_description: '',
        failure_classification: '',
        equipment_id: ''
    });
    const [userEquipment, setUserEquipment] = useState([]);

    useEffect(() => {
        loadUserTickets();
        loadUserEquipment();
    }, [user]);

    const loadUserTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tickets');
            const userTickets = response.data.filter(t => 
                t.user_name.toLowerCase() === (user.full_name || user.username).toLowerCase()
            );
            setTickets(userTickets);
        } catch (error) {
            toast.error('❌ Error al cargar tus tickets');
        } finally {
            setLoading(false);
        }
    };

    const loadUserEquipment = async () => {
        try {
            const response = await api.get(`/users/${user.id}/equipment`);
            const equipment = response.data || [];
            setUserEquipment(equipment);
            if (equipment.length > 0) {
                const first = equipment[0];
                setFormData(prev => ({
                    ...prev,
                    equipment_id: first.id,
                    computer_model: first.brand + ' ' + first.model,
                    computer_serial: first.serial_number || first.computer_serial
                }));
            }
        } catch (error) {
            console.error('Error loading user equipment:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'equipment_id') {
            const selected = userEquipment.find(eq => eq.id === parseInt(value));
            if (selected) {
                setFormData({
                    ...formData,
                    equipment_id: selected.id,
                    computer_model: selected.brand + ' ' + selected.model,
                    computer_serial: selected.serial_number || selected.computer_serial
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        if (!formData.failure_description || !formData.failure_classification) {
            toast.warning('⚠️ Complete todos los campos requeridos');
            return;
        }

        try {
            const ticketData = {
                user_id: user.id,
                user_name: formData.user_name,
                user_department: formData.user_department,
                user_phone: formData.user_phone,
                user_email: formData.user_email,
                computer_model: formData.computer_model,
                computer_serial: formData.computer_serial,
                computer_os: formData.computer_os,
                failure_description: formData.failure_description,
                failure_classification: formData.failure_classification,
                hardware_id: formData.equipment_id
            };

            const response = await api.post('/tickets', ticketData);
            toast.success(`✅ Ticket #${response.data.ticket_number} creado exitosamente`);
            setFormData({
                ...formData,
                computer_model: userEquipment.length > 0 ? userEquipment[0].brand + ' ' + userEquipment[0].model : '',
                computer_serial: userEquipment.length > 0 ? userEquipment[0].serial_number || userEquipment[0].computer_serial : '',
                failure_description: '',
                failure_classification: ''
            });
            setShowForm(false);
            loadUserTickets();
        } catch (error) {
            toast.error('❌ Error al crear el ticket');
            console.error(error);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (!user.email) {
            toast.error('❌ No tienes un correo electrónico registrado. Contacta al administrador.');
            return;
        }

        if (!window.confirm('¿Estás seguro de que deseas cambiar tu contraseña? Se enviará una nueva contraseña temporal a tu correo electrónico.')) {
            return;
        }
        
        try {
            setLoading(true);
            await api.post('/users/request-password-change', { userId: user.id });
            toast.success('✅ Nueva contraseña temporal enviada a tu correo electrónico');
            setShowPasswordModal(false);
        } catch (error) {
            toast.error(error.response?.data?.error || '❌ Error al solicitar cambio de contraseña');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-pending',
            assigned: 'badge-assigned',
            in_progress: 'badge-progress',
            completed: 'badge-completed',
            cancelled: 'badge-cancelled'
        };
        return `badge-premium ${badges[status] || 'badge-pending'}`;
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Pendiente',
            assigned: 'Asignado',
            in_progress: 'En Progreso',
            completed: 'Completado',
            cancelled: 'Cancelado'
        };
        return texts[status] || status;
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            assigned: '📌',
            in_progress: '🔄',
            completed: '✅',
            cancelled: '❌'
        };
        return icons[status] || '📋';
    };

    if (loading) {
        return (
            <div className="card-premium" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ color: '#666' }}>Cargando tus tickets...</h3>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div className="card-premium">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1B2A4A' }}>
                            👤 ¡Hola, {user.full_name || user.username}!
                        </h2>
                        <p style={{ fontSize: '14px', color: '#999' }}>
                            {tickets.length} tickets creados
                        </p>
                        {user.department && (
                            <p style={{ fontSize: '13px', color: '#888' }}>
                                🏢 {user.department}
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button 
                            className="btn-premium btn-premium-secondary"
                            onClick={() => setShowPasswordModal(true)}
                            disabled={loading}
                            style={{ padding: '8px 16px' }}
                        >
                            🔑 Cambiar Contraseña
                        </button>
                        <button 
                            className="btn-premium btn-premium-secondary"
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? '✖ Cerrar' : '➕ Nuevo Ticket'}
                        </button>
                        <button 
                            className="btn-premium btn-premium-danger"
                            onClick={onLogout}
                        >
                            🚪 Salir
                        </button>
                    </div>
                </div>
            </div>

            {/* Formulario de Nuevo Ticket */}
            {showForm && (
                <div className="card-premium" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1B2A4A, #0D1B2A)',
                        padding: '16px 20px',
                        borderRadius: '10px 10px 0 0',
                        margin: '-24px -24px 20px -24px',
                        color: 'white',
                        borderBottom: '4px solid #D4A843'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                            📝 Crear Nuevo Ticket
                        </h3>
                        <p style={{ fontSize: '13px', opacity: 0.8 }}>
                            {userEquipment.length > 0 ? 'Selecciona uno de tus equipos asignados' : 'Contacta al administrador para asignarte equipos'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmitTicket}>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                    👤 Nombre
                                </label>
                                <input type="text" value={formData.user_name} className="input-premium" disabled style={{ background: '#f0f0f0', cursor: 'not-allowed' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                    🏢 Departamento
                                </label>
                                <input type="text" value={formData.user_department} className="input-premium" disabled style={{ background: '#f0f0f0', cursor: 'not-allowed' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                    📧 Email
                                </label>
                                <input type="email" value={formData.user_email} className="input-premium" disabled style={{ background: '#f0f0f0', cursor: 'not-allowed' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                    📞 Teléfono
                                </label>
                                <input type="text" value={formData.user_phone} className="input-premium" disabled style={{ background: '#f0f0f0', cursor: 'not-allowed' }} />
                            </div>
                        </div>

                        <div style={{ borderTop: '2px dashed #e0e0e0', margin: '12px 0', paddingTop: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '12px' }}>
                                💻 Datos del Equipo
                            </p>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                gap: '12px'
                            }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                        Equipo
                                    </label>
                                    {userEquipment.length > 0 ? (
                                        <select
                                            name="equipment_id"
                                            value={formData.equipment_id}
                                            onChange={handleChange}
                                            className="input-premium"
                                        >
                                            {userEquipment.map(eq => (
                                                <option key={eq.id} value={eq.id}>
                                                    {eq.brand || ''} {eq.model || ''} - {eq.serial_number || eq.computer_serial || 'Sin serial'}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p style={{ fontSize: '13px', color: '#999', padding: '8px' }}>
                                            No tienes equipos asignados
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                        Modelo
                                    </label>
                                    <input type="text" name="computer_model" value={formData.computer_model} onChange={handleChange} className="input-premium" readOnly style={{ background: '#f8f9fa' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                        Serial
                                    </label>
                                    <input type="text" name="computer_serial" value={formData.computer_serial} onChange={handleChange} className="input-premium" readOnly style={{ background: '#f8f9fa' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                        Clasificación *
                                    </label>
                                    <select
                                        name="failure_classification"
                                        value={formData.failure_classification}
                                        onChange={handleChange}
                                        className="input-premium"
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Disco">💾 Disco Duro</option>
                                        <option value="Memoria">🧠 Memoria RAM</option>
                                        <option value="Software">💿 Software</option>
                                        <option value="Hardware">🔧 Hardware</option>
                                        <option value="Red">🌐 Red</option>
                                        <option value="Otro">📌 Otro</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                📝 Descripción del fallo *
                            </label>
                            <textarea
                                name="failure_description"
                                value={formData.failure_description}
                                onChange={handleChange}
                                placeholder="Describa detalladamente el problema que presenta el equipo..."
                                rows="4"
                                className="input-premium w-full"
                                required
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button 
                                type="button" 
                                className="btn-premium btn-premium-warning"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({
                                        ...formData,
                                        failure_description: '',
                                        failure_classification: ''
                                    });
                                }}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="btn-premium">
                                🚀 Enviar Ticket
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ============================================ */}
            {/* MODAL CAMBIO DE CONTRASEÑA - VERSIÓN GRANDE */}
            {/* ============================================ */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }} onClick={() => setShowPasswordModal(false)}>
                    <div 
                        style={{ 
                            maxWidth: '580px', 
                            width: '100%',
                            backgroundColor: '#ffffff',
                            borderRadius: '20px',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                            padding: '48px 48px 36px 48px',
                            position: 'relative',
                            animation: 'fadeInUp 0.3s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Título */}
                        <div style={{ 
                            borderBottom: '3px solid #D4A843',
                            paddingBottom: '20px',
                            marginBottom: '28px'
                        }}>
                            <h3 style={{ 
                                fontSize: '26px', 
                                fontWeight: '700', 
                                color: '#1B2A4A', 
                                margin: 0 
                            }}>
                                🔐 Cambiar Contraseña
                            </h3>
                            <p style={{ 
                                fontSize: '15px', 
                                color: '#888', 
                                marginTop: '8px', 
                                marginBottom: 0 
                            }}>
                                Se enviará una nueva contraseña temporal a tu correo electrónico
                            </p>
                        </div>

                        {/* Contenido */}
                        <div>
                            {/* Email */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '15px', 
                                    fontWeight: '600', 
                                    color: '#1B2A4A', 
                                    marginBottom: '8px' 
                                }}>
                                    📧 Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    value={user.email || ''}
                                    disabled
                                    style={{ 
                                        width: '100%',
                                        padding: '14px 18px',
                                        background: '#f5f5f5',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        color: '#333',
                                        cursor: 'not-allowed',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <p style={{ 
                                    fontSize: '13px', 
                                    color: '#999', 
                                    marginTop: '8px', 
                                    marginBottom: 0 
                                }}>
                                    La nueva contraseña será enviada a este correo
                                </p>
                            </div>

                            {/* Nota */}
                            <div style={{ 
                                background: '#fff8e1', 
                                padding: '16px 20px', 
                                borderRadius: '10px',
                                border: '1px solid #ffd54f',
                                marginBottom: '28px'
                            }}>
                                <p style={{ 
                                    fontSize: '15px', 
                                    color: '#856404', 
                                    margin: 0, 
                                    lineHeight: '1.6' 
                                }}>
                                    💡 <strong>Nota:</strong> Recibirás una nueva contraseña temporal por correo electrónico. 
                                    Podrás cambiarla después de iniciar sesión.
                                </p>
                            </div>

                            {/* Botones */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '14px', 
                                justifyContent: 'flex-end',
                                paddingTop: '20px',
                                borderTop: '1px solid #e8e8e8'
                            }}>
                                <button 
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    style={{ 
                                        padding: '12px 32px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        borderRadius: '10px',
                                        border: '1px solid #d0d0d0',
                                        cursor: 'pointer',
                                        background: '#ffffff',
                                        color: '#555555',
                                        transition: 'all 0.2s ease',
                                        minWidth: '120px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#f5f5f5'
                                        e.currentTarget.style.borderColor = '#bbb'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#ffffff'
                                        e.currentTarget.style.borderColor = '#d0d0d0'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleChangePassword}
                                    disabled={loading}
                                    style={{ 
                                        padding: '12px 32px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        background: loading ? '#999999' : 'linear-gradient(135deg, #1B2A4A, #0D1B2A)',
                                        color: '#ffffff',
                                        transition: 'all 0.2s ease',
                                        minWidth: '200px',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading) {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #2C3E6A, #1B2A4A)'
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(27,42,74,0.3)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!loading) {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #1B2A4A, #0D1B2A)'
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = 'none'
                                        }
                                    }}
                                >
                                    {loading ? '⏳ Enviando...' : '📧 Enviar Contraseña'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de tickets */}
            <div className="card-premium">
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1B2A4A', marginBottom: '16px' }}>
                    📋 Mis Tickets
                </h3>
                
                {tickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                        <p style={{ color: '#999' }}>No tienes tickets creados</p>
                        <button 
                            className="btn-premium" 
                            style={{ marginTop: '12px' }}
                            onClick={() => setShowForm(true)}
                        >
                            ➕ Crear tu primer ticket
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                style={{
                                    padding: '16px 20px',
                                    background: 'white',
                                    borderRadius: '10px',
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1B2A4A' }}>
                                            #{ticket.ticket_number}
                                        </span>
                                        <span className={getStatusBadge(ticket.status)}>
                                            {getStatusIcon(ticket.status)} {getStatusText(ticket.status)}
                                        </span>
                                        {ticket.failure_classification && (
                                            <span className={`badge-premium ${ticket.failure_classification === 'Preventivo' ? 'badge-preventive' : 'badge-corrective'}`}>
                                                {ticket.failure_classification}
                                            </span>
                                        )}
                                        {ticket.technician_name && (
                                            <span className="badge-premium" style={{ background: '#6C63FF', color: 'white' }}>
                                                👨‍🔧 {ticket.technician_name}
                                            </span>
                                        )}
                                        {ticket.progress_percentage > 0 && (
                                            <span className="badge-premium" style={{ background: '#D4A843', color: '#1B2A4A' }}>
                                                {ticket.progress_percentage}%
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#999' }}>
                                        📅 {new Date(ticket.created_at).toLocaleString()}
                                    </span>
                                </div>
                                
                                <div style={{ marginTop: '8px', fontSize: '14px', color: '#555' }}>
                                    <div><strong>💻 Equipo:</strong> {ticket.computer_model}</div>
                                    <div><strong>🏢 Departamento:</strong> {ticket.user_department}</div>
                                    {ticket.technician_name && (
                                        <div style={{ marginTop: '4px', fontSize: '13px', color: '#6C63FF' }}>
                                            👨‍🔧 <strong>Técnico asignado:</strong> {ticket.technician_name}
                                        </div>
                                    )}
                                    <div style={{ 
                                        marginTop: '6px',
                                        padding: '8px 12px',
                                        background: '#f8f9fa',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        color: '#666'
                                    }}>
                                        <strong>📝 Descripción:</strong> {ticket.failure_description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
