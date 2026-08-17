import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const TechnicianKanban = ({ user }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [progressData, setProgressData] = useState({
        progress_percentage: 0,
        status: 'in_progress',
        technician_comments: ''
    });

    useEffect(() => {
        loadTechnicianTickets();
    }, []);

    const loadTechnicianTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/tickets/technician/${user.id}`);
            setTickets(response.data);
        } catch (error) {
            toast.error('❌ Error al cargar tus tickets asignados');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProgress = async (ticketId) => {
        try {
            await api.put(`/tickets/${ticketId}/update-progress`, {
                progress_percentage: progressData.progress_percentage,
                status: progressData.status,
                technician_comments: progressData.technician_comments
            });
            toast.success('✅ Progreso actualizado');
            setShowProgressModal(false);
            setProgressData({
                progress_percentage: 0,
                status: 'in_progress',
                technician_comments: ''
            });
            loadTechnicianTickets();
        } catch (error) {
            toast.error('❌ Error al actualizar progreso');
        }
    };

    const handleCompleteTicket = async (ticketId) => {
        if (!window.confirm('¿Estás seguro de que has completado este ticket?')) return;
        
        try {
            const comment = prompt('Agrega un comentario sobre el trabajo realizado:');
            await api.put(`/tickets/${ticketId}/complete-by-technician`, {
                technician_comments: comment || 'Ticket completado'
            });
            toast.success('✅ Ticket completado exitosamente');
            loadTechnicianTickets();
        } catch (error) {
            toast.error('❌ Error al completar ticket');
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { label: '⏳ Pendiente', class: 'badge-pending' },
            assigned: { label: '📌 Asignado', class: 'badge-assigned' },
            in_progress: { label: '🔄 En Progreso', class: 'badge-progress' },
            completed: { label: '✅ Completado', class: 'badge-completed' }
        };
        const info = statusMap[status] || statusMap.pending;
        return `<span class="badge-premium ${info.class}">${info.label}</span>`;
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card-premium">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1B2A4A' }}>
                            🛠️ Mis Tickets Asignados
                        </h2>
                        <p style={{ fontSize: '14px', color: '#999' }}>
                            {tickets.length} tickets en proceso
                        </p>
                    </div>
                    <button onClick={loadTechnicianTickets} className="btn-premium btn-sm">
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            {tickets.length === 0 ? (
                <div className="card-premium" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>No tienes tickets asignados</h3>
                    <p style={{ color: '#999', marginTop: '8px' }}>Los tickets te serán asignados por el administrador</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="card-premium" style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1B2A4A' }}>
                                        #{ticket.ticket_number}
                                    </span>
                                    <span dangerouslySetInnerHTML={{ __html: getStatusBadge(ticket.status) }} />
                                    <div style={{ 
                                        width: '120px', 
                                        height: '8px', 
                                        background: '#e0e0e0', 
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ 
                                            width: `${ticket.progress_percentage || 0}%`, 
                                            height: '100%', 
                                            background: 'linear-gradient(90deg, #6C63FF, #D4A843)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        {ticket.progress_percentage || 0}%
                                    </span>
                                </div>
                                <span style={{ fontSize: '12px', color: '#999' }}>
                                    📅 {new Date(ticket.created_at).toLocaleString()}
                                </span>
                            </div>

                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#555' }}>
                                <div><strong>👤 Usuario:</strong> {ticket.user_name}</div>
                                <div><strong>🏢 Departamento:</strong> {ticket.user_department}</div>
                                <div><strong>💻 Equipo:</strong> {ticket.computer_model}</div>
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
                                {ticket.technician_comments && (
                                    <div style={{ marginTop: '4px', fontSize: '13px', color: '#6C63FF' }}>
                                        💬 <strong>Comentario:</strong> {ticket.technician_comments}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                <button 
                                    className="btn-premium btn-premium-secondary btn-sm"
                                    onClick={() => {
                                        setSelectedTicket(ticket);
                                        setProgressData({
                                            progress_percentage: ticket.progress_percentage || 0,
                                            status: ticket.status || 'in_progress',
                                            technician_comments: ticket.technician_comments || ''
                                        });
                                        setShowProgressModal(true);
                                    }}
                                >
                                    📊 Actualizar Progreso
                                </button>
                                {ticket.status !== 'completed' && (
                                    <button 
                                        className="btn-premium btn-premium-success btn-sm"
                                        onClick={() => handleCompleteTicket(ticket.id)}
                                    >
                                        ✅ Completar Ticket
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de progreso */}
            {showProgressModal && selectedTicket && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setShowProgressModal(false)}>
                    <div 
                        className="card-premium" 
                        style={{ 
                            maxWidth: '450px', 
                            width: '100%',
                            animation: 'fadeInUp 0.3s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1B2A4A', marginBottom: '16px' }}>
                            📊 Actualizar Progreso
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                            Ticket #{selectedTicket.ticket_number}
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                Progreso (%)
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progressData.progress_percentage}
                                onChange={(e) => setProgressData({
                                    ...progressData,
                                    progress_percentage: parseInt(e.target.value)
                                })}
                                style={{ width: '100%', accentColor: '#6C63FF' }}
                            />
                            <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#6C63FF' }}>
                                {progressData.progress_percentage}%
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                Estado
                            </label>
                            <select
                                value={progressData.status}
                                onChange={(e) => setProgressData({
                                    ...progressData,
                                    status: e.target.value
                                })}
                                className="input-premium"
                            >
                                <option value="assigned">Asignado</option>
                                <option value="in_progress">En Progreso</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                Comentario
                            </label>
                            <textarea
                                value={progressData.technician_comments}
                                onChange={(e) => setProgressData({
                                    ...progressData,
                                    technician_comments: e.target.value
                                })}
                                placeholder="Agrega un comentario sobre el avance..."
                                className="input-premium"
                                rows="3"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn-premium btn-premium-warning"
                                onClick={() => setShowProgressModal(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-premium"
                                onClick={() => handleUpdateProgress(selectedTicket.id)}
                            >
                                💾 Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicianKanban;
