import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const HardwareList = ({ onStatsUpdate }) => {
    const [hardware, setHardware] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    useEffect(() => {
        loadHardware();
    }, []);

    const loadHardware = async () => {
        try {
            setLoading(true);
            const response = await api.get('/hardware');
            const data = Array.isArray(response.data) ? response.data : [];
            setHardware(data);
            if (onStatsUpdate) onStatsUpdate();
        } catch (error) {
            console.error('Error loading hardware:', error);
            toast.error('❌ Error al cargar el inventario');
            setHardware([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (equipment) => {
        setEditingEquipment(equipment);
        setEditFormData({ ...equipment });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: value
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/hardware/${editingEquipment.id}`, editFormData);
            toast.success('✅ Equipo actualizado');
            setShowEditModal(false);
            setEditingEquipment(null);
            loadHardware();
        } catch (error) {
            toast.error('❌ Error al actualizar el equipo');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este equipo?')) {
            try {
                await api.delete(`/hardware/${id}`);
                toast.success('✅ Equipo eliminado');
                loadHardware();
            } catch (error) {
                toast.error('❌ Error al eliminar');
            }
        }
    };

    const handleExport = () => {
        if (!hardware || hardware.length === 0) {
            toast.warning('No hay equipos para exportar');
            return;
        }

        const headers = 'Serial,Tipo,Marca,Modelo,Procesador,RAM,Disco,GPU,Teclado,Mouse,Estado,Asignado,Fecha';
        const rows = hardware.map(h => {
            const assignedTo = h.assigned_user_name || h.assigned_lab_name || 'No asignado';
            const statusMap = { operative: 'Operativo', maintenance: 'En Mantenimiento', retired: 'Retirado' };
            return [
                h.serial_number || h.computer_serial || 'N/A',
                h.device_type || 'N/A',
                h.brand || 'N/A',
                h.model || 'N/A',
                `${h.processor_brand || ''} ${h.processor_model || ''}`.trim() || 'N/A',
                `${h.ram_modules || 0}x ${h.ram_brand || ''} ${h.ram_speed || ''}`.trim() || 'N/A',
                `${h.hdd_type || ''} ${h.hdd_capacity || ''}`.trim() || 'N/A',
                `${h.gpu_brand || ''} ${h.gpu_memory || ''}`.trim() || 'N/A',
                h.keyboard_type || 'N/A',
                h.mouse_type || 'N/A',
                statusMap[h.status] || h.status || 'Operativo',
                assignedTo,
                new Date(h.created_at).toLocaleDateString()
            ].join(',');
        });
        
        const csv = headers + '\n' + rows.join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('📥 Inventario exportado');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'operative': { label: '✅ Operativo', class: 'badge-success' },
            'maintenance': { label: '🔧 Mantenimiento', class: 'badge-warning' },
            'retired': { label: '📦 Retirado', class: 'badge-danger' }
        };
        const info = statusMap[status] || statusMap['operative'];
        return `<span class="badge-premium ${info.class}">${info.label}</span>`;
    };

    const getDeviceIcon = (type) => {
        const icons = {
            'PC': '🖥️',
            'Laptop': '💻',
            'Videobeam': '📽️',
            'Proyector': '📽️',
            'Monitor': '🖥️',
            'Impresora': '🖨️',
            'Switch': '🔌',
            'Router': '📡',
            'Otro': '📦'
        };
        return icons[type] || '📦';
    };

    const getDeviceLabel = (type) => {
        const labels = {
            'PC': 'PC Escritorio',
            'Laptop': 'Laptop',
            'Videobeam': 'Videobeam',
            'Proyector': 'Proyector',
            'Monitor': 'Monitor',
            'Impresora': 'Impresora',
            'Switch': 'Switch',
            'Router': 'Router',
            'Otro': 'Otro'
        };
        return labels[type] || type || 'N/A';
    };

    const filteredHardware = (hardware || []).filter(item => {
        if (!searchTerm) return filterType === 'all' || item.device_type === filterType;
        const term = searchTerm.toLowerCase();
        const searchFields = [
            item.serial_number,
            item.computer_serial,
            item.inventory_code,
            item.brand,
            item.model,
            item.device_type,
            item.assigned_user_name,
            item.assigned_lab_name,
            item.processor_brand,
            item.processor_model,
            item.keyboard_type,
            item.mouse_type
        ];
        const matchesSearch = searchFields.some(field => 
            field && field.toString().toLowerCase().includes(term)
        );
        const matchesFilter = filterType === 'all' || item.device_type === filterType;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="card-premium" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ color: '#666' }}>Cargando inventario...</h3>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header y filtros */}
            <div className="card-premium">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1B2A4A' }}>
                            💻 Inventario de Hardware
                        </h2>
                        <p style={{ fontSize: '14px', color: '#999' }}>
                            {hardware.length} equipos registrados
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={handleExport} className="btn-premium btn-premium-secondary btn-sm">
                            📥 Exportar CSV
                        </button>
                        <button onClick={loadHardware} className="btn-premium btn-sm">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por serial, marca, modelo, tipo o asignado a..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-premium"
                        style={{ flex: '1', minWidth: '200px' }}
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="input-premium"
                        style={{ width: 'auto', minWidth: '150px' }}
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="PC">PC Escritorio</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Videobeam">Videobeam</option>
                        <option value="Monitor">Monitor</option>
                        <option value="Impresora">Impresora</option>
                        <option value="Switch">Switch</option>
                        <option value="Router">Router</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
            </div>

            {/* Grid de hardware */}
            {filteredHardware.length === 0 ? (
                <div className="card-premium" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔧</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>
                        {hardware.length === 0 ? 'No hay equipos registrados' : 'No se encontraron equipos'}
                    </h3>
                    <p style={{ color: '#999', marginTop: '8px' }}>
                        {hardware.length === 0 
                            ? 'Agrega un nuevo equipo desde el menú lateral' 
                            : 'Prueba con otro término de búsqueda'}
                    </p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                    gap: '16px'
                }}>
                    {filteredHardware.map((item) => (
                        <div key={item.id} className="card-premium" style={{ 
                            padding: '20px',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {/* Header */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'flex-start',
                                borderBottom: '2px solid #f0f0f0',
                                paddingBottom: '10px'
                            }}>
                                <div>
                                    <span style={{ fontSize: '20px', marginRight: '8px' }}>
                                        {getDeviceIcon(item.device_type)}
                                    </span>
                                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B2A4A' }}>
                                        {getDeviceLabel(item.device_type)}
                                    </span>
                                </div>
                                <span dangerouslySetInnerHTML={{ __html: getStatusBadge(item.status) }} />
                            </div>

                            {/* Información del equipo */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                        Serial:
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#1B2A4A', fontWeight: '500' }}>
                                        {item.serial_number || item.computer_serial || 'N/A'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                        Marca/Modelo:
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#333' }}>
                                        {item.brand || 'N/A'} {item.model ? `(${item.model})` : ''}
                                    </span>
                                </div>

                                {item.processor_brand && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Procesador:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.processor_brand} {item.processor_model || ''}
                                        </span>
                                    </div>
                                )}

                                {item.ram_brand && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            RAM:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.ram_modules || 0}x {item.ram_brand} {item.ram_speed || ''}
                                        </span>
                                    </div>
                                )}

                                {item.hdd_type && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Disco:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.hdd_type} {item.hdd_capacity || ''}
                                        </span>
                                    </div>
                                )}

                                {item.gpu_brand && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            GPU:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.gpu_brand} {item.gpu_memory || ''}
                                        </span>
                                    </div>
                                )}

                                {(item.keyboard_type || item.mouse_type) && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>                                            Periféricos:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.keyboard_type ? `Teclado: ${item.keyboard_type}` : ''}
                                            {item.keyboard_type && item.mouse_type ? ' · ' : ''}
                                            {item.mouse_type ? `Mouse: ${item.mouse_type}` : ''}
                                        </span>
                                    </div>
                                )}

                                {(item.screen_size || item.screen_resolution) && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Pantalla:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.screen_size || ''} {item.screen_resolution || ''}
                                        </span>
                                    </div>
                                )}

                                {item.monitor_size && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Tamaño:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.monitor_size} {item.monitor_resolution ? `· ${item.monitor_resolution}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.monitor_refresh_rate && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Panel:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.monitor_panel_type || ''} {item.monitor_refresh_rate ? `· ${item.monitor_refresh_rate}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.monitor_ports && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Puertos:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.monitor_ports} {item.monitor_stand_type ? `· Soporte: ${item.monitor_stand_type}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.printer_type && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Tipo:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.printer_type} {item.printer_technology ? `· ${item.printer_technology}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.printer_speed_pages && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Velocidad:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.printer_speed_pages} {item.printer_max_resolution ? `· ${item.printer_max_resolution}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.printer_paper_size && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Papel:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.printer_paper_size} {item.printer_connectivity ? `· ${item.printer_connectivity}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.printer_toner_type && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Tóner:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.printer_toner_type}
                                        </span>
                                    </div>
                                )}

                                {item.projector_lumens && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Lúmenes:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.projector_lumens} {item.projector_resolution ? `· ${item.projector_resolution}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.projector_contrast && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Contraste:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.projector_contrast} {item.projector_lamp_hours ? `· Lámpara: ${item.projector_lamp_hours}h` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.projector_inputs && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Entradas:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.projector_inputs}
                                        </span>
                                    </div>
                                )}

                                {item.network_ports && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Puertos:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.network_ports} {item.network_speed ? `· ${item.network_speed}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.network_managed && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Gestión:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.network_managed} {item.network_poe ? `· PoE: ${item.network_poe}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.network_wifi_standard && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            WiFi:
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#333' }}>
                                            {item.network_wifi_standard} {item.network_frequency ? `· ${item.network_frequency}` : ''}
                                        </span>
                                    </div>
                                )}

                                {item.observations && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#555', minWidth: '70px' }}>
                                            Obs.:
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                                            {item.observations}
                                        </span>
                                    </div>
                                )}

                                {/* Asignación y acciones */}
                                <div style={{ 
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid #f0f0f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '6px'
                                }}>
                                    <div>
                                        <span style={{ fontWeight: '600', fontSize: '12px', color: '#888' }}>
                                            ASIGNADO A:
                                        </span>                                        <span style={{ 
                                            fontSize: '13px', 
                                            color: '#1B2A4A', 
                                            fontWeight: '600',
                                            marginLeft: '6px'
                                        }}>
                                            {item.assigned_user_name || item.assigned_lab_name || 'No asignado'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                            className="btn-premium btn-premium-secondary btn-sm"
                                            onClick={() => handleEditClick(item)}
                                            style={{ padding: '4px 12px', fontSize: '11px' }}
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            className="btn-premium btn-premium-danger btn-sm"
                                            style={{ padding: '4px 12px', fontSize: '11px' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Edición */}
            {showEditModal && editingEquipment && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    overflow: 'auto'
                }} onClick={() => setShowEditModal(false)}>
                    <div 
                        className="card-premium" 
                        style={{ 
                            maxWidth: '500px', 
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            animation: 'fadeInUp 0.3s ease-out',
                            padding: '32px',
                            backgroundColor: 'white'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ 
                            fontSize: '20px', 
                            fontWeight: '700', 
                            color: '#1B2A4A', 
                            marginBottom: '20px',
                            borderBottom: '3px solid #D4A843',
                            paddingBottom: '12px'
                        }}>
                            ✏️ Editar Equipo
                        </h3>

                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Serial
                                </label>
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={editFormData.serial_number || ''}
                                    onChange={handleEditChange}
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Marca
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={editFormData.brand || ''}
                                    onChange={handleEditChange}
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Modelo
                                </label>
                                <input
                                    type="text"
                                    name="model"
                                    value={editFormData.model || ''}
                                    onChange={handleEditChange}
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Estado
                                </label>
                                <select
                                    name="status"
                                    value={editFormData.status || 'operative'}
                                    onChange={handleEditChange}
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                >
                                    <option value="operative">Operativo</option>
                                    <option value="maintenance">En Mantenimiento</option>
                                    <option value="retired">Retirado</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Asignado a
                                </label>
                                <input
                                    type="text"
                                    name="assigned_user_name"
                                    value={editFormData.assigned_user_name || ''}
                                    onChange={handleEditChange}
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                    placeholder="Nombre del usuario asignado"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    className="btn-premium btn-premium-warning"
                                    onClick={() => setShowEditModal(false)}
                                    style={{ padding: '10px 24px' }}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-premium" style={{ padding: '10px 24px' }}>
                                    💾 Actualizar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HardwareList;