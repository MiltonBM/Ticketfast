import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar transporter
const createTransporter = async () => {
    const settings = await getSettings();
    return nodemailer.createTransport({
        host: settings.smtp_host || 'smtp.gmail.com',
        port: settings.smtp_port || 587,
        secure: false,
        auth: {
            user: settings.smtp_user || process.env.EMAIL_USER,
            pass: settings.smtp_pass || process.env.EMAIL_PASS
        }
    });
};

// Email de nuevo ticket
export const sendTicketEmail = async (ticketData) => {
    const { ticket_number, user_name, user_department, user_email, computer_model, failure_description, failure_classification } = ticketData;

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #1B2A4A 0%, #0D1B2A 100%); }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #D4A843; }
        .ticket-number { font-size: 28px; color: #1B2A4A; font-weight: bold; }
        .status-badge { display: inline-block; padding: 5px 20px; background: #D4A843; border-radius: 20px; color: #1B2A4A; font-weight: bold; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; color: #1B2A4A; border-left: 4px solid #D4A843; padding-left: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { background: #f8f9fa; padding: 10px; border-radius: 8px; }
        .label { font-weight: bold; color: #555; display: block; font-size: 11px; text-transform: uppercase; }
        .value { font-size: 14px; color: #333; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #1B2A4A;">🎫 Nuevo Ticket de Soporte</h1>
            <div class="ticket-number">#${ticket_number}</div>
            <div class="status-badge">⏳ Pendiente</div>
            <p style="color: #888; font-size: 12px; margin-top: 5px;">${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
            <h3 class="section-title">👤 Datos del Usuario</h3>
            <div class="info-grid">
                <div class="info-item"><span class="label">Nombre</span><span class="value">${user_name}</span></div>
                <div class="info-item"><span class="label">Departamento</span><span class="value">${user_department}</span></div>
                <div class="info-item"><span class="label">Email</span><span class="value">${user_email || 'No especificado'}</span></div>
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">💻 Datos del Equipo</h3>
            <div class="info-grid">
                <div class="info-item"><span class="label">Modelo</span><span class="value">${computer_model}</span></div>
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">🔧 Detalles del Fallo</h3>
            <div class="info-grid">
                <div class="info-item"><span class="label">Clasificación</span><span class="value">${failure_classification || 'No clasificado'}</span></div>
                <div class="info-item" style="grid-column: span 2;"><span class="label">Descripción</span><span class="value">${failure_description}</span></div>
            </div>
        </div>

        <div class="footer">
            <p>Este ticket fue generado automáticamente.</p>
            <p style="font-size: 10px; color: #aaa;">© 2026 Ticketfast v3.0</p>
        </div>
    </div>
</body>
</html>
    `;

    const settings = await getSettings();
    const recipient = settings.email_recipient || process.env.EMAIL_USER;

    const transporter = await createTransporter();
    const mailOptions = {
        from: settings.smtp_user || process.env.EMAIL_USER,
        to: recipient,
        subject: `🎫 Ticket #${ticket_number} - ${user_name} - ${failure_classification || 'Solicitud'}`,
        html: htmlTemplate
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        throw error;
    }
};

// Email de bienvenida
export const sendWelcomeEmail = async (userEmail, userName, username, password) => {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #1B2A4A 0%, #0D1B2A 100%); }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #D4A843; }
        .logo { font-size: 48px; display: block; margin-bottom: 8px; }
        .credentials { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo">🎫</span>
            <h2 style="color: #1B2A4A;">¡Bienvenido a Ticketfast!</h2>
        </div>

        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente en el sistema de gestión de tickets.</p>

        <div class="credentials">
            <p><strong>👤 Usuario:</strong> ${username}</p>
            <p><strong>🔑 Contraseña:</strong> ${password}</p>
        </div>

        <p style="font-size: 13px; color: #666;">
            <strong>Recomendación:</strong> Cambia tu contraseña después de tu primer inicio de sesión.
        </p>

        <div style="text-align: center;">
            <a href="http://localhost:3000" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #1B2A4A, #0D1B2A); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                🚀 Ir a Ticketfast
            </a>
        </div>

        <div class="footer">
            <p>© 2026 Ticketfast v3.0</p>
        </div>
    </div>
</body>
</html>
    `;

    const settings = await getSettings();
    const transporter = await createTransporter();
    const mailOptions = {
        from: settings.smtp_user || process.env.EMAIL_USER,
        to: userEmail,
        subject: '🎉 ¡Bienvenido a Ticketfast! - Tus credenciales de acceso',
        html: htmlTemplate
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de bienvenida enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email de bienvenida:', error);
        throw error;
    }
};

// Email de recuperación de contraseña
export const sendPasswordResetEmail = async (userEmail, resetToken, userName) => {
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #1B2A4A 0%, #0D1B2A 100%); }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #D4A843; }
        .logo { font-size: 48px; display: block; margin-bottom: 8px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #1B2A4A, #0D1B2A); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo">🎫</span>
            <h2 style="color: #1B2A4A;">Ticketfast</h2>
            <p style="color: #666;">Recuperación de Contraseña</p>
        </div>

        <p>Hola <strong>${userName}</strong>,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>

        <div style="text-align: center;">
            <a href="${resetLink}" class="button">🔑 Restablecer Contraseña</a>
        </div>

        <p style="font-size: 13px; color: #666;">
            <strong>Importante:</strong> Este enlace expirará en 1 hora.
        </p>
        <p style="font-size: 13px; color: #666;">
            Si no solicitaste este cambio, ignora este mensaje.
        </p>

        <div class="footer">
            <p>© 2026 Ticketfast v3.0</p>
        </div>
    </div>
</body>
</html>
    `;

    const settings = await getSettings();
    const transporter = await createTransporter();
    const mailOptions = {
        from: settings.smtp_user || process.env.EMAIL_USER,
        to: userEmail,
        subject: '🔑 Recuperación de Contraseña - Ticketfast',
        html: htmlTemplate
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de recuperación enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email de recuperación:', error);
        throw error;
    }
};

// Email de cambio de contraseña
export const sendPasswordChangeEmail = async (userEmail, userName, newPassword) => {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #1B2A4A 0%, #0D1B2A 100%); }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #D4A843; }
        .logo { font-size: 48px; display: block; margin-bottom: 8px; }
        .credentials { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo">🎫</span>
            <h2 style="color: #1B2A4A;">Ticketfast</h2>
            <p style="color: #666;">Cambio de Contraseña</p>
        </div>

        <p>Hola <strong>${userName}</strong>,</p>
        <p>Has solicitado un cambio de contraseña para tu cuenta.</p>

        <div class="credentials">
            <p><strong>🔑 Nueva Contraseña:</strong> ${newPassword}</p>
        </div>

        <p style="font-size: 13px; color: #666;">
            <strong>Recomendación:</strong> Cambia esta contraseña después de iniciar sesión.
        </p>

        <div style="text-align: center;">
            <a href="http://localhost:3000" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #1B2A4A, #0D1B2A); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                🚀 Ir a Ticketfast
            </a>
        </div>

        <div class="footer">
            <p>© 2026 Ticketfast v3.0</p>
        </div>
    </div>
</body>
</html>
    `;

    const settings = await getSettings();
    const transporter = await createTransporter();
    const mailOptions = {
        from: settings.smtp_user || process.env.EMAIL_USER,
        to: userEmail,
        subject: '🔑 Cambio de Contraseña - Ticketfast',
        html: htmlTemplate
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de cambio de contraseña enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email de cambio de contraseña:', error);
        throw error;
    }
};

// Email de solicitud de cancelación
export const sendCancellationRequestEmail = async (ticket) => {
    const settings = await getSettings();
    const recipient = settings.email_recipient || process.env.EMAIL_USER;
    
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #1B2A4A 0%, #0D1B2A 100%); }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #D4A843; }
        .ticket-number { font-size: 28px; color: #1B2A4A; font-weight: bold; }
        .status-badge { display: inline-block; padding: 5px 20px; background: #FF6B6B; border-radius: 20px; color: white; font-weight: bold; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; color: #1B2A4A; border-left: 4px solid #D4A843; padding-left: 10px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #1B2A4A;">🔔 Solicitud de Cancelación</h1>
            <div class="ticket-number">#${ticket.ticket_number}</div>
            <div class="status-badge">⛔ Cancelación Solicitada</div>
        </div>

        <div class="section">
            <h3 class="section-title">👤 Usuario</h3>
            <div class="info-item">
                <strong>${ticket.user_name}</strong><br>
                ${ticket.user_department}<br>
                ${ticket.user_email || 'Sin email'}
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">💬 Razón de Cancelación</h3>
            <div class="info-item">
                ${ticket.cancellation_reason || 'El usuario no proporcionó una razón específica'}
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">💻 Equipo</h3>
            <div class="info-item">
                <strong>Modelo:</strong> ${ticket.computer_model}<br>
                <strong>Serial:</strong> ${ticket.computer_serial || 'N/A'}<br>
                <strong>SO:</strong> ${ticket.computer_os || 'N/A'}
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">📝 Descripción Original</h3>
            <div class="info-item">
                ${ticket.failure_description}
            </div>
        </div>

        <div class="footer">
            <p>El usuario ha solicitado la cancelación de este ticket.</p>
            <p style="font-size: 10px; color: #aaa;">© 2026 Ticketfast v3.0</p>
        </div>
    </div>
</body>
</html>
    `;

    const transporter = await createTransporter();
    const mailOptions = {
        from: settings.smtp_user || process.env.EMAIL_USER,
        to: recipient,
        subject: `🔔 Solicitud de Cancelación - Ticket #${ticket.ticket_number}`,
        html: htmlTemplate
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de cancelación enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email de cancelación:', error);
        throw error;
    }
};

// Email de confirmación de cancelación
export const sendCancellationConfirmationEmail = async (ticket) => {
    const settings = await getSettings();
    const recipient = ticket.user_email || settings.email_recipient || process.env.EMAIL_USER;
    
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #1B2A4A 0%, #0D1B2A 100%); }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #D4A843; }
        .ticket-number { font-size: 28px; color: #1B2A4A; font-weight: bold; }
        .status-badge { display: inline-block; padding: 5px 20px; background: #2ECC71; border-radius: 20px; color: white; font-weight: bold; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; color: #1B2A4A; border-left: 4px solid #D4A843; padding-left: 10px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #1B2A4A;">✅ Ticket Cancelado</h1>
            <div class="ticket-number">#${ticket.ticket_number}</div>
            <div class="status-badge">✅ Cancelado</div>
        </div>

        <div class="section">
            <h3 class="section-title">📋 Estado del Ticket</h3>
            <div class="info-item">
                <strong>Tu ticket ha sido cancelado exitosamente.</strong><br><br>
                <strong>Motivo:</strong> ${ticket.cancellation_reason || 'Solicitud del usuario'}<br>
                ${ticket.admin_comment ? `<strong>Comentario del Administrador:</strong> ${ticket.admin_comment}` : ''}
            </div>
        </div>

        <div class="footer">
            <p>Si necesitas ayuda adicional, no dudes en crear un nuevo ticket.</p>
            <p style="font-size: 10px; color: #aaa;">© 2026 Ticketfast v3.0</p>
        </div>
    </div>
</body>
</html>
    `;

    const transporter = await createTransporter();
    const mailOptions = {
        from: settings.smtp_user || process.env.EMAIL_USER,
        to: recipient,
        subject: `✅ Ticket #${ticket.ticket_number} Cancelado`,
        html: htmlTemplate
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de confirmación de cancelación enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email de confirmación:', error);
        throw error;
    }
};

// Obtener configuración
const getSettings = async () => {
    try {
        const { query } = await import('../database/database.js');
        const result = await query('SELECT * FROM settings WHERE id = 1');
        return result[0] || {};
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        return {};
    }
};
