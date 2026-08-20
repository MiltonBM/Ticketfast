import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import UserManagement from './components/UserManagement';
import TicketForm from './components/Tickets/TicketForm';
import TicketList from './components/Tickets/TicketList';
import KanbanBoard from './components/Tickets/KanbanBoard';
import HardwareForm from './components/Hardware/HardwareForm';
import HardwareList from './components/Hardware/HardwareList';

function App() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('kanban');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            setCurrentDateTime(now.toLocaleDateString('es-ES', options));
        };
        
        updateDateTime();
        const interval = setInterval(updateDateTime, 60000);
        
        return () => clearInterval(interval);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    const getUserDisplayName = () => {
        if (user.role === 'admin') return '🛡️ Administrador';
        if (user.role === 'tecnico') return '👨‍🔧 Técnico';
        return '👤 Usuario';
    };

    if (user.role === 'usuario') {
        return (
            <>
                <div style={{
                    background: 'linear-gradient(135deg, #1B2A4A, #0D1B2A)',
                    padding: '12px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '3px solid #D4A843',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>Ticketfast</span>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        color: 'white',
                        fontSize: '14px',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end'
                    }}>
                        <span style={{ opacity: 0.8 }}>
                            👋 Bienvenido, <strong>{user.full_name || user.username}</strong>
                        </span>
                        <span style={{ opacity: 0.6, fontSize: '12px' }}>
                            {getUserDisplayName()}
                        </span>
                        <span style={{ opacity: 0.6, fontSize: '12px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
                            📅 {currentDateTime}
                        </span>
                    </div>
                </div>
                <div className="main-content" style={{ marginLeft: '0', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                    <UserDashboard user={user} onLogout={handleLogout} />
                    <ToastContainer position="bottom-right" theme="dark" />
                </div>
            </>
        );
    }

    // MENÚ PARA ADMINISTRADORES Y TÉCNICOS
    const menuItems = user.role === 'admin' 
        ? [
            { id: 'kanban', icon: '📊', label: 'Kanban' },
            { id: 'tickets', icon: '📋', label: 'Lista de Tickets' },
            { id: 'usuarios', icon: '👥', label: 'Usuarios' },
            { id: 'hardware', icon: '💻', label: 'Inventario' },
            { id: 'nuevo-hardware', icon: '🖥️', label: 'Agregar Equipo' },
        ]
        : [
            { id: 'kanban', icon: '📊', label: 'Kanban' },
            { id: 'tickets', icon: '📋', label: 'Lista de Tickets' },
            { id: 'hardware', icon: '💻', label: 'Inventario' },
            { id: 'nuevo-hardware', icon: '🖥️', label: 'Agregar Equipo' },
        ];

    return (
        <div>
            {/* Header superior */}
            <div style={{
                background: 'linear-gradient(135deg, #1B2A4A, #0D1B2A)',
                padding: '10px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '3px solid #D4A843',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                minHeight: '50px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>Ticketfast</span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    color: 'white',
                    fontSize: '13px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end'
                }}>
                    <span style={{ opacity: 0.8 }}>
                        👋 Bienvenido, <strong>{user.full_name || user.username}</strong>
                    </span>
                    <span style={{ opacity: 0.5, fontSize: '11px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '12px' }}>
                        📅 {currentDateTime}
                    </span>
                </div>
            </div>

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header" style={{ 
                    textAlign: 'center', 
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    paddingBottom: '16px',
                    marginBottom: '16px'
                }}>
                    <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #D4A843, #F5D78C)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0
                    }}>
                        Ticketfast
                    </h2>
                    <p style={{ 
                        fontSize: '12px', 
                        color: 'rgba(255,255,255,0.4)',
                        margin: '4px 0 0 0'
                    }}>
                        {user.role === 'admin' ? '🛡️ Administrador' : '👨‍🔧 Técnico'}
                    </p>
                </div>

                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={activeTab === item.id ? 'active' : ''}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 14px',
                                border: 'none',
                                borderRadius: '8px',
                                background: activeTab === item.id ? 'linear-gradient(135deg, #D4A843, #B8922E)' : 'transparent',
                                color: activeTab === item.id ? '#1B2A4A' : 'rgba(255,255,255,0.6)',
                                fontSize: '13px',
                                fontWeight: activeTab === item.id ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        style={{
                            marginTop: '16px',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            paddingTop: '16px',
                            color: 'rgba(255,255,255,0.3)',
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            border: 'none',
                            borderRadius: '8px',
                            background: 'transparent',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>🚪</span>
                        Cerrar Sesión
                    </button>
                </nav>

                <div className="sidebar-footer" style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.2)'
                }}>
                    <p style={{ margin: 0 }}>© 2026 Ticketfast</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '9px', opacity: 0.6 }}>v3.0</p>
                </div>
            </aside>

            {/* Overlay para móvil */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 40,
                        display: 'block'
                    }}
                />
            )}

            {/* Main Content */}
            <div className="main-content">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="btn-premium"
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 30,
                        display: 'none',
                        borderRadius: '50%',
                        width: '56px',
                        height: '56px',
                        padding: '0',
                        fontSize: '24px',
                        boxShadow: '0 8px 30px rgba(27,42,74,0.4)'
                    }}
                    id="menuToggle"
                >
                    ☰
                </button>

                {activeTab === 'kanban' && <KanbanBoard onStatsUpdate={() => {}} userRole={user.role} />}
                {activeTab === 'tickets' && <TicketList onStatsUpdate={() => {}} userRole={user.role} />}
                {activeTab === 'usuarios' && <UserManagement />}
                {activeTab === 'hardware' && <HardwareList onStatsUpdate={() => {}} userRole={user.role} />}
                {activeTab === 'nuevo-hardware' && <HardwareForm onHardwareCreated={() => setActiveTab('hardware')} userRole={user.role} />}
            </div>

            <ToastContainer position="bottom-right" theme="dark" />
        </div>
    );
}

export default App;
