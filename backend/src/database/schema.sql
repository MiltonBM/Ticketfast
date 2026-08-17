-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT,
    phone TEXT,
    role TEXT DEFAULT 'usuario',
    is_active INTEGER DEFAULT 1,
    can_report_lab_tickets INTEGER DEFAULT 0,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla de Laboratorios
CREATE TABLE IF NOT EXISTS laboratories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    location TEXT,
    responsible_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (responsible_user_id) REFERENCES users(id)
);

-- Insertar laboratorios por defecto
INSERT OR IGNORE INTO laboratories (name, description, location) 
VALUES 
    ('Lab-01', 'Laboratorio de Informática 1', 'Edificio A - 2do Piso'),
    ('Lab-02', 'Laboratorio de Informática 2', 'Edificio A - 2do Piso'),
    ('Lab-03', 'Laboratorio de Redes', 'Edificio B - 1er Piso'),
    ('Lab-04', 'Laboratorio de Mantenimiento', 'Edificio B - 2do Piso'),
    ('Lab-05', 'Laboratorio de Multimedia', 'Edificio C - 1er Piso');

-- Tabla de Hardware
CREATE TABLE IF NOT EXISTS hardware (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT UNIQUE NOT NULL,
    inventory_code TEXT UNIQUE,
    device_type TEXT NOT NULL,
    assigned_to_user INTEGER,
    assigned_to_lab INTEGER,
    assignment_type TEXT,
    assignment_date DATETIME,
    brand TEXT,
    model TEXT,
    status TEXT DEFAULT 'operative',
    purchase_date DATETIME,
    warranty_until DATETIME,
    motherboard_brand TEXT,
    motherboard_model TEXT,
    motherboard_serial TEXT,
    motherboard_max_ram TEXT,
    motherboard_max_hd TEXT,
    motherboard_max_cpu TEXT,
    motherboard_max_gpu TEXT,
    processor_brand TEXT,
    processor_family TEXT,
    processor_model TEXT,
    processor_speed TEXT,
    processor_socket TEXT,
    ram_brand TEXT,
    ram_family TEXT,
    ram_speed TEXT,
    ram_modules INTEGER,
    ram_total_capacity TEXT,
    hdd_brand TEXT,
    hdd_model TEXT,
    hdd_speed TEXT,
    hdd_capacity TEXT,
    hdd_type TEXT,
    gpu_brand TEXT,
    gpu_memory TEXT,
    gpu_capacity TEXT,
    gpu_type TEXT,
    screen_size TEXT,
    screen_resolution TEXT,
    projector_lumens TEXT,
    projector_resolution TEXT,
    projector_contrast TEXT,
    projector_lamp_hours TEXT,
    projector_lamp_life TEXT,
    projector_inputs TEXT,
    projector_keystone TEXT,
    projector_speaker_power TEXT,
    monitor_size TEXT,
    monitor_resolution TEXT,
    monitor_refresh_rate TEXT,
    monitor_panel_type TEXT,
    monitor_ports TEXT,
    monitor_stand_type TEXT,
    printer_type TEXT,
    printer_technology TEXT,
    printer_max_resolution TEXT,
    printer_speed_pages TEXT,
    printer_paper_size TEXT,
    printer_connectivity TEXT,
    printer_toner_type TEXT,
    network_ports INTEGER,
    network_speed TEXT,
    network_poe TEXT,
    network_managed TEXT,
    network_vlan_support TEXT,
    network_wifi_standard TEXT,
    network_frequency TEXT,
    network_max_speed TEXT,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_user) REFERENCES users(id),
    FOREIGN KEY (assigned_to_lab) REFERENCES laboratories(id)
);

-- Tabla de Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    hardware_id INTEGER,
    user_name TEXT NOT NULL,
    user_department TEXT NOT NULL,
    user_department_id TEXT,
    user_phone TEXT,
    user_email TEXT,
    computer_model TEXT,
    computer_serial TEXT,
    computer_os TEXT,
    failure_description TEXT NOT NULL,
    failure_classification TEXT,
    status TEXT DEFAULT 'pending',
    assigned_to TEXT,
    technician_name TEXT,
    cancellation_requested INTEGER DEFAULT 0,
    cancellation_reason TEXT,
    admin_comment TEXT,
    closed_by_admin INTEGER DEFAULT 0,
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hardware_id) REFERENCES hardware(id)
);

-- Tabla de Técnicos
CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar técnicos por defecto
INSERT OR IGNORE INTO technicians (name, specialty) VALUES 
    ('Carlos Rodríguez', 'Hardware'),
    ('María Fernández', 'Software'),
    ('José Martínez', 'Redes'),
    ('Ana González', 'Soporte General');

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_recipient TEXT,
    email_subject TEXT DEFAULT 'Nuevo Ticket de Soporte',
    company_name TEXT DEFAULT 'Ticketfast',
    smtp_host TEXT DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_pass TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario administrador por defecto (password: Admin123!)
INSERT OR IGNORE INTO users (username, password, full_name, email, role, is_active, can_report_lab_tickets) 
VALUES ('admin', 'Admin123!', 'Administrador del Sistema', 'admin@ticketfast.com', 'admin', 1, 1);

-- Insertar configuración por defecto
INSERT OR IGNORE INTO settings (email_recipient, company_name) 
VALUES ('admin@ticketfast.com', 'Ticketfast');
-- Agregar columna assigned_technician_id a tickets
ALTER TABLE tickets ADD COLUMN assigned_technician_id INTEGER;
ALTER TABLE tickets ADD COLUMN technician_comments TEXT;
ALTER TABLE tickets ADD COLUMN progress_percentage INTEGER DEFAULT 0;

-- Tabla de técnicos (ya existe, pero actualizamos)
CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    specialty TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insertar algunos técnicos de ejemplo
INSERT OR IGNORE INTO technicians (name, specialty) VALUES 
    ('Carlos Rodríguez', 'Hardware'),
    ('María Fernández', 'Software'),
    ('José Martínez', 'Redes'),
    ('Ana González', 'Soporte General');
-- Actualizar tabla de técnicos para vincular con usuarios
CREATE TABLE IF NOT EXISTS technician_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    specialty TEXT,
    certifications TEXT,
    experience_years INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Agregar columna technician_id a tickets
ALTER TABLE tickets ADD COLUMN technician_id INTEGER;
ALTER TABLE tickets ADD COLUMN technician_name TEXT;

-- Insertar técnicos de ejemplo (vinculados a usuarios existentes)
INSERT OR IGNORE INTO technician_profiles (user_id, specialty, experience_years) 
SELECT id, 'Soporte General', 2 FROM users WHERE username = 'admin' AND role = 'admin';
-- Agregar estado 'archived' a tickets
-- Los valores posibles son: pending, assigned, in_progress, completed, cancelled, archived
-- Ya existe la columna status, solo actualizamos el comentario

-- Nota: Para habilitar el estado 'archived', solo se necesita que exista en la lógica
-- No se requiere cambio en la tabla

-- Crear tabla de auditoría para trazabilidad (opcional)
CREATE TABLE IF NOT EXISTS ticket_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    user_id INTEGER,
    user_name TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);
-- Agregar campos para control de visibilidad
ALTER TABLE tickets ADD COLUMN visible_to_user INTEGER DEFAULT 1;
ALTER TABLE tickets ADD COLUMN visible_to_technician INTEGER DEFAULT 1;
ALTER TABLE tickets ADD COLUMN visible_to_admin INTEGER DEFAULT 1;
ALTER TABLE tickets ADD COLUMN deleted_by_user INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN deleted_by_technician INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN deleted_by_admin INTEGER DEFAULT 0;

-- Tabla de auditoría para trazabilidad
CREATE TABLE IF NOT EXISTS ticket_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    user_id INTEGER,
    user_name TEXT,
    user_role TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);
-- Agregar campo para guardar el estado anterior
ALTER TABLE tickets ADD COLUMN previous_status TEXT DEFAULT 'pending';
