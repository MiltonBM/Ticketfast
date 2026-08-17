import React, { useState } from 'react';
import api from '../../services/api';
import GlassInput from '../Common/GlassInput';
import Card3D from '../Common/Card3D';
import { toast } from 'react-toastify';

const TicketForm = ({ onTicketCreated }) => {
    const [formData, setFormData] = useState({
        user_name: '',
        user_department: '',
        user_phone: '',
        user_email: '',
        computer_model: '',
        computer_serial: '',
        computer_os: '',
        failure_description: '',
        failure_classification: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/tickets', formData);
            toast.success(`✅ Ticket #${response.data.ticket_number} creado exitosamente`);
            setFormData({
                user_name: '',
                user_department: '',
                user_phone: '',
                user_email: '',
                computer_model: '',
                computer_serial: '',
                computer_os: '',
                failure_description: '',
                failure_classification: ''
            });
            if (onTicketCreated) onTicketCreated();
        } catch (error) {
            toast.error('❌ Error al crear el ticket');
            console.error(error);
        }
    };

    return (
        <Card3D className="max-w-2xl mx-auto">
            <div style={{ 
                background: 'linear-gradient(135deg, #1B2A4A, #0D1B2A)',
                padding: '20px 24px',
                borderRadius: '12px 12px 0 0',
                margin: '-24px -24px 24px -24px',
                color: 'white',
                borderBottom: '4px solid #D4A843'
            }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700' }}>🎫 Nuevo Ticket de Soporte</h2>
                <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>Complete todos los campos para generar un ticket</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassInput
                        label="Nombre completo"
                        name="user_name"
                        value={formData.user_name}
                        onChange={handleChange}
                        placeholder="Ingrese su nombre"
                        required
                    />
                    <GlassInput
                        label="Departamento"
                        name="user_department"
                        value={formData.user_department}
                        onChange={handleChange}
                        placeholder="Departamento"
                        required
                    />
                    <GlassInput
                        label="Teléfono"
                        name="user_phone"
                        value={formData.user_phone}
                        onChange={handleChange}
                        placeholder="Teléfono de contacto"
                    />
                    <GlassInput
                        label="Email"
                        name="user_email"
                        value={formData.user_email}
                        onChange={handleChange}
                        placeholder="email@empresa.com"
                        type="email"
                    />
                    <GlassInput
                        label="Modelo del equipo"
                        name="computer_model"
                        value={formData.computer_model}
                        onChange={handleChange}
                        placeholder="Ej: Dell Latitude 7420"
                        required
                    />
                    <GlassInput
                        label="Serial/Número de inventario"
                        name="computer_serial"
                        value={formData.computer_serial}
                        onChange={handleChange}
                        placeholder="Serial del equipo"
                    />
                    <GlassInput
                        label="Sistema Operativo"
                        name="computer_os"
                        value={formData.computer_os}
                        onChange={handleChange}
                        placeholder="Ej: Windows 11 Pro"
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clasificación del fallo
                        </label>
                        <select
                            name="failure_classification"
                            value={formData.failure_classification}
                            onChange={handleChange}
                            className="input-premium"
                        >
                            <option value="">Seleccionar clasificación</option>
                            <option value="Disco">Disco Duro</option>
                            <option value="Memoria">Memoria RAM</option>
                            <option value="Software">Software</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Red">Red</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción del fallo
                    </label>
                    <textarea
                        name="failure_description"
                        value={formData.failure_description}
                        onChange={handleChange}
                        placeholder="Describa detalladamente el problema..."
                        rows="4"
                        className="input-premium w-full"
                        required
                    />
                </div>

                <div className="flex justify-center gap-4 flex-wrap">
                    <button type="submit" className="btn-premium">
                        🚀 Enviar Ticket
                    </button>
                    <button 
                        type="button" 
                        className="btn-premium btn-premium-warning"
                        onClick={() => setFormData({
                            user_name: '',
                            user_department: '',
                            user_phone: '',
                            user_email: '',
                            computer_model: '',
                            computer_serial: '',
                            computer_os: '',
                            failure_description: '',
                            failure_classification: ''
                        })}
                    >
                        🔄 Limpiar
                    </button>
                </div>
            </form>
        </Card3D>
    );
};

export default TicketForm;
