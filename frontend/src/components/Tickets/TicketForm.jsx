import React, { useState } from 'react';
import api from '../../services/api';
import GlassInput from '../Common/GlassInput';
import Card3D from '../Common/Card3D';
import { toast } from 'react-toastify';

const TicketForm = ({ onTicketCreated }) => {
    const [formData, setFormData] = useState({
        user_name: '',
        user_department: '',
        user_department_id: '',
        user_phone: '',
        user_email: '',
        computer_model: '',
        computer_serial: '',
        computer_os: '',
        failure_description: '',
        failure_classification: ''
    });

    const [emailRecipient, setEmailRecipient] = useState('');
    const [departments, setDepartments] = useState([]);

    React.useEffect(() => {
        api.get('/admin/settings')
            .then(res => setEmailRecipient(res.data?.email_recipient || ''))
            .catch(() => setEmailRecipient(''));

        // Catálogo de departamentos (código/etiqueta de ID + nombre)
        api.get('/departments')
            .then(res => setDepartments(res.data || []))
            .catch(() => setDepartments([]));
    }, []);

    // Al elegir un departamento del catálogo, se guarda tanto el nombre
    // como su etiqueta de ID (código) para el ticket
    const handleDepartmentChange = (e) => {
        const selectedId = e.target.value;
        const dept = departments.find(d => String(d.id) === selectedId);
        setFormData({
            ...formData,
            user_department: dept ? dept.name : '',
            user_department_id: dept ? dept.code : ''
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleGenerateByEmail = () => {
        if (!formData.user_name || !formData.user_department || !formData.computer_model || !formData.failure_description) {
            toast.error('❌ Complete al menos nombre, departamento, equipo y descripción del fallo antes de generar el correo');
            return;
        }
        const jsonData = JSON.stringify(formData);
        const encoded = btoa(unescape(encodeURIComponent(jsonData)));
        const body =
            `Solicitud de ticket de soporte generada sin conexión.\n\n` +
            `El Administrador debe copiar TODO este correo (incluyendo las líneas [[TICKETFAST-DATA]]) ` +
            `y pegarlo en Ticketfast > Importar Ticket.\n\n` +
            `[[TICKETFAST-DATA]]\n${encoded}\n[[/TICKETFAST-DATA]]`;
        const subject = `Ticket de soporte - ${formData.user_name} - ${formData.computer_model}`;
        const mailto = `mailto:${emailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
        toast.info('📧 Se abrió su cliente de correo con los datos del ticket. Revise y envíe el correo.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/tickets', formData);
            toast.success(`✅ Ticket #${response.data.ticket_number} creado exitosamente`);
            setFormData({
                user_name: '',
                user_department: '',
                user_department_id: '',
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
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departamento
                        </label>
                        <select
                            name="user_department_select"
                            value={departments.find(d => d.code === formData.user_department_id)?.id || ''}
                            onChange={handleDepartmentChange}
                            className="input-premium"
                            required
                        >
                            <option value="">Seleccionar departamento...</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>
                                    [{d.code}] {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
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

                <div style={{ padding: '10px 14px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1976D2', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                        ℹ️ Si esta PC <strong>no está conectada</strong> al servidor de Ticketfast, use el botón
                        "📧 Generar por correo" para enviar la solicitud por email en lugar de "Enviar Ticket".
                    </p>
                </div>

                <div className="flex justify-center gap-4 flex-wrap">
                    <button type="submit" className="btn-premium">
                        🚀 Enviar Ticket
                    </button>
                    <button
                        type="button"
                        className="btn-premium btn-premium-secondary"
                        onClick={handleGenerateByEmail}
                    >
                        📧 Generar por correo
                    </button>
                    <button 
                        type="button" 
                        className="btn-premium btn-premium-warning"
                        onClick={() => setFormData({
                            user_name: '',
                            user_department: '',
                            user_department_id: '',
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