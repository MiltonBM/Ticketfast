import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import HardwareForm from './HardwareForm';

const HardwareList = ({ onStatsUpdate, userRole }) => {
    const [hardware, setHardware] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // ============================================================
    // TIPOS DE EQUIPO SOPORTADOS
    // ============================================================
    const deviceTypes = [
        'PC',
        'Laptop',
        'Monitor',
        'Impresora',
        'Videobeam',
        'Proyector',
        'Switch',
        'Router',
        'Otro'
    ];

    // ============================================================
    // CARGAR INVENTARIO
    // ============================================================
    useEffect(() => {
        loadHardware();
    }, []);

    const loadHardware = async () => {
        try {
            setLoading(true);

            const response = await api.get('/hardware');

            const data = Array.isArray(response.data)
                ? response.data
                : [];

            setHardware(data);

            if (onStatsUpdate) {
                onStatsUpdate();
            }

        } catch (error) {
            console.error('Error loading hardware:', error);

            toast.error('❌ Error al cargar el inventario');

            setHardware([]);

        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // EDITAR
    // ============================================================
    const handleEditClick = (equipment) => {
        setEditingEquipment(equipment);
        setShowEditModal(true);
    };

    const handleEditCompleted = () => {
        setShowEditModal(false);
        setEditingEquipment(null);
        loadHardware();
    };

    const handleEditCancel = () => {
        setShowEditModal(false);
        setEditingEquipment(null);
    };

    // ============================================================
    // ELIMINAR
    // ============================================================
    const handleDelete = async (id) => {

        const confirmed = window.confirm(
            '¿Está seguro de eliminar este equipo?\n\nEsta acción no se puede deshacer.'
        );

        if (!confirmed) {
            return;
        }

        try {

            await api.delete(`/hardware/${id}`);

            toast.success('✅ Equipo eliminado correctamente');

            await loadHardware();

        } catch (error) {

            console.error('Error al eliminar:', error);

            toast.error(
                error.response?.data?.message ||
                '❌ Error al eliminar el equipo'
            );
        }
    };

    // ============================================================
    // EXPORTAR CSV
    // ============================================================
    const handleExport = () => {

        if (!hardware || hardware.length === 0) {
            toast.warning('⚠️ No hay equipos para exportar');
            return;
        }

        const headers = [
            'ID',
            'Serial',
            'Código Inventario',
            'Tipo',
            'Marca',
            'Modelo',
            'Estado',
            'Asignado a',
            'Fecha de Compra',
            'Garantía',
            'Procesador',
            'RAM',
            'Disco',
            'GPU',
            'Monitor',
            'Teclado',
            'Mouse',
            'Observaciones'
        ];

        const escapeCSV = (value) => {
            if (value === null || value === undefined) {
                return '';
            }

            const stringValue = String(value);

            return `"${stringValue.replace(/"/g, '""')}"`;
        };

        const statusMap = {
            operative: 'Operativo',
            maintenance: 'En Mantenimiento',
            retired: 'Retirado'
        };

        const rows = hardware.map((h) => {

            const assignedTo =
                h.assigned_user_name ||
                h.assigned_lab_name ||
                'No asignado';

            const processor = [
                h.processor_brand,
                h.processor_model
            ]
                .filter(Boolean)
                .join(' ');

            const ram = [
                h.ram_modules
                    ? `${h.ram_modules} módulos`
                    : '',
                h.ram_brand,
                h.ram_speed,
                h.ram_capacity
            ]
                .filter(Boolean)
                .join(' ');

            const disk = [
                h.hdd_type,
                h.hdd_capacity,
                h.hdd_brand,
                h.hdd_model
            ]
                .filter(Boolean)
                .join(' ');

            const gpu = [
                h.gpu_brand,
                h.gpu_memory
            ]
                .filter(Boolean)
                .join(' ');

            const monitor = [
                h.monitor_brand,
                h.monitor_model,
                h.monitor_size,
                h.monitor_resolution
            ]
                .filter(Boolean)
                .join(' ');

            return [
                h.id,
                h.serial_number || h.computer_serial || 'N/A',
                h.inventory_code || 'N/A',
                getDeviceLabel(h.device_type),
                h.brand || 'N/A',
                h.model || 'N/A',
                statusMap[h.status] || h.status || 'Operativo',
                assignedTo,
                h.purchase_date || 'N/A',
                h.warranty_date || 'N/A',
                processor || 'N/A',
                ram || 'N/A',
                disk || 'N/A',
                gpu || 'N/A',
                monitor || 'N/A',
                h.keyboard_type || 'N/A',
                h.mouse_type || 'N/A',
                h.observations || 'N/A'
            ]
                .map(escapeCSV)
                .join(',');
        });

        const csv =
            headers.map(escapeCSV).join(',') +
            '\n' +
            rows.join('\n');

        const blob = new Blob(
            ['\uFEFF' + csv],
            {
                type: 'text/csv;charset=utf-8;'
            }
        );

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download =
            `inventario_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);

        toast.success('📥 Inventario exportado correctamente');
    };

    // ============================================================
    // ICONOS
    // ============================================================
    const getDeviceIcon = (type) => {

        const icons = {
            PC: '🖥️',
            Laptop: '💻',
            Monitor: '🖥️',
            Impresora: '🖨️',
            Videobeam: '📽️',
            Proyector: '📽️',
            Switch: '🔌',
            Router: '📡',
            Otro: '📦'
        };

        return icons[type] || '📦';
    };

    // ============================================================
    // NOMBRES
    // ============================================================
    const getDeviceLabel = (type) => {

        const labels = {
            PC: 'PC de Escritorio',
            Laptop: 'Laptop',
            Monitor: 'Monitor',
            Impresora: 'Impresora',
            Videobeam: 'Videobeam',
            Proyector: 'Proyector',
            Switch: 'Switch',
            Router: 'Router',
            Otro: 'Otro'
        };

        return labels[type] || type || 'No especificado';
    };

    // ============================================================
    // ESTADO
    // ============================================================
    const getStatusBadge = (status) => {

        const statusMap = {
            operative: {
                label: '✅ Operativo',
                className: 'badge-success'
            },

            maintenance: {
                label: '🔧 En Mantenimiento',
                className: 'badge-warning'
            },

            retired: {
                label: '📦 Retirado',
                className: 'badge-danger'
            }
        };

        const info =
            statusMap[status] ||
            statusMap.operative;

        return (
            <span
                className={`badge-premium ${info.className}`}
            >
                {info.label}
            </span>
        );
    };

    // ============================================================
    // FILTRAR
    // ============================================================
    const filteredHardware = (hardware || []).filter((item) => {

        const matchesType =
            filterType === 'all' ||
            item.device_type === filterType;

        if (!searchTerm) {
            return matchesType;
        }

        const term =
            searchTerm
                .toLowerCase()
                .trim();

        const searchFields = [
            item.id,
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
            item.ram_brand,
            item.hdd_brand,
            item.hdd_model,
            item.gpu_brand,
            item.monitor_brand,
            item.monitor_model,
            item.keyboard_type,
            item.mouse_type,
            item.observations
        ];

        const matchesSearch =
            searchFields.some((field) =>
                field !== null &&
                field !== undefined &&
                String(field)
                    .toLowerCase()
                    .includes(term)
            );

        return matchesSearch && matchesType;
    });

    // ============================================================
    // CONTADORES
    // ============================================================
    const getCountByType = (type) => {

        if (type === 'all') {
            return hardware.length;
        }

        return hardware.filter(
            item => item.device_type === type
        ).length;
    };

    // ============================================================
    // CARGANDO
    // ============================================================
    if (loading) {

        return (
            <div
                className="card-premium"
                style={{
                    textAlign: 'center',
                    padding: '60px 20px'
                }}
            >
                <div
                    style={{
                        fontSize: '48px',
                        marginBottom: '16px'
                    }}
                >
                    ⏳
                </div>

                <h3 style={{ color: '#666' }}>
                    Cargando inventario...
                </h3>
            </div>
        );
    }

    // ============================================================
    // INTERFAZ
    // ============================================================
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}
        >

            {/* =====================================================
                ENCABEZADO
            ====================================================== */}
            <div className="card-premium">

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}
                >

                    <div>

                        <h2
                            style={{
                                fontSize: '22px',
                                fontWeight: '700',
                                color: '#1B2A4A',
                                margin: 0
                            }}
                        >
                            💻 Inventario de Hardware
                        </h2>

                        <p
                            style={{
                                fontSize: '14px',
                                color: '#999',
                                marginTop: '6px'
                            }}
                        >
                            {filteredHardware.length} de {hardware.length} equipos
                        </p>

                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap'
                        }}
                    >

                        <button
                            onClick={handleExport}
                            className="btn-premium btn-premium-secondary btn-sm"
                        >
                            📥 Exportar CSV
                        </button>

                        <button
                            onClick={loadHardware}
                            className="btn-premium btn-sm"
                        >
                            🔄 Actualizar
                        </button>

                    </div>

                </div>

                {/* =================================================
                    BUSCADOR
                ================================================== */}

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginTop: '16px'
                    }}
                >

                    <input
                        type="text"
                        placeholder="🔍 Buscar por serial, marca, modelo, tipo o asignado..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                        className="input-premium"
                        style={{
                            flex: '1',
                            minWidth: '250px'
                        }}
                    />

                    <select
                        value={filterType}
                        onChange={(e) =>
                            setFilterType(e.target.value)
                        }
                        className="input-premium"
                        style={{
                            minWidth: '200px'
                        }}
                    >

                        <option value="all">
                            Todos los equipos ({getCountByType('all')})
                        </option>

                        {deviceTypes.map((type) => (
                            <option
                                key={type}
                                value={type}
                            >
                                {getDeviceIcon(type)}{' '}
                                {getDeviceLabel(type)}{' '}
                                ({getCountByType(type)})
                            </option>
                        ))}

                    </select>

                </div>

            </div>

            {/* =====================================================
                TARJETAS DE TIPOS
            ====================================================== */}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px'
                }}
            >

                {deviceTypes.map((type) => (

                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        style={{
                            border:
                                filterType === type
                                    ? '2px solid #1B2A4A'
                                    : '1px solid #ddd',
                            borderRadius: '12px',
                            padding: '15px',
                            background: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                    >

                        <div
                            style={{
                                fontSize: '28px',
                                marginBottom: '6px'
                            }}
                        >
                            {getDeviceIcon(type)}
                        </div>

                        <div
                            style={{
                                fontWeight: '600',
                                fontSize: '13px',
                                color: '#1B2A4A'
                            }}
                        >
                            {getDeviceLabel(type)}
                        </div>

                        <div
                            style={{
                                fontSize: '12px',
                                color: '#888',
                                marginTop: '4px'
                            }}
                        >
                            {getCountByType(type)} registrados
                        </div>

                    </button>

                ))}

            </div>

            {/* =====================================================
                LISTA
            ====================================================== */}

            {filteredHardware.length === 0 ? (

                <div
                    className="card-premium"
                    style={{
                        textAlign: 'center',
                        padding: '60px 20px'
                    }}
                >

                    <div
                        style={{
                            fontSize: '60px',
                            marginBottom: '15px'
                        }}
                    >
                        📦
                    </div>

                    <h3>
                        No se encontraron equipos
                    </h3>

                    <p
                        style={{
                            color: '#888'
                        }}
                    >
                        Intenta cambiar los filtros o realizar otra búsqueda.
                    </p>

                </div>

            ) : (

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px'
                    }}
                >

                    {filteredHardware.map((equipment) => {

                        const assignedTo =
                            equipment.assigned_user_name ||
                            equipment.assigned_lab_name ||
                            'No asignado';

                        const serial =
                            equipment.serial_number ||
                            equipment.computer_serial ||
                            'Sin serial';

                        return (

                            <div
                                key={equipment.id}
                                className="card-premium"
                                style={{
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >

                                {/* CABECERA */}

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: '10px'
                                    }}
                                >

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center'
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize: '38px'
                                            }}
                                        >
                                            {getDeviceIcon(
                                                equipment.device_type
                                            )}
                                        </div>

                                        <div>

                                            <h3
                                                style={{
                                                    margin: 0,
                                                    color: '#1B2A4A',
                                                    fontSize: '17px'
                                                }}
                                            >
                                                {getDeviceLabel(
                                                    equipment.device_type
                                                )}
                                            </h3>

                                            <p
                                                style={{
                                                    margin: '4px 0 0',
                                                    fontSize: '13px',
                                                    color: '#888'
                                                }}
                                            >
                                                {equipment.brand || 'Sin marca'}
                                                {' '}
                                                {equipment.model || ''}
                                            </p>

                                        </div>

                                    </div>

                                    <div>
                                        {getStatusBadge(
                                            equipment.status
                                        )}
                                    </div>

                                </div>

                                {/* INFORMACIÓN */}

                                <div
                                    style={{
                                        marginTop: '18px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}
                                >

                                    <div>
                                        <strong>
                                            🔢 Serial:
                                        </strong>{' '}
                                        {serial}
                                    </div>

                                    <div>
                                        <strong>
                                            🏷️ Inventario:
                                        </strong>{' '}
                                        {equipment.inventory_code ||
                                            'No asignado'}
                                    </div>

                                    <div>
                                        <strong>
                                            👤 Asignado a:
                                        </strong>{' '}
                                        {assignedTo}
                                    </div>

                                    {/* INFORMACIÓN DE PC/LAPTOP */}

                                    {(equipment.device_type === 'PC' ||
                                        equipment.device_type === 'Laptop') && (
                                        <>
                                            <div>
                                                <strong>
                                                    ⚙️ Procesador:
                                                </strong>{' '}
                                                {[
                                                    equipment.processor_brand,
                                                    equipment.processor_model
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') ||
                                                    'No registrado'}
                                            </div>

                                            <div>
                                                <strong>
                                                    🧠 RAM:
                                                </strong>{' '}
                                                {[
                                                    equipment.ram_capacity,
                                                    equipment.ram_speed
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') ||
                                                    'No registrada'}
                                            </div>

                                            <div>
                                                <strong>
                                                    💾 Almacenamiento:
                                                </strong>{' '}
                                                {[
                                                    equipment.hdd_type,
                                                    equipment.hdd_capacity
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') ||
                                                    'No registrado'}
                                            </div>
                                        </>
                                    )}

                                    {/* INFORMACIÓN DE MONITOR */}

                                    {equipment.device_type === 'Monitor' && (
                                        <>
                                            <div>
                                                <strong>
                                                    📐 Tamaño:
                                                </strong>{' '}
                                                {equipment.monitor_size ||
                                                    'No registrado'}
                                            </div>

                                            <div>
                                                <strong>
                                                    🖼️ Resolución:
                                                </strong>{' '}
                                                {equipment.monitor_resolution ||
                                                    'No registrada'}
                                            </div>
                                        </>
                                    )}

                                    {/* INFORMACIÓN DE IMPRESORA */}

                                    {equipment.device_type === 'Impresora' && (
                                        <>
                                            <div>
                                                <strong>
                                                    🖨️ Tipo:
                                                </strong>{' '}
                                                {equipment.printer_type ||
                                                    'No registrado'}
                                            </div>
                                        </>
                                    )}

                                    {/* INFORMACIÓN DE VIDEOBEAM */}

                                    {(equipment.device_type === 'Videobeam' ||
                                        equipment.device_type === 'Proyector') && (
                                        <>
                                            <div>
                                                <strong>
                                                    📽️ Resolución:
                                                </strong>{' '}
                                                {equipment.projector_resolution ||
                                                    equipment.resolution ||
                                                    'No registrada'}
                                            </div>
                                        </>
                                    )}

                                    {/* INFORMACIÓN DE SWITCH */}

                                    {equipment.device_type === 'Switch' && (
                                        <>
                                            <div>
                                                <strong>
                                                    🔌 Puertos:
                                                </strong>{' '}
                                                {equipment.ports ||
                                                    equipment.port_count ||
                                                    'No registrados'}
                                            </div>
                                        </>
                                    )}

                                    {/* INFORMACIÓN DE ROUTER */}

                                    {equipment.device_type === 'Router' && (
                                        <>
                                            <div>
                                                <strong>
                                                    📡 Puertos:
                                                </strong>{' '}
                                                {equipment.ports ||
                                                    equipment.port_count ||
                                                    'No registrados'}
                                            </div>
                                        </>
                                    )}

                                    {/* FECHA */}

                                    <div>
                                        <strong>
                                            📅 Registrado:
                                        </strong>{' '}
                                        {equipment.created_at
                                            ? new Date(
                                                equipment.created_at
                                            ).toLocaleDateString()
                                            : 'No disponible'}
                                    </div>

                                </div>

                                {/* BOTONES */}

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        marginTop: '20px'
                                    }}
                                >

                                    <button
                                        onClick={() =>
                                            handleEditClick(equipment)
                                        }
                                        className="btn-premium btn-sm"
                                        style={{
                                            flex: 1
                                        }}
                                    >
                                        ✏️ Editar
                                    </button>

                                    {userRole === 'admin' && (
                                        <button
                                            onClick={() =>
                                                handleDelete(
                                                    equipment.id
                                                )
                                            }
                                            className="btn-premium btn-sm"
                                            style={{
                                                flex: 1,
                                                background: '#dc3545',
                                                color: '#fff'
                                            }}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    )}

                                </div>

                            </div>

                        );
                    })}

                </div>

            )}

            {/* =====================================================
                MODAL DE EDICIÓN
            ====================================================== */}

            {showEditModal && editingEquipment && (

                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                    onClick={handleEditCancel}
                >

                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '900px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '25px'
                        }}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <HardwareForm
                            equipment={editingEquipment}
                            onSuccess={handleEditCompleted}
                            onCancel={handleEditCancel}
                            isEditing={true}
                        />

                    </div>

                </div>

            )}

        </div>
    );
};

export default HardwareList;