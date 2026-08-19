import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BoletaPrint from './BoletaPrint';

const TicketList = ({ onStatsUpdate, userRole }) => {
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [showBoletaTicket, setShowBoletaTicket] = useState(null);

    const COLORS = ['#FFC107', '#6C63FF', '#FF6584', '#2ECC71', '#E74C3C'];
    
    // Verificar si el usuario es administrador
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        loadTickets();
        loadTechnicians();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tickets');
            setTickets(response.data);
            if (onStatsUpdate) onStatsUpdate();
        } catch (error) {
            toast.error('❌ Error al cargar las boletas');
        } finally {
            setLoading(false);
        }
    };

    const loadTechnicians = async () => {
        try {
            console.log('🔄 Cargando técnicos desde usuarios con rol tecnico...');
            const response = await api.get('/users');
            const allUsers = response.data || [];
            const techUsers = allUsers.filter(user => user.role === 'tecnico' && user.is_active === 1);
            
            console.log('📥 Técnicos encontrados:', techUsers);
            
            if (techUsers.length > 0) {
                const formatted = techUsers.map(user => ({
                    id: user.id,
                    name: user.full_name || user.username,
                    specialty: user.department || 'General',
                    user_id: user.id
                }));
                setTechnicians(formatted);
                console.log('✅ Técnicos cargados:', formatted);
            } else {
                console.log('⚠️ No hay técnicos disponibles');
                setTechnicians([]);
            }
        } catch (error) {
            console.error('❌ Error cargando técnicos:', error);
            setTechnicians([]);
            toast.error('❌ Error al cargar técnicos');
        }
    };

    const handleAssignTechnician = async (ticketId) => {
        if (!selectedTechnician) {
            toast.warning('⚠️ Seleccione un técnico');
            return;
        }
        try {
            await api.put(`/tickets/${ticketId}/assign-technician`, { 
                technician_name: selectedTechnician
            });
            toast.success(`✅ Técnico ${selectedTechnician} asignado correctamente`);
            setShowAssignModal(false);
            setSelectedTechnician('');
            loadTickets();
        } catch (error) {
            toast.error('❌ Error al asignar técnico');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        // 🔒 SOLO ADMINISTRADORES PUEDEN ELIMINAR
        if (!isAdmin) {
            toast.error('❌ No tienes permisos para eliminar tickets. Solo los administradores pueden eliminar.');
            console.warn('⚠️ Intento de eliminar ticket por usuario no autorizado');
            return;
        }
        
        if (window.confirm('¿Está seguro de eliminar este ticket? Esta acción no se puede deshacer.')) {
            try {
                await api.delete(`/tickets/${id}`);
                toast.success('✅ Ticket eliminado');
                loadTickets();
            } catch (error) {
                toast.error('❌ Error al eliminar el ticket');
            }
        }
    };

    const handleExport = () => {
        if (tickets.length === 0) {
            toast.warning('No hay tickets para exportar');
            return;
        }
        const headers = 'Ticket,Usuario,Departamento,Equipo,Clasificacion,Estado,Tecnico,Fecha';
        const rows = tickets.map(t => {
            const statusMap = { pending: 'Pendiente', assigned: 'Asignado', in_progress: 'En Progreso', completed: 'Completado', cancelled: 'Cancelado' };
            return `${t.ticket_number},${t.user_name},${t.user_department},${t.computer_model},${t.failure_classification || 'N/A'},${statusMap[t.status] || t.status},${t.technician_name || 'Sin asignar'},${new Date(t.created_at).toLocaleString()}`;
        });
        const csv = headers + '\n' + rows.join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boletas_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('📥 Boletas exportadas');
    };

    const handlePrint = () => {
        window.print();
    };

    // ============================================
    // IMPORTAR TICKET desde el bloque de texto generado por
    // TicketForm > "Generar por correo" (captura sin conexión)
    // ============================================
    const handleImportTicket = async () => {
        if (!importText.trim()) {
            toast.error('❌ Pegue el contenido del correo antes de importar');
            return;
        }
        try {
            const response = await api.post('/tickets/import', { rawText: importText });
            toast.success(`✅ Ticket #${response.data.ticket_number} importado correctamente`);
            setImportText('');
            setShowImportModal(false);
            loadTickets();
        } catch (error) {
            toast.error(error.response?.data?.error || '❌ No se pudo importar el ticket. Verifique que copió el correo completo.');
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { label: 'Pendiente', class: 'badge-pending' },
            assigned: { label: 'Asignado', class: 'badge-assigned' },
            in_progress: { label: 'En Progreso', class: 'badge-progress' },
            completed: { label: 'Completado', class: 'badge-completed' },
            cancelled: { label: 'Cancelado', class: 'badge-cancelled' }
        };
        const info = statusMap[status] || statusMap.pending;
        return `<span class="badge-premium ${info.class}">${info.label}</span>`;
    };

    const getChartData = () => {
        const statusCounts = {
            Pendiente: 0,
            Asignado: 0,
            'En Progreso': 0,
            Completado: 0,
            Cancelado: 0
        };
        tickets.forEach(t => {
            const statusMap = { pending: 'Pendiente', assigned: 'Asignado', in_progress: 'En Progreso', completed: 'Completado', cancelled: 'Cancelado' };
            const label = statusMap[t.status] || 'Pendiente';
            statusCounts[label] = (statusCounts[label] || 0) + 1;
        });
        return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    };

    const getPieData = () => {
        const data = getChartData();
        return data.filter(d => d.value > 0);
    };

    const filteredTickets = tickets.filter(ticket => {
        const search = searchTerm.toLowerCase().trim();
        if (!search) return filterStatus === 'all' || ticket.status === filterStatus;
        const matchesSearch = 
            ticket.user_name.toLowerCase().includes(search) ||
            ticket.ticket_number.toLowerCase().includes(search) ||
            ticket.computer_model.toLowerCase().includes(search) ||
            ticket.user_department.toLowerCase().includes(search);
        const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="card-premium" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ color: '#666' }}>Cargando boletas...</h3>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Estadísticas y Gráficas */}
            <div className="card-premium">
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1B2A4A', marginBottom: '16px' }}>
                    📊 Estadísticas de Atención
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#1B2A4A' }}>{tickets.length}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Total Tickets</div>
                    </div>
                    <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#F57C00' }}>{tickets.filter(t => t.status === 'pending').length}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Pendientes</div>
                    </div>
                    <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#1976D2' }}>{tickets.filter(t => t.status === 'in_progress').length}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>En Progreso</div>
                    </div>
                    <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#2E7D32' }}>{tickets.filter(t => t.status === 'completed').length}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Completados</div>
                    </div>
                </div>

                {/* Gráficas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div style={{ height: '250px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '10px', textAlign: 'center' }}>
                            Estado de Tickets
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getChartData()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#6C63FF">
                                    {getChartData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ height: '250px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '10px', textAlign: 'center' }}>
                            Distribución
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={getPieData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {getPieData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lista de tickets */}
            <div className="card-premium">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1B2A4A' }}>
                            📋 Historial de Tickets
                        </h3>
                        <p style={{ fontSize: '13px', color: '#999' }}>{filteredTickets.length} tickets encontrados</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={handleExport} className="btn-premium btn-premium-secondary btn-sm">📥 Exportar</button>
                        <button onClick={handlePrint} className="btn-premium btn-premium-success btn-sm">🖨️ Imprimir</button>
                        {isAdmin && (
                            <button onClick={() => setShowImportModal(true)} className="btn-premium btn-premium-secondary btn-sm">📧 Importar Ticket</button>
                        )}
                        <button onClick={loadTickets} className="btn-premium btn-sm">🔄 Actualizar</button>
                    </div>
                </div>

                {/* Filtros */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar ticket, usuario o equipo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-premium"
                        style={{ flex: '1', minWidth: '200px' }}
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-premium"
                        style={{ width: 'auto', minWidth: '150px' }}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="assigned">Asignado</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>

                {/* Lista */}
                {filteredTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                        <p style={{ color: '#999' }}>No hay tickets registrados</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredTickets.map((ticket) => (
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
                                        <span dangerouslySetInnerHTML={{ __html: getStatusBadge(ticket.status) }} />
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
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#999' }}>
                                        📅 {new Date(ticket.created_at).toLocaleString()}
                                    </span>
                                </div>
                                
                                <div style={{ marginTop: '8px', fontSize: '14px', color: '#555' }}>
                                    <div><strong>👤 Usuario:</strong> {ticket.user_name}</div>
                                    <div><strong>🏢 Departamento:</strong> {ticket.user_department} {ticket.user_department_id ? `(${ticket.user_department_id})` : ''}</div>
                                    <div><strong>💻 Equipo:</strong> {ticket.computer_model}</div>
                                    {ticket.user_phone && <div><strong>📞 Teléfono:</strong> {ticket.user_phone}</div>}
                                    {ticket.user_email && <div><strong>📧 Email:</strong> {ticket.user_email}</div>}
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
                                    {ticket.technician_name && (
                                        <div style={{ marginTop: '4px', fontSize: '13px', color: '#6C63FF' }}>
                                            👨‍🔧 <strong>Técnico asignado:</strong> {ticket.technician_name}
                                        </div>
                                    )}
                                </div>

                                {/* Acciones - SOLO ADMIN PUEDE ELIMINAR */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    <button 
                                        className="btn-premium btn-premium-secondary btn-sm"
                                        onClick={() => {
                                            setSelectedTicket(ticket);
                                            setShowAssignModal(true);
                                            setSelectedTechnician(ticket.technician_name || '');
                                        }}
                                    >
                                        👨‍🔧 Asignar Técnico
                                    </button>
                                    <button className="btn-premium btn-sm">✏️ Editar</button>
                                    {ticket.boleta_completed === 1 && (
                                        <button
                                            className="btn-premium btn-premium-success btn-sm"
                                            onClick={() => setShowBoletaTicket(ticket)}
                                        >
                                            📄 Ver Boleta
                                        </button>
                                    )}
                                    {isAdmin ? (
                                        <button 
                                            onClick={() => handleDelete(ticket.id)} 
                                            className="btn-premium btn-premium-danger btn-sm"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    ) : (
                                        <span style={{ 
                                            fontSize: '11px', 
                                            color: '#999', 
                                            padding: '6px 12px',
                                            background: '#f5f5f5',
                                            borderRadius: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center'
                                        }}>
                                            🔒 Solo administradores
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Asignar Técnico */}
            {showAssignModal && selectedTicket && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setShowAssignModal(false)}>
                    <div 
                        className="card-premium" 
                        style={{ 
                            maxWidth: '450px', 
                            width: '100%',
                            animation: 'fadeInUp 0.3s ease-out',
                            padding: '32px',
                            backgroundColor: 'white',
                            borderRadius: '16px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1B2A4A', marginBottom: '8px' }}>
                            👨‍🔧 Asignar Técnico
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                            Ticket #{selectedTicket.ticket_number} - {selectedTicket.user_name}
                        </p>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '6px' }}>
                                Seleccionar Técnico
                            </label>
                            {technicians.length === 0 ? (
                                <div style={{ 
                                    padding: '12px', 
                                    background: '#fff3cd', 
                                    borderRadius: '8px',
                                    border: '1px solid #ffc107',
                                    color: '#856404'
                                }}>
                                    ⚠️ No hay técnicos disponibles. Ve a Usuarios y crea un usuario con rol "Técnico".
                                </div>
                            ) : (
                                <select
                                    value={selectedTechnician}
                                    onChange={(e) => setSelectedTechnician(e.target.value)}
                                    className="input-premium"
                                    style={{ 
                                        padding: '10px 14px',
                                        width: '100%',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    <option value="">Seleccionar técnico...</option>
                                    {technicians.map(tech => (
                                        <option key={tech.id} value={tech.name}>
                                            {tech.name} {tech.specialty ? `- ${tech.specialty}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {selectedTechnician && (
                                <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '6px' }}>
                                    ✅ Técnico seleccionado: {selectedTechnician}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                            <button 
                                className="btn-premium btn-premium-warning"
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedTechnician('');
                                }}
                                style={{ padding: '10px 24px' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-premium"
                                onClick={() => handleAssignTechnician(selectedTicket.id)}
                                disabled={!selectedTechnician || technicians.length === 0}
                                style={{ 
                                    padding: '10px 24px',
                                    opacity: (!selectedTechnician || technicians.length === 0) ? 0.6 : 1,
                                    cursor: (!selectedTechnician || technicians.length === 0) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                💾 Asignar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Importar Ticket (captura sin conexión) */}
            {showImportModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px'
                }} onClick={() => setShowImportModal(false)}>
                    <div
                        className="card-premium"
                        style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '32px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1B2A4A', marginBottom: '12px', borderBottom: '3px solid #D4A843', paddingBottom: '12px' }}>
                            📧 Importar Ticket desde correo
                        </h3>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                            Pegue aquí el contenido completo del correo que recibió (generado desde "Generar por correo"
                            en el formulario de solicitud). Debe incluir las líneas [[TICKETFAST-DATA]].
                        </p>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Pegue aquí el correo completo..."
                            rows="8"
                            className="input-premium"
                            style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button
                                type="button"
                                className="btn-premium btn-premium-warning"
                                onClick={() => { setShowImportModal(false); setImportText(''); }}
                                style={{ padding: '10px 24px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-premium"
                                onClick={handleImportTicket}
                                style={{ padding: '10px 24px' }}
                            >
                                📥 Importar Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ver/Imprimir Boleta */}
            {showBoletaTicket && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px', overflow: 'auto'
                }} onClick={() => setShowBoletaTicket(null)} className="no-print-backdrop">
                    <div
                        style={{ maxWidth: '900px', width: '100%', maxHeight: '92vh', overflow: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }} className="no-print">
                            <button className="btn-premium btn-premium-success btn-sm" onClick={() => window.print()}>🖨️ Imprimir</button>
                            <button className="btn-premium btn-premium-warning btn-sm" onClick={() => setShowBoletaTicket(null)}>✖ Cerrar</button>
                        </div>
                        <BoletaPrint ticket={showBoletaTicket} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketList;