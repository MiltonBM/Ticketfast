import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const INSPECTION_ITEMS = [
    ['scratches', 'Rayones / golpes en la carcasa'],
    ['missing_cover', 'Falta de tapa frontal / bahías'],
    ['dirty_ports', 'Puertos frontales dañados / sucios'],
    ['missing_feet', 'Patas de goma ausentes / dañadas'],
    ['missing_screws', 'Tornillos faltantes en la tapa'],
    ['damaged_rear_ports', 'Puertos traseros dañados'],
    ['blocked_vents', 'Rejilla / ventilación obstruida o dañada'],
    ['damaged_psu', 'Fuente de poder con daño visible']
];

const PREVENTIVE_ITEMS = [
    ['internal_cleaning', 'Limpieza interna (polvo, ventiladores, disipadores)'],
    ['external_cleaning', 'Limpieza externa (carcasa, puertos, rejillas)'],
    ['cable_check', 'Verificación de cables y conexiones'],
    ['temp_check', 'Verificación de temperatura'],
    ['disk_check', 'Verificación de disco duro / SSD'],
    ['ram_check', 'Verificación de memoria RAM'],
    ['os_update', 'Actualización de sistema operativo / drivers'],
    ['optimization', 'Optimización del sistema']
];

const CORRECTIVE_ITEMS = [
    ['diagnosis', 'Diagnóstico de falla'],
    ['hw_repair', 'Reparación de hardware'],
    ['parts_replacement', 'Reemplazo de piezas'],
    ['virus_removal', 'Eliminación de virus / malware'],
    ['system_restore', 'Restauración de sistema'],
    ['data_recovery', 'Recuperación de información']
];

const CheckboxRow = ({ checked, onChange, label }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        {label}
    </label>
);

const BoletaForm = ({ ticket, onClose, onCompleted, technicianName }) => {
    const [data, setData] = useState({
        maintenance_type: '',
        initial_equipment_status: '',
        initial_equipment_status_other: '',
        inspection: {},
        accessories: { keyboard: false, mouse: false, power_cable: false, video_cable: false, other: '', condition: 'Bueno' },
        work_preventive: [],
        work_corrective: [],
        work_other: '',
        findings: '',
        replaced_parts: [],
        final_observations: '',
        final_equipment_status: '',
        technician_signature_name: technicianName || '',
        technician_signature_date: new Date().toISOString().slice(0, 10),
        receiver_signature_name: '',
        receiver_signature_date: ''
    });

    const [newPart, setNewPart] = useState({ qty: 1, description: '', brand_model: '', serial: '' });

    const toggleInList = (arr, key) =>
        arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key];

    const addPart = () => {
        if (!newPart.description.trim()) {
            toast.error('❌ Escriba una descripción para la parte');
            return;
        }
        setData({ ...data, replaced_parts: [...data.replaced_parts, newPart] });
        setNewPart({ qty: 1, description: '', brand_model: '', serial: '' });
    };

    const removePart = (index) => {
        setData({ ...data, replaced_parts: data.replaced_parts.filter((_, i) => i !== index) });
    };

    const handleSubmit = async () => {
        if (!data.maintenance_type) {
            toast.error('❌ Seleccione el tipo de mantenimiento');
            return;
        }
        if (!data.final_equipment_status) {
            toast.error('❌ Seleccione el estado final del equipo');
            return;
        }
        try {
            await api.put(`/tickets/${ticket.id}/complete-boleta`, data);
            toast.success('✅ Boleta guardada y ticket completado');
            onCompleted();
        } catch (error) {
            toast.error('❌ Error al guardar la boleta');
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px', overflow: 'auto'
        }} onClick={onClose}>
            <div
                className="card-premium"
                style={{ maxWidth: '780px', width: '100%', maxHeight: '92vh', overflow: 'auto', padding: '28px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1B2A4A', marginBottom: '4px', borderBottom: '3px solid #D4A843', paddingBottom: '12px' }}>
                    📄 Boleta de Mantenimiento — Ticket #{ticket.ticket_number}
                </h3>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                    Complete la boleta para cerrar el ticket. Al guardar, el estado pasará a "Completado".
                </p>

                {/* Tipo de mantenimiento */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Tipo de mantenimiento</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                        {['Preventivo', 'Correctivo', 'Ambos'].map(opt => (
                            <label key={opt} style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input type="radio" name="maintenance_type" checked={data.maintenance_type === opt}
                                    onChange={() => setData({ ...data, maintenance_type: opt })} />
                                {opt}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Estado al recibir */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Estado del equipo al recibir</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {['Encendido', 'No enciende', 'Intermitente', 'Otro'].map(opt => (
                            <label key={opt} style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input type="radio" name="initial_status" checked={data.initial_equipment_status === opt}
                                    onChange={() => setData({ ...data, initial_equipment_status: opt })} />
                                {opt}
                            </label>
                        ))}
                        {data.initial_equipment_status === 'Otro' && (
                            <input type="text" className="input-premium" style={{ width: '200px' }}
                                placeholder="Especifique..."
                                value={data.initial_equipment_status_other}
                                onChange={(e) => setData({ ...data, initial_equipment_status_other: e.target.value })} />
                        )}
                    </div>
                </div>

                {/* Inspección visual */}
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Inspección visual externa</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginTop: '8px' }}>
                        {INSPECTION_ITEMS.map(([key, label]) => (
                            <CheckboxRow key={key} checked={!!data.inspection[key]} label={label}
                                onChange={() => setData({ ...data, inspection: { ...data.inspection, [key]: !data.inspection[key] } })} />
                        ))}
                    </div>
                </div>

                {/* Accesorios */}
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Accesorios recibidos</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginTop: '8px', alignItems: 'center' }}>
                        <CheckboxRow checked={data.accessories.keyboard} label="Teclado"
                            onChange={() => setData({ ...data, accessories: { ...data.accessories, keyboard: !data.accessories.keyboard } })} />
                        <CheckboxRow checked={data.accessories.mouse} label="Mouse"
                            onChange={() => setData({ ...data, accessories: { ...data.accessories, mouse: !data.accessories.mouse } })} />
                        <CheckboxRow checked={data.accessories.power_cable} label="Cable de Poder"
                            onChange={() => setData({ ...data, accessories: { ...data.accessories, power_cable: !data.accessories.power_cable } })} />
                        <CheckboxRow checked={data.accessories.video_cable} label="Cable de Video"
                            onChange={() => setData({ ...data, accessories: { ...data.accessories, video_cable: !data.accessories.video_cable } })} />
                        <input type="text" className="input-premium" placeholder="Otros accesorios"
                            value={data.accessories.other}
                            onChange={(e) => setData({ ...data, accessories: { ...data.accessories, other: e.target.value } })} />
                        <select className="input-premium" value={data.accessories.condition}
                            onChange={(e) => setData({ ...data, accessories: { ...data.accessories, condition: e.target.value } })}>
                            <option value="Bueno">Estado: Bueno</option>
                            <option value="Regular">Estado: Regular</option>
                            <option value="Malo">Estado: Malo</option>
                        </select>
                    </div>
                </div>

                {/* Detalle del trabajo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Mantenimiento preventivo</label>
                        <div style={{ marginTop: '8px' }}>
                            {PREVENTIVE_ITEMS.map(([key, label]) => (
                                <CheckboxRow key={key} checked={data.work_preventive.includes(key)} label={label}
                                    onChange={() => setData({ ...data, work_preventive: toggleInList(data.work_preventive, key) })} />
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Mantenimiento correctivo</label>
                        <div style={{ marginTop: '8px' }}>
                            {CORRECTIVE_ITEMS.map(([key, label]) => (
                                <CheckboxRow key={key} checked={data.work_corrective.includes(key)} label={label}
                                    onChange={() => setData({ ...data, work_corrective: toggleInList(data.work_corrective, key) })} />
                            ))}
                        </div>
                        <input type="text" className="input-premium" placeholder="Otro trabajo realizado..."
                            style={{ marginTop: '8px' }}
                            value={data.work_other}
                            onChange={(e) => setData({ ...data, work_other: e.target.value })} />
                    </div>
                </div>

                {/* Hallazgos */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Hallazgos / fallos detectados</label>
                    <textarea className="input-premium" rows="2" style={{ width: '100%', marginTop: '6px' }}
                        value={data.findings} onChange={(e) => setData({ ...data, findings: e.target.value })} />
                </div>

                {/* Partes reemplazadas */}
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Partes / componentes reemplazados</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '70px 2fr 1.5fr 1.5fr auto', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                        <input type="number" min="1" className="input-premium" value={newPart.qty}
                            onChange={(e) => setNewPart({ ...newPart, qty: e.target.value })} />
                        <input type="text" className="input-premium" placeholder="Descripción"
                            value={newPart.description} onChange={(e) => setNewPart({ ...newPart, description: e.target.value })} />
                        <input type="text" className="input-premium" placeholder="Marca / Modelo"
                            value={newPart.brand_model} onChange={(e) => setNewPart({ ...newPart, brand_model: e.target.value })} />
                        <input type="text" className="input-premium" placeholder="N° Serie"
                            value={newPart.serial} onChange={(e) => setNewPart({ ...newPart, serial: e.target.value })} />
                        <button type="button" className="btn-premium btn-sm" onClick={addPart}>➕</button>
                    </div>
                    {data.replaced_parts.length > 0 && (
                        <table style={{ width: '100%', fontSize: '12px', marginTop: '10px', borderCollapse: 'collapse' }}>
                            <tbody>
                                {data.replaced_parts.map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #eee' }}>{p.qty}x</td>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #eee' }}>{p.description}</td>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #eee' }}>{p.brand_model}</td>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #eee' }}>{p.serial}</td>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #eee' }}>
                                            <button type="button" onClick={() => removePart(i)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Observaciones finales */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Observaciones / recomendaciones</label>
                    <textarea className="input-premium" rows="2" style={{ width: '100%', marginTop: '6px' }}
                        value={data.final_observations} onChange={(e) => setData({ ...data, final_observations: e.target.value })} />
                </div>

                {/* Estado final */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Estado final del equipo</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {['Operativo', 'Operativo con observaciones', 'No operativo'].map(opt => (
                            <label key={opt} style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input type="radio" name="final_status" checked={data.final_equipment_status === opt}
                                    onChange={() => setData({ ...data, final_equipment_status: opt })} />
                                {opt}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Responsables */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Técnico responsable</label>
                        <input type="text" className="input-premium" style={{ marginTop: '6px' }}
                            value={data.technician_signature_name}
                            onChange={(e) => setData({ ...data, technician_signature_name: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1B2A4A' }}>Recibe conforme (nombre)</label>
                        <input type="text" className="input-premium" style={{ marginTop: '6px' }}
                            placeholder="Nombre de quien recibe el equipo"
                            value={data.receiver_signature_name}
                            onChange={(e) => setData({ ...data, receiver_signature_name: e.target.value })} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn-premium btn-premium-warning" onClick={onClose}>Cancelar</button>
                    <button className="btn-premium btn-premium-success" onClick={handleSubmit}>✅ Guardar boleta y completar</button>
                </div>
            </div>
        </div>
    );
};

export default BoletaForm;