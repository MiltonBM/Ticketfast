import React from 'react';

const safeParse = (jsonStr, fallback) => {
    try {
        const parsed = JSON.parse(jsonStr);
        return parsed || fallback;
    } catch {
        return fallback;
    }
};

const Check = ({ checked, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{
            width: '14px', height: '14px', border: '1px solid #1B2A4A',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '700', flexShrink: 0
        }}>
            {checked ? '✕' : ''}
        </span>
        <span>{label}</span>
    </div>
);

const Section = ({ title, children }) => (
    <div style={{ border: '1px solid #1B2A4A', marginBottom: '10px' }}>
        <div style={{ background: '#1B2A4A', color: 'white', padding: '5px 10px', fontWeight: '700', fontSize: '12px' }}>
            {title}
        </div>
        <div style={{ padding: '10px' }}>{children}</div>
    </div>
);

const BoletaPrint = ({ ticket }) => {
    if (!ticket) return null;

    const inspection = safeParse(ticket.inspection_json, {});
    const accessories = safeParse(ticket.accessories_json, {});
    const workPreventive = safeParse(ticket.work_preventive_json, []);
    const workCorrective = safeParse(ticket.work_corrective_json, []);
    const replacedParts = safeParse(ticket.replaced_parts_json, []);

    const inspectionLabels = {
        scratches: 'Rayones / golpes en la carcasa',
        missing_cover: 'Falta de tapa frontal / bahías',
        dirty_ports: 'Puertos frontales dañados / sucios',
        missing_feet: 'Patas de goma ausentes / dañadas',
        missing_screws: 'Tornillos faltantes en la tapa',
        damaged_rear_ports: 'Puertos traseros dañados',
        blocked_vents: 'Rejilla / ventilación obstruida o dañada',
        damaged_psu: 'Fuente de poder con daño visible'
    };

    const preventiveLabels = {
        internal_cleaning: 'Limpieza interna (polvo, ventiladores, disipadores)',
        external_cleaning: 'Limpieza externa (carcasa, puertos, rejillas)',
        cable_check: 'Verificación de cables y conexiones',
        temp_check: 'Verificación de temperatura',
        disk_check: 'Verificación de disco duro / SSD',
        ram_check: 'Verificación de memoria RAM',
        os_update: 'Actualización de sistema operativo / drivers',
        optimization: 'Optimización del sistema'
    };

    const correctiveLabels = {
        diagnosis: 'Diagnóstico de falla',
        hw_repair: 'Reparación de hardware',
        parts_replacement: 'Reemplazo de piezas',
        virus_removal: 'Eliminación de virus / malware',
        system_restore: 'Restauración de sistema',
        data_recovery: 'Recuperación de información'
    };

    return (
        <div style={{
            background: 'white', color: '#1B2A4A', fontFamily: 'Arial, sans-serif',
            padding: '24px', border: '1px solid #ccc'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1B2A4A', paddingBottom: '10px', marginBottom: '14px' }}>
                <div>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>COLEGIO TÉCNICO PROFESIONAL</div>
                    <div style={{ fontSize: '18px', fontWeight: '800' }}>CARLOS LUIS FALLAS SIBAJA</div>
                    <div style={{ fontSize: '11px' }}>ALAJUELA VOCACIONAL NOCTURNO</div>
                    <div style={{ background: '#1B2A4A', color: 'white', padding: '4px 10px', marginTop: '6px', fontSize: '11px', fontWeight: '700' }}>
                        BOLETA DE MANTENIMIENTO PREVENTIVO Y CORRECTIVO — EQUIPOS DE CÓMPUTO
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <div><strong>N° Boleta:</strong> {ticket.ticket_number}</div>
                    <div><strong>Fecha:</strong> {new Date(ticket.created_at).toLocaleDateString()}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Section title="1. INFORMACIÓN GENERAL">
                    <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                        <div><strong>Solicitante:</strong> {ticket.user_name}</div>
                        <div><strong>Departamento / Área:</strong> {ticket.user_department} {ticket.user_department_id ? `(${ticket.user_department_id})` : ''}</div>
                        <div><strong>Teléfono:</strong> {ticket.user_phone || '—'}</div>
                        <div><strong>Correo:</strong> {ticket.user_email || '—'}</div>
                    </div>
                </Section>
                <Section title="2. INFORMACIÓN DEL EQUIPO">
                    <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                        <div><strong>Modelo:</strong> {ticket.computer_model}</div>
                        <div><strong>N° Serie:</strong> {ticket.computer_serial || '—'}</div>
                        <div><strong>Sistema Operativo:</strong> {ticket.computer_os || '—'}</div>
                    </div>
                </Section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Section title="3. TIPO DE MANTENIMIENTO">
                    <Check checked={ticket.maintenance_type === 'Preventivo'} label="Preventivo" />
                    <Check checked={ticket.maintenance_type === 'Correctivo'} label="Correctivo" />
                    <Check checked={ticket.maintenance_type === 'Ambos'} label="Ambos" />
                </Section>
                <Section title="4. ESTADO DEL EQUIPO AL RECIBIR">
                    <Check checked={ticket.initial_equipment_status === 'Encendido'} label="Encendido" />
                    <Check checked={ticket.initial_equipment_status === 'No enciende'} label="No enciende" />
                    <Check checked={ticket.initial_equipment_status === 'Intermitente'} label="Intermitente" />
                    <Check checked={ticket.initial_equipment_status === 'Otro'} label={`Otro: ${ticket.initial_equipment_status_other || ''}`} />
                </Section>
            </div>

            <Section title="5. INSPECCIÓN VISUAL EXTERNA">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {Object.entries(inspectionLabels).map(([key, label]) => (
                        <Check key={key} checked={!!inspection[key]} label={label} />
                    ))}
                </div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
                    <strong style={{ fontSize: '12px' }}>Accesorios recibidos:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '4px' }}>
                        <Check checked={!!accessories.keyboard} label="Teclado" />
                        <Check checked={!!accessories.mouse} label="Mouse" />
                        <Check checked={!!accessories.power_cable} label="Cable de Poder" />
                        <Check checked={!!accessories.video_cable} label="Cable de Video" />
                        <Check checked={!!accessories.other} label={`Otros: ${accessories.other || ''}`} />
                        <div style={{ fontSize: '12px' }}><strong>Estado:</strong> {accessories.condition || '—'}</div>
                    </div>
                </div>
            </Section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <Section title="MANT. PREVENTIVO">
                    {Object.entries(preventiveLabels).map(([key, label]) => (
                        <Check key={key} checked={workPreventive.includes(key)} label={label} />
                    ))}
                </Section>
                <Section title="MANT. CORRECTIVO">
                    {Object.entries(correctiveLabels).map(([key, label]) => (
                        <Check key={key} checked={workCorrective.includes(key)} label={label} />
                    ))}
                    {ticket.work_other && <div style={{ fontSize: '12px', marginTop: '4px' }}><strong>Otro:</strong> {ticket.work_other}</div>}
                </Section>
                <Section title="HALLAZGOS / FALLOS">
                    <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{ticket.findings || ticket.failure_description || '—'}</div>
                </Section>
            </div>

            <Section title="7. PARTES / COMPONENTES REEMPLAZADOS">
                {replacedParts.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#888' }}>Sin partes reemplazadas.</div>
                ) : (
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ccc', padding: '4px' }}>Cant.</th>
                                <th style={{ border: '1px solid #ccc', padding: '4px' }}>Descripción</th>
                                <th style={{ border: '1px solid #ccc', padding: '4px' }}>Marca / Modelo</th>
                                <th style={{ border: '1px solid #ccc', padding: '4px' }}>N° Serie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {replacedParts.map((p, i) => (
                                <tr key={i}>
                                    <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>{p.qty}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{p.description}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{p.brand_model}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{p.serial}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>

            <Section title="8. OBSERVACIONES / RECOMENDACIONES">
                <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{ticket.final_observations || '—'}</div>
            </Section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Section title="9. ESTADO FINAL DEL EQUIPO">
                    <Check checked={ticket.final_equipment_status === 'Operativo'} label="Operativo" />
                    <Check checked={ticket.final_equipment_status === 'Operativo con observaciones'} label="Operativo con observaciones" />
                    <Check checked={ticket.final_equipment_status === 'No operativo'} label="No operativo" />
                </Section>
                <Section title="10. RESPONSABLES">
                    <div style={{ fontSize: '11px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <strong>Técnico responsable</strong>
                            <div>Nombre: {ticket.technician_signature_name || ticket.technician_name || '—'}</div>
                            <div>Fecha: {ticket.technician_signature_date || '—'}</div>
                        </div>
                        <div>
                            <strong>Recibe conforme</strong>
                            <div>Nombre: {ticket.receiver_signature_name || '—'}</div>
                            <div>Fecha: {ticket.receiver_signature_date || '—'}</div>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default BoletaPrint;