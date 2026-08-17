import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const KanbanBoard = ({ onStatsUpdate, userRole }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedTicket, setDraggedTicket] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showArchived, setShowArchived] = useState(true); // Mostrar archivados por defecto

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        loadTickets();
    }, [showArchived]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tickets');
            let data = response.data || [];
            
            // Si no se muestran archivados, filtrarlos
            if (!showArchived) {
                data = data.filter(t => t.status !== 'archived');
            }
            
            setTickets(data);
            if (onStatsUpdate) onStatsUpdate();
        } catch (error) {
            console.error('Error cargando tickets:', error);
            toast.error('❌ Error al cargar los tickets');
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Función principal: Al mover a "Completado" se archiva automáticamente
    const updateTicketStatus = async (ticketId, newStatus) => {
        try {
            const ticket = tickets.find(t => t.id === ticketId);
            if (!ticket) return;

            // Si el nuevo estado es 'completed', archivar automáticamente
            if (newStatus === 'completed') {
                // 1. Actualizar a completado
                await api.put(`/tickets/${ticketId}`, { 
                    ...ticket, 
                    status: 'completed' 
                });
                toast.success('✅ Ticket completado');
                
                // 2. Archivar automáticamente
                await api.put(`/tickets/${ticketId}`, { 
                    status: 'archived',
                    previous_status: 'completed'
                });
                toast.info('📦 Ticket archivado automáticamente');
                
                // 3. Recargar la lista
                await loadTickets();
                if (onStatsUpdate) onStatsUpdate();
                return;
            }
            
            // Para otros estados, actualizar normal
            await api.put(`/tickets/${ticketId}`, { ...ticket, status: newStatus });
            
            setTickets(prev => 
                prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t)
            );
            
            toast.success(`✅ Ticket movido a ${getStatusText(newStatus)}`);
            if (onStatsUpdate) onStatsUpdate();
        } catch (error) {
            console.error('Error actualizando ticket:', error);
            toast.error('❌ Error al actualizar el ticket: ' + (error.response?.data?.error || error.message));
        }
    };

    // Archivar manualmente (para tickets que no están completados)
    const handleArchive = async (id) => {
        if (!window.confirm('¿Está seguro de archivar este ticket?')) {
            return;
        }
        
        try {
            const ticket = tickets.find(t => t.id === id);
            if (!ticket) {
                toast.error('❌ Ticket no encontrado');
                return;
            }

            const previousStatus = ticket.status;
            
            await api.put(`/tickets/${id}`, { 
                status: 'archived',
                previous_status: previousStatus
            });
            
            toast.success(`✅ Ticket archivado (estado anterior: ${getStatusText(previousStatus)})`);
            await loadTickets();
        } catch (error) {
            console.error('Error al archivar:', error);
            toast.error('❌ Error al archivar el ticket');
        }
    };

    // Eliminar permanentemente - SOLO ADMIN
    const handleDelete = async (id) => {
        if (!isAdmin) {
            toast.error('❌ No tienes permisos para eliminar tickets permanentemente');
            return;
        }
        
        if (!window.confirm('⚠️ ¿Está seguro de eliminar permanentemente este ticket?')) {
            return;
        }
        
        try {
            await api.delete(`/tickets/${id}`);
            toast.success('✅ Ticket eliminado permanentemente');
            await loadTickets();
        } catch (error) {
            console.error('Error eliminando ticket:', error);
            toast.error('❌ Error al eliminar el ticket');
        }
    };

    // Restaurar ticket archivado
    const handleRestore = async (id) => {
        try {
            const ticket = tickets.find(t => t.id === id);
            if (!ticket) {
                toast.error('❌ Ticket no encontrado');
                return;
            }

            const previousStatus = ticket.previous_status || 'pending';
            await api.put(`/tickets/${id}`, { 
                status: previousStatus
            });
            
            toast.success(`✅ Ticket restaurado (estado: ${getStatusText(previousStatus)})`);
            await loadTickets();
        } catch (error) {
            console.error('Error restaurando ticket:', error);
            toast.error('❌ Error al restaurar el ticket');
        }
    };

    const handleDragStart = (e, ticket) => {
        setDraggedTicket(ticket);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ticket.id.toString());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        if (!draggedTicket) return;

        const ticketId = parseInt(e.dataTransfer.getData('text/plain'));
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket && ticket.status !== newStatus) {
            updateTicketStatus(ticketId, newStatus);
        }
        
        setDraggedTicket(null);
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Pendiente',
            assigned: 'Asignado',
            in_progress: 'En Progreso',
            completed: 'Completado',
            archived: '📦 Archivado'
        };
        return texts[status] || status;
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            assigned: '📌',
            in_progress: '🔄',
            completed: '✅',
            archived: '📦'
        };
        return icons[status] || '📋';
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#F57C00',
            assigned: '#1B2A4A',
            in_progress: '#D4A843',
            completed: '#2E7D32',
            archived: '#757575'
        };
        return colors[status] || '#666';
    };

    const getTicketsByStatus = (status) => {
        let filtered = tickets.filter(t => t.status === status);
        
        if (status === 'archived' && !showArchived) {
            return [];
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t => 
                t.user_name?.toLowerCase().includes(term) ||
                t.ticket_number?.toLowerCase().includes(term) ||
                t.computer_model?.toLowerCase().includes(term) ||
                t.user_department?.toLowerCase().includes(term)
            );
        }
        
        if (filterType !== 'all') {
            filtered = filtered.filter(t => 
                t.failure_classification?.toLowerCase() === filterType.toLowerCase()
            );
        }
        
        return filtered;
    };

    const columns = [
        { id: 'pending', title: '⏳ Pendiente' },
        { id: 'assigned', title: '📌 Asignado' },
        { id: 'in_progress', title: '🔄 En Progreso' },
        { id: 'completed', title: '✅ Completado' }
    ];

    if (loading) {
        return (
            <div className="card-premium" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ color: '#666' }}>Cargando tickets...</h3>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div className="card-premium" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1B2A4A', margin: 0 }}>
                            📊 Tablero Kanban
                        </h2>
                        <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 0 0' }}>
                            {tickets.filter(t => t.status !== 'archived').length} tickets activos
                        </p>
                        <p style={{ fontSize: '12px', color: '#6C63FF', margin: '2px 0 0 0' }}>
                            ✅ Los tickets completados se archivan automáticamente
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button 
                            onClick={() => setShowArchived(!showArchived)} 
                            className={`btn-premium ${showArchived ? 'btn-premium-secondary' : ''} btn-sm`}
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                            📦 {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
                        </button>
                        <button onClick={loadTickets} className="btn-premium btn-sm" style={{ padding: '6px 14px', fontSize: '12px' }}>
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar ticket, usuario o equipo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-premium"
                        style={{ flex: '1', minWidth: '180px', padding: '8px 14px', fontSize: '13px' }}
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="input-premium"
                        style={{ width: 'auto', minWidth: '130px', padding: '8px 14px', fontSize: '13px' }}
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="disco">Disco Duro</option>
                        <option value="memoria">Memoria RAM</option>
                        <option value="software">Software</option>
                        <option value="hardware">Hardware</option>
                        <option value="red">Red</option>
                        <option value="preventivo">Preventivo</option>
                        <option value="correctivo">Correctivo</option>
                    </select>
                </div>
            </div>

            {/* Kanban Board */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px',
                alignItems: 'start'
            }}>
                {columns.map(column => {
                    const columnTickets = getTicketsByStatus(column.id);
                    return (
                        <div
                            key={column.id}
                            className="card-premium"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                            style={{
                                minHeight: '250px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.95)',
                                borderTop: `4px solid ${getStatusColor(column.id)}`,
                                borderRadius: '12px'
                            }}
                        >
                            {/* Header de columna */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                                paddingBottom: '10px',
                                borderBottom: '1px solid #eee'
                            }}>
                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#1B2A4A' }}>
                                    {column.title}
                                </span>
                                <span style={{
                                    background: getStatusColor(column.id),
                                    color: 'white',
                                    padding: '1px 10px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                }}>
                                    {columnTickets.length}
                                </span>
                            </div>

                            {/* Tickets */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {columnTickets.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '30px 10px',
                                        color: '#bbb',
                                        fontSize: '13px',
                                        border: '2px dashed #e0e0e0',
                                        borderRadius: '8px'
                                    }}>
                                        📭 Sin tickets
                                    </div>
                                ) : (
                                    columnTickets.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, ticket)}
                                            style={{
                                                background: 'white',
                                                padding: '12px 14px',
                                                borderRadius: '8px',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                                cursor: 'grab',
                                                transition: 'all 0.2s ease',
                                                border: '1px solid #f0f0f0'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                                            }}
                                        >
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1B2A4A' }}>
                                                    #{ticket.ticket_number}
                                                </span>
                                                {ticket.failure_classification && (
                                                    <span className={`badge-premium ${ticket.failure_classification === 'Preventivo' ? 'badge-preventive' : 'badge-corrective'}`} style={{ fontSize: '9px', padding: '2px 8px' }}>
                                                        {ticket.failure_classification}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Información */}
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '2px' }}>
                                                {ticket.user_name}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                                💻 {ticket.computer_model}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#888' }}>
                                                🏢 {ticket.user_department}
                                            </div>

                                            {/* Descripción */}
                                            {ticket.failure_description && (
                                                <div style={{
                                                    marginTop: '6px',
                                                    padding: '4px 8px',
                                                    background: '#f8f9fa',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    color: '#666',
                                                    maxHeight: '32px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {ticket.failure_description.slice(0, 50)}...
                                                </div>
                                            )}

                                            {/* Acciones */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: '8px',
                                                paddingTop: '6px',
                                                borderTop: '1px solid #f0f0f0'
                                            }}>
                                                <span style={{ fontSize: '10px', color: '#bbb' }}>
                                                    📅 {new Date(ticket.created_at).toLocaleDateString()}
                                                </span>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {/* Botón Archivar - solo si no está completado */}
                                                    {ticket.status !== 'completed' && ticket.status !== 'archived' && (
                                                        <button
                                                            onClick={() => handleArchive(ticket.id)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#1976D2',
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                padding: '2px 4px',
                                                                borderRadius: '4px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            title="Archivar ticket"
                                                        >
                                                            📦
                                                        </button>
                                                    )}
                                                    {ticket.status === 'completed' && (
                                                        <span style={{ fontSize: '10px', color: '#2E7D32' }}>
                                                            ✅ Archivado automático
                                                        </span>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(ticket.id)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#C62828',
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                padding: '2px 4px',
                                                                borderRadius: '4px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#ffebee'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            title="Eliminar permanentemente"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tickets Archivados */}
            {showArchived && (
                <div className="card-premium" style={{
                    border: '2px dashed #757575',
                    background: '#f5f5f5',
                    padding: '16px'
                }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#757575', margin: '0 0 12px 0' }}>
                        📦 Tickets Archivados
                    </h3>
                    {getTicketsByStatus('archived').length === 0 ? (
                        <p style={{ color: '#999', textAlign: 'center', padding: '20px', margin: 0 }}>
                            No hay tickets archivados
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {getTicketsByStatus('archived').map(ticket => (
                                <div key={ticket.id} style={{
                                    padding: '10px 14px',
                                    background: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '6px'
                                }}>
                                    <div style={{ fontSize: '13px' }}>
                                        <span style={{ fontWeight: '600', color: '#1B2A4A' }}>
                                            #{ticket.ticket_number}
                                        </span>
                                        <span style={{ marginLeft: '10px', color: '#666' }}>
                                            {ticket.user_name}
                                        </span>
                                        <span style={{ marginLeft: '10px', fontSize: '11px', color: '#999' }}>
                                            📅 {new Date(ticket.created_at).toLocaleDateString()}
                                        </span>
                                        <span style={{ marginLeft: '10px', fontSize: '11px', color: '#6C63FF' }}>
                                            (previo: {getStatusText(ticket.previous_status || 'pending')})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => handleRestore(ticket.id)}
                                            className="btn-premium btn-premium-secondary btn-sm"
                                            style={{ padding: '4px 10px', fontSize: '11px' }}
                                        >
                                            ↩️ Restaurar
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(ticket.id)}
                                                className="btn-premium btn-premium-danger btn-sm"
                                                style={{ padding: '4px 10px', fontSize: '11px' }}
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Instrucciones */}
            <div className="card-premium" style={{ 
                textAlign: 'center', 
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.9)',
                fontSize: '12px',
                color: '#888'
            }}>
                💡 Arrastra y suelta los tickets entre columnas para actualizar su estado
                {' | '}
                ✅ Los tickets se archivan automáticamente al completarlos
                {' | '}
                🗑️ Solo administradores pueden eliminar permanentemente
            </div>
        </div>
    );
};

export default KanbanBoard;
