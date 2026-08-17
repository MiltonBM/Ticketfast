import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TicketForm from './components/Tickets/TicketForm';
import TicketList from './components/Tickets/TicketList';
import HardwareForm from './components/Hardware/HardwareForm';
import HardwareList from './components/Hardware/HardwareList';

function App() {
    const [activeTab, setActiveTab] = useState('tickets');

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🏫 Colegio Técnico Profesional
                    </h1>
                    <p className="text-white/90 text-lg font-light">
                        Carlos Luis Fallas Sibaja - Alajuela Vocacional Nocturno
                    </p>
                    <p className="text-white/70 text-md mt-1">
                        Sistema de Gestión de Mantenimiento y Control de Inventario
                    </p>
                </div>

                <div className="flex justify-center gap-3 mb-8 flex-wrap">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`btn-3d ${activeTab === 'tickets' ? 'opacity-100' : 'opacity-60'}`}
                    >
                        📋 Boletas
                    </button>
                    <button
                        onClick={() => setActiveTab('nuevo-ticket')}
                        className={`btn-3d ${activeTab === 'nuevo-ticket' ? 'opacity-100' : 'opacity-60'}`}
                    >
                        ➕ Nueva Boleta
                    </button>
                    <button
                        onClick={() => setActiveTab('hardware')}
                        className={`btn-3d ${activeTab === 'hardware' ? 'opacity-100' : 'opacity-60'}`}
                    >
                        💻 Inventario
                    </button>
                    <button
                        onClick={() => setActiveTab('nuevo-hardware')}
                        className={`btn-3d ${activeTab === 'nuevo-hardware' ? 'opacity-100' : 'opacity-60'}`}
                    >
                        ➕ Agregar Equipo
                    </button>
                </div>

                <div className="mt-8">
                    {activeTab === 'tickets' && <TicketList />}
                    {activeTab === 'nuevo-ticket' && <TicketForm onTicketCreated={() => setActiveTab('tickets')} />}
                    {activeTab === 'hardware' && <HardwareList />}
                    {activeTab === 'nuevo-hardware' && <HardwareForm onHardwareCreated={() => setActiveTab('hardware')} />}
                </div>
            </div>
            <ToastContainer position="bottom-right" theme="dark" />
        </div>
    );
}

export default App;
