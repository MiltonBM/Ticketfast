import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [hardware, setHardware] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        department: '',
        phone: '',
        role: 'usuario',
        is_active: 1,
        assigned_equipment: []
    });

    useEffect(() => {
        loadUsers();
        loadHardware();
    }, []);

    // ============================================
    // CARGA DE USUARIOS CON CONTADOR INDIVIDUAL
    // ============================================
    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            const usersData = response.data || [];
            
            // Para cada usuario, obtener SOLO sus equipos asignados
            const usersWithEquipment = await Promise.all(usersData.map(async (user) => {
                try {
                    const equipResponse = await api.get(`/users/${user.id}/equipment`);
                    const allEquipment = equipResponse.data || [];
                    
                    // Filtrar SOLO los equipos asignados a este usuario específico
                    const userEquipment = allEquipment.filter(eq => eq.assigned_to_user === user.id);
                    
                    return {
                        ...user,
                        equipment_count: userEquipment.length,
                        equipment_list: userEquipment
                    };
                } catch (error) {
                    console.error(`Error loading equipment for user ${user.id}:`, error);
                    return {
                        ...user,
                        equipment_count: 0,
                        equipment_list: []
                    };
                }
            }));
            
            setUsers(usersWithEquipment);
        } catch (error) {
            toast.error('❌ Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const loadHardware = async () => {
        try {
            const response = await api.get('/hardware');
            setHardware(response.data || []);
        } catch (error) {
            console.error('Error loading hardware:', error);
        }
    };

    const loadUserEquipments = async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/equipment`);
            const allEquipment = response.data || [];
            // Filtrar SOLO equipos asignados a este usuario
            return allEquipment.filter(eq => eq.assigned_to_user === userId);
        } catch (error) {
            console.error('Error loading user equipment:', error);
            return [];
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        });
    };

    const handleEquipmentToggle = (equipmentId) => {
        setFormData(prev => {
            const current = prev.assigned_equipment || [];
            if (current.includes(equipmentId)) {
                return {
                    ...prev,
                    assigned_equipment: current.filter(id => id !== equipmentId)
                };
            } else {
                return {
                    ...prev,
                    assigned_equipment: [...current, equipmentId]
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userPayload = { ...formData };
            delete userPayload.assigned_equipment;
            
            let userId;
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, userPayload);
                userId = editingUser.id;
                toast.success('✅ Usuario actualizado');
            } else {
                const response = await api.post('/users', userPayload);
                userId = response.data.id;
                toast.success('✅ Usuario creado');
            }

            // Primero, desasignar todos los equipos que tenía el usuario
            const currentEquipments = await loadUserEquipments(userId);
            for (const eq of currentEquipments) {
                await api.put(`/hardware/${eq.id}`, {
                    assigned_to_user: null,
                    assignment_type: null,
                    assignment_date: null
                });
            }

            // Luego, asignar los nuevos equipos seleccionados
            if (formData.assigned_equipment && formData.assigned_equipment.length > 0) {
                for (const equipmentId of formData.assigned_equipment) {
                    await api.put(`/hardware/${equipmentId}`, {
                        assigned_to_user: userId,
                        assignment_type: 'user',
                        assignment_date: new Date().toISOString()
                    });
                }
                toast.success(`✅ ${formData.assigned_equipment.length} equipos asignados`);
            }

            setShowModal(false);
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                full_name: '',
                email: '',
                department: '',
                phone: '',
                role: 'usuario',
                is_active: 1,
                assigned_equipment: []
            });
            loadUsers();
            loadHardware();
        } catch (error) {
            toast.error(error.response?.data?.error || '❌ Error al guardar usuario');
        }
    };

    const handleEdit = async (user) => {
        setEditingUser(user);
        const userEquipments = await loadUserEquipments(user.id);
        const equipmentIds = userEquipments.map(e => e.id);
        
        setFormData({
            username: user.username,
            password: '',
            full_name: user.full_name,
            email: user.email || '',
            department: user.department || '',
            phone: user.phone || '',
            role: user.role || 'usuario',
            is_active: user.is_active,
            assigned_equipment: equipmentIds
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
            try {
                // Desasignar todos los equipos del usuario
                const userEquipments = await loadUserEquipments(id);
                for (const eq of userEquipments) {
                    await api.put(`/hardware/${eq.id}`, {
                        assigned_to_user: null,
                        assignment_type: null,
                        assignment_date: null
                    });
                }
                
                await api.delete(`/users/${id}`);
                toast.success('✅ Usuario eliminado');
                loadUsers();
            } catch (error) {
                toast.error('❌ Error al eliminar usuario');
            }
        }
    };

    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return '<span class="badge-premium" style="background: #D4A843; color: #1B2A4A; padding: 4px 12px; font-size: 11px;">🛡️ Admin</span>';
        } else if (role === 'tecnico') {
            return '<span class="badge-premium" style="background: #6C63FF; color: white; padding: 4px 12px; font-size: 11px;">👨‍🔧 Técnico</span>';
        }
        return '<span class="badge-premium" style="background: #1B2A4A; color: white; padding: 4px 12px; font-size: 11px;">👤 Usuario</span>';
    };

    const getStatusBadge = (is_active) => {
        if (is_active) {
            return '<span class="badge-premium" style="background: #2E7D32; color: white; padding: 4px 12px; font-size: 11px;">✅ Activo</span>';
        }
        return '<span class="badge-premium" style="background: #C62828; color: white; padding: 4px 12px; font-size: 11px;">❌ Inactivo</span>';
    };

    const getEquipmentBadge = (count) => {
        if (count === 0) {
            return '<span class="badge-premium" style="background: #e0e0e0; color: #666; padding: 4px 12px; font-size: 11px;">0 equipos</span>';
        }
        return `<span class="badge-premium" style="background: #6C63FF; color: white; padding: 4px 12px; font-size: 11px;">💻 ${count} equipo${count > 1 ? 's' : ''}</span>`;
    };

    if (loading) {
        return (
            <div className="card-premium" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ color: '#666' }}>Cargando usuarios...</h3>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card-premium">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1B2A4A' }}>
                            👥 Gestión de Usuarios
                        </h2>
                        <p style={{ fontSize: '14px', color: '#999' }}>
                            {users.length} usuarios registrados
                        </p>
                    </div>
                    <button 
                        className="btn-premium btn-premium-secondary"
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({
                                username: '',
                                password: '',
                                full_name: '',
                                email: '',
                                department: '',
                                phone: '',
                                role: 'usuario',
                                is_active: 1,
                                assigned_equipment: []
                            });
                            setShowModal(true);
                        }}
                    >
                        ➕ Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="card-premium" style={{ overflow: 'hidden' }}>
                {users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                        <p style={{ color: '#999' }}>No hay usuarios registrados</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            fontSize: '14px',
                            minWidth: '800px'
                        }}>
                            <thead>
                                <tr style={{ 
                                    background: '#1B2A4A', 
                                    color: 'white',
                                    borderBottom: '2px solid #D4A843'
                                }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Usuario</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Nombre</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Departamento</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Equipos</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Rol</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Estado</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user.id} style={{ 
                                        borderBottom: '1px solid #f0f0f0',
                                        background: index % 2 === 0 ? 'white' : '#fafafa'
                                    }}>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            <strong style={{ color: '#1B2A4A' }}>{user.username}</strong>
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            {user.full_name}
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            {user.department || 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                                            <span dangerouslySetInnerHTML={{ __html: getEquipmentBadge(user.equipment_count || 0) }} />
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                                            <span dangerouslySetInnerHTML={{ __html: getRoleBadge(user.role) }} />
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                                            <span dangerouslySetInnerHTML={{ __html: getStatusBadge(user.is_active) }} />
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button 
                                                    className="btn-premium btn-premium-secondary btn-sm"
                                                    onClick={() => handleEdit(user)}
                                                    style={{ padding: '6px 14px', fontSize: '12px' }}
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="btn-premium btn-premium-danger btn-sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    style={{ padding: '6px 14px', fontSize: '12px' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Usuario */}
            {showModal && (
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
                }} onClick={() => setShowModal(false)}>
                    <div 
                        className="card-premium" 
                        style={{ 
                            maxWidth: '550px', 
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
                            fontSize: '22px', 
                            fontWeight: '700', 
                            color: '#1B2A4A', 
                            marginBottom: '24px',
                            borderBottom: '3px solid #D4A843',
                            paddingBottom: '12px'
                        }}>
                            {editingUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Usuario *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Nombre de usuario"
                                    className="input-premium"
                                    required
                                    disabled={!!editingUser}
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={editingUser ? 'Dejar en blanco para mantener' : 'Contraseña'}
                                    className="input-premium"
                                    required={!editingUser}
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Nombre completo *
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Nombre completo"
                                    className="input-premium"
                                    required
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@empresa.com"
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Departamento
                                </label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="Ej: TI, RRHH, Finanzas"
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Teléfono
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Teléfono de contacto"
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                />
                            </div>

                            {/* SELECTOR DE ROL */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '5px' }}>
                                    Rol
                                </label>
                                <select
                                    name="role"
                                    value={formData.role || 'usuario'}
                                    onChange={handleChange}
                                    className="input-premium"
                                    style={{ padding: '10px 14px', width: '100%' }}
                                >
                                    <option value="usuario">👤 Usuario</option>
                                    <option value="tecnico">👨‍🔧 Técnico</option>
                                    <option value="admin">🛡️ Administrador</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active === 1}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked ? 1 : 0})}
                                        style={{ width: '18px', height: '18px', accentColor: '#1B2A4A' }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#1B2A4A', fontWeight: '500' }}>Usuario activo</span>
                                </label>
                            </div>

                            {/* ============================================ */}
                            {/* EQUIPOS ASIGNADOS - INDIVIDUAL POR USUARIO */}
                            {/* ============================================ */}
                            <div style={{ 
                                marginBottom: '20px', 
                                padding: '16px', 
                                background: '#f8f9fa', 
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2A4A', marginBottom: '10px' }}>
                                    💻 Equipos asignados
                                </label>
                                <p style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                                    Selecciona los equipos que estarán a cargo de este usuario
                                </p>
                                
                                {hardware.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', padding: '10px' }}>
                                        No hay equipos registrados
                                    </p>
                                ) : (
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                        gap: '6px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        padding: '4px'
                                    }}>
                                        {hardware.map(equipment => {
                                            // Si el equipo está asignado a OTRO usuario, NO se muestra
                                            const isAssignedToOther = equipment.assigned_to_user && 
                                                                       equipment.assigned_to_user !== editingUser?.id;
                                            if (isAssignedToOther) return null;
                                            
                                            const isAssignedToUser = editingUser && equipment.assigned_to_user === editingUser.id;
                                            const isChecked = formData.assigned_equipment?.includes(equipment.id) || false;
                                            
                                            return (
                                                <div 
                                                    key={equipment.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 12px',
                                                        borderRadius: '6px',
                                                        background: isAssignedToUser ? '#e8f5e9' : 'white',
                                                        border: isAssignedToUser ? '1px solid #4CAF50' : '1px solid #e0e0e0',
                                                        fontSize: '12px',
                                                        transition: 'all 0.2s',
                                                        opacity: isAssignedToUser ? 0.85 : 1
                                                    }}
                                                >
                                                    {isAssignedToUser ? (
                                                        <span style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '8px',
                                                            width: '100%'
                                                        }}>
                                                            <span style={{ color: '#4CAF50', fontSize: '16px' }}>✅</span>
                                                            <span style={{ wordBreak: 'break-word', lineHeight: '1.3' }}>
                                                                {equipment.serial_number || equipment.computer_serial || 'Sin serial'}
                                                                {equipment.brand && ` - ${equipment.brand}`}
                                                                {equipment.model && ` ${equipment.model}`}
                                                                <span style={{ fontSize: '10px', color: '#2E7D32', display: 'block' }}>
                                                                    Asignado a este usuario
                                                                </span>
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <label style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            cursor: 'pointer',
                                                            width: '100%'
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleEquipmentToggle(equipment.id)}
                                                                style={{ width: '16px', height: '16px', accentColor: '#1B2A4A', flexShrink: 0 }}
                                                            />
                                                            <span style={{ wordBreak: 'break-word', lineHeight: '1.3' }}>
                                                                {equipment.serial_number || equipment.computer_serial || 'Sin serial'}
                                                                {equipment.brand && ` - ${equipment.brand}`}
                                                                {equipment.model && ` ${equipment.model}`}
                                                                <span style={{ fontSize: '10px', color: '#2E7D32', display: 'block' }}>
                                                                    📌 Disponible
                                                                </span>
                                                            </span>
                                                        </label>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {formData.assigned_equipment?.length > 0 && (
                                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#2E7D32', fontWeight: '500', textAlign: 'center' }}>
                                        ✅ {formData.assigned_equipment.length} equipo{formData.assigned_equipment.length > 1 ? 's' : ''} seleccionado{formData.assigned_equipment.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    className="btn-premium btn-premium-warning"
                                    onClick={() => setShowModal(false)}
                                    style={{ padding: '10px 24px' }}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-premium" style={{ padding: '10px 24px' }}>
                                    {editingUser ? '💾 Actualizar' : '➕ Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
