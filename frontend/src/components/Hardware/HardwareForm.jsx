import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const HardwareForm = ({ onHardwareCreated, editingHardware, userRole }) => {
    const [formData, setFormData] = useState({
        serial_number: '',
        inventory_code: '',
        device_type: 'PC',
        brand: '',
        model: '',
        status: 'operative',
        purchase_date: '',
        warranty_until: '',
        observations: '',
        assignment_type: 'user',
        assigned_to_user: '',
        assigned_to_lab: '',
        motherboard_brand: '',
        motherboard_model: '',
        motherboard_serial: '',
        motherboard_max_ram: '',
        motherboard_max_hd: '',
        motherboard_max_cpu: '',
        motherboard_max_gpu: '',
        processor_brand: '',
        processor_family: '',
        processor_model: '',
        processor_speed: '',
        processor_socket: '',
        ram_brand: '',
        ram_family: '',
        ram_speed: '',
        ram_modules: 1,
        ram_total_capacity: '',
        hdd_brand: '',
        hdd_model: '',
        hdd_speed: '',
        hdd_capacity: '',
        hdd_type: '',
        gpu_brand: '',
        gpu_memory: '',
        gpu_capacity: '',
        gpu_type: '',
        screen_size: '',
        screen_resolution: '',
        projector_lumens: '',
        projector_resolution: '',
        projector_contrast: '',
        projector_lamp_hours: '',
        projector_lamp_life: '',
        projector_inputs: '',
        projector_keystone: '',
        projector_speaker_power: '',
        monitor_size: '',
        monitor_resolution: '',
        monitor_refresh_rate: '',
        monitor_panel_type: '',
        monitor_ports: '',
        monitor_stand_type: '',
        printer_type: '',
        printer_technology: '',
        printer_max_resolution: '',
        printer_speed_pages: '',
        printer_paper_size: '',
        printer_connectivity: '',
        printer_toner_type: '',
        network_ports: '',
        network_speed: '',
        network_poe: '',
        network_managed: '',
        network_vlan_support: '',
        network_wifi_standard: '',
        network_frequency: '',
        network_max_speed: ''
    });

    const [users, setUsers] = useState([]);
    const [laboratories, setLaboratories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const isAdmin = userRole === 'admin';
    const isTechnician = userRole === 'tecnico';

    // ============================================
    // OPCIONES EN ESPAÑOL PARA SELECT DESPLEGABLES
    // ============================================
    const options = {
        motherboardBrands: ['ASUS', 'Gigabyte', 'MSI', 'ASRock', 'Intel', 'AMD', 'Biostar', 'ECS', 'Foxconn', 'Supermicro'],
        motherboardModels: ['Z790-A', 'Z790-E', 'B760', 'H610', 'X670E', 'B650', 'A620', 'Z690', 'B660', 'H670', 'X570', 'B550', 'A520', 'Z590', 'B560', 'H510'],
        
        maxCpuOptions: [
            'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
            'Intel Pentium', 'Intel Celeron', 'Intel Xeon',
            'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9',
            'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
            'AMD Threadripper', 'AMD Athlon', 'AMD A-Series', 'AMD Ryzen PRO',
            'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4'
        ],
        
        maxGpuOptions: [
            'NVIDIA GeForce RTX 4090', 'NVIDIA GeForce RTX 4080', 'NVIDIA GeForce RTX 4070',
            'NVIDIA GeForce RTX 4060', 'NVIDIA GeForce RTX 3050', 'NVIDIA GeForce GTX 1660',
            'NVIDIA Quadro', 'NVIDIA Tesla',
            'AMD Radeon RX 7900 XTX', 'AMD Radeon RX 7900 XT', 'AMD Radeon RX 7800 XT',
            'AMD Radeon RX 7600', 'AMD Radeon Pro', 'AMD Instinct',
            'Intel Arc A770', 'Intel Arc A750', 'Intel Arc A580', 'Intel UHD Graphics',
            'ASUS ROG Strix', 'Gigabyte AORUS', 'MSI Gaming', 'EVGA FTW'
        ],
        
        processorBrands: ['Intel', 'AMD', 'Apple', 'Qualcomm', 'ARM'],
        processorFamilies: [
            'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
            'Intel Pentium', 'Intel Celeron', 'Intel Xeon',
            'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9',
            'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
            'AMD Threadripper', 'AMD Athlon', 'AMD A-Series', 'AMD Ryzen PRO'
        ],
        processorModels: ['13700K', '13600K', '13500', '13400', '12700K', '12600K', '12400', '11700K', '10700K', '9700K', '8700K', '7800X3D', '7700X', '7600X', '7500F', '5800X', '5700X', '5600X', '7900X', '7950X', '5950X', '5900X'],
        processorSpeeds: ['1.0GHz', '1.5GHz', '2.0GHz', '2.5GHz', '3.0GHz', '3.2GHz', '3.4GHz', '3.6GHz', '3.8GHz', '4.0GHz', '4.2GHz', '4.5GHz', '4.8GHz', '5.0GHz', '5.2GHz', '5.5GHz'],
        sockets: ['LGA1200', 'LGA1700', 'LGA1151', 'LGA2066', 'AM4', 'AM5', 'sTRX4', 'sTR5', 'BGA', 'LGA1366', 'LGA2011'],
        
        ramBrands: ['Corsair', 'Kingston', 'G.Skill', 'Crucial', 'Samsung', 'HyperX', 'Team Group', 'ADATA', 'Patriot'],
        ramFamilies: ['Vengeance', 'Dominator', 'LPX', 'RGB Pro', 'Value Select', 'CMK', 'HyperX Fury', 'HyperX Beast', 'ValueRAM', 'FURY', 'Renegade', 'Trident Z', 'Ripjaws', 'Aegis', 'Flare X', 'Sniper'],
        ramSpeeds: ['2133MHz', '2400MHz', '2666MHz', '3000MHz', '3200MHz', '3600MHz', '4000MHz', '4266MHz', '4400MHz', '4800MHz', '5200MHz', '5600MHz', '6000MHz'],
        ramCapacities: ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB', '256GB'],
        ramModules: ['1', '2', '3', '4', '5', '6', '7', '8'],
        
        hddBrands: ['Seagate', 'Western Digital', 'Samsung', 'Crucial', 'Kingston', 'Toshiba', 'Hitachi', 'SanDisk', 'Intel'],
        hddModels: ['Barracuda', 'IronWolf', 'SkyHawk', 'FireCuda', 'Exos', 'Blue', 'Black', 'Red', 'Purple', 'Gold', 'Green', '970 EVO', '980 PRO', '990 PRO', '870 EVO', 'T7', 'PM9A1'],
        hddSpeeds: ['5400 RPM', '7200 RPM', '10000 RPM', '15000 RPM', 'SATA 3', 'SATA 6', 'PCIe 3.0', 'PCIe 4.0', 'PCIe 5.0'],
        hddCapacities: ['128GB', '256GB', '512GB', '1TB', '2TB', '4TB', '8TB', '12TB', '16TB', '20TB'],
        hddTypes: ['Mecánico', 'Sólido (SSD)', 'NVMe', 'M.2 SATA', 'M.2 NVMe', 'PCIe NVMe'],
        
        gpuBrands: ['NVIDIA', 'AMD', 'Intel', 'ASUS', 'Gigabyte', 'MSI', 'EVGA', 'Zotac', 'Sapphire'],
        gpuModels: ['GeForce RTX 4090', 'GeForce RTX 4080', 'GeForce RTX 4070', 'GeForce RTX 4060', 'GeForce RTX 3050', 'GeForce GTX 1660', 'Quadro', 'Tesla', 'Radeon RX 7900 XTX', 'Radeon RX 7900 XT', 'Radeon RX 7800 XT', 'Radeon RX 7600', 'Radeon Pro', 'Instinct', 'Arc A770', 'Arc A750', 'Arc A580'],
        gpuMemories: ['2GB', '4GB', '6GB', '8GB', '10GB', '12GB', '16GB', '20GB', '24GB', '32GB', '48GB'],
        gpuTypes: ['Integrada', 'Externa', 'Dedicada', 'Discreta'],
        
        monitorSizes: ['17"', '19"', '21.5"', '22"', '24"', '27"', '28"', '29"', '30"', '32"', '34"', '38"', '40"', '43"', '49"', '55"'],
        resolutions: ['1920x1080 (Full HD)', '2560x1440 (2K)', '3840x2160 (4K)', '1280x720 (HD)', '800x600 (SVGA)', '1024x768 (XGA)', '1280x800 (WXGA)'],
        projectorResolutions: ['1920x1080 (Full HD)', '1920x1200 (WUXGA)', '1280x800 (WXGA)', '1024x768 (XGA)', '800x600 (SVGA)'],
        refreshRates: ['60Hz', '75Hz', '90Hz', '120Hz', '144Hz', '165Hz', '240Hz', '360Hz'],
        panelTypes: ['IPS', 'VA', 'TN', 'OLED', 'QLED', 'Mini-LED'],
        monitorPorts: ['VGA', 'HDMI', 'DVI', 'DisplayPort', 'USB-C', 'Thunderbolt', 'HDMI 2.0', 'HDMI 2.1', 'DisplayPort 1.4', 'DisplayPort 2.0'],
        standTypes: ['Fijo', 'Ajustable', 'Giratorio', 'Pared (VESA)', 'Brazo Articulado', 'Soporte Dual'],
        
        printerTypes: ['Inyección de Tinta', 'Láser', 'Térmica', 'Matricial', 'Multifuncional', '3D', 'Plotter', 'Sublimación', 'Transferencia Térmica'],
        printerTechnologies: ['Láser', 'Inyección', 'Térmica', 'Matricial', 'Sublimación', '3D', 'Transferencia Térmica'],
        printerResolutions: ['600x600 ppp', '1200x1200 ppp', '2400x600 ppp', '4800x1200 ppp', '9600x2400 ppp'],
        printerSpeeds: ['10 ppm', '15 ppm', '20 ppm', '25 ppm', '30 ppm', '35 ppm', '40 ppm', '50 ppm', '60 ppm', '70 ppm'],
        paperSizes: ['A4', 'Carta', 'Legal', 'Oficio', 'A3', 'A5', 'B5', 'Ejecutivo'],
        connectivity: ['USB', 'WiFi', 'Ethernet', 'Bluetooth', 'NFC', 'Paralelo', 'Serial'],
        tonerTypes: ['Negro', 'Color', 'Cian', 'Magenta', 'Amarillo', 'Tóner Combo'],
        
        networkPortCount: ['4', '5', '8', '12', '16', '24', '28', '32', '48', '52'],
        networkSpeeds: ['10/100 Mbps', '10/100/1000 Mbps (Gigabit)', '2.5 Gbps', '5 Gbps', '10 Gbps', '25 Gbps', '40 Gbps', '100 Gbps'],
        poeOptions: ['No', 'Sí (802.3af)', 'Sí (802.3at)', 'Sí (802.3bt)', 'PoE+', 'PoE++'],
        managedOptions: ['No Administrado', 'Administrado', 'Smart Managed', 'Cloud Managed'],
        vlanOptions: ['No', 'Sí', '802.1Q', 'VLAN Tagging'],
        wifiStandards: ['802.11a/b/g', '802.11n (WiFi 4)', '802.11ac (WiFi 5)', '802.11ax (WiFi 6)', '802.11be (WiFi 7)', 'No WiFi'],
        frequencies: ['2.4GHz', '5GHz', '6GHz', 'Dual Band', 'Tri Band'],
        
        deviceTypes: ['PC', 'Laptop', 'Videobeam', 'Monitor', 'Impresora', 'Switch', 'Router', 'Otro'],
        statusOptions: ['Operativo', 'En Mantenimiento', 'Retirado'],
        assignmentTypes: ['Usuario', 'Laboratorio'],
        projectorLumens: ['1000', '1500', '2000', '2500', '3000', '3500', '4000', '4500', '5000', '6000', '7000', '10000'],
        projectorContrast: ['1000:1', '2000:1', '3000:1', '5000:1', '10000:1', '15000:1', '20000:1', '50000:1', '100000:1'],
        projectorLampLife: ['2000h', '2500h', '3000h', '3500h', '4000h', '4500h', '5000h', '6000h', '10000h'],
        projectorInputs: ['HDMI', 'VGA', 'DVI', 'USB', 'DisplayPort', 'HDMI + VGA', 'HDMI + USB', 'HDMI + DisplayPort', 'HDMI + VGA + USB'],
        speakerPower: ['2W', '3W', '5W', '8W', '10W', '12W', '15W', '20W'],
        
        brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Gigabyte', 'Apple', 'Samsung', 'Toshiba', 'Epson', 'BenQ', 'Optoma', 'Sony', 'Panasonic', 'ViewSonic', 'NEC', 'Sharp', 'LG', 'Brother', 'Canon', 'Xerox', 'Lexmark', 'Kyocera', 'Ricoh', 'Cisco', 'D-Link', 'Netgear', 'Ubiquiti', 'TP-Link', 'Huawei', 'Aruba', 'Juniper', 'MikroTik'],
        models: ['Latitude 7420', 'Latitude 5430', 'Latitude 3420', 'OptiPlex 7000', 'OptiPlex 5000', 'OptiPlex 3000', 'Precision 5820', 'Precision 7920', 'PowerEdge T340', 'PowerEdge R640', 'EliteBook 840', 'EliteBook 640', 'ProBook 440', 'ZBook Power', 'ThinkPad T14', 'ThinkPad T16', 'ThinkPad X1', 'ThinkCentre M70', 'ThinkCentre M90', 'Vivobook Pro', 'Zenbook', 'ROG Zephyrus', 'TUF Gaming', 'Predator Helios', 'Swift', 'Aspire', 'Crystal', 'Pavilion', 'Envy', 'Spectre', 'Omen', 'ProDesk', 'EliteDesk', 'Z2', 'Z4', 'Z6', 'Z8']
    };

    const statusMap = {
        'operative': 'Operativo',
        'maintenance': 'En Mantenimiento',
        'retired': 'Retirado'
    };

    useEffect(() => {
        loadUsers();
        loadLaboratories();
        if (editingHardware) {
            setFormData(editingHardware);
        }
    }, [editingHardware]);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadLaboratories = async () => {
        try {
            const response = await api.get('/hardware/laboratories');
            setLaboratories(response.data);
        } catch (error) {
            console.error('Error loading laboratories:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleUserSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 0) {
            const filtered = users.filter(u => 
                u.full_name.toLowerCase().includes(term.toLowerCase()) ||
                u.username.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredUsers(filtered);
            setShowUserDropdown(true);
        } else {
            setShowUserDropdown(false);
        }
    };

    const selectUser = (user) => {
        setFormData({ 
            ...formData, 
            assigned_to_user: user.id, 
            assigned_to_lab: '', 
            assignment_type: 'user' 
        });
        setSearchTerm(user.full_name);
        setShowUserDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = { ...formData };
            const statusReverseMap = {
                'Operativo': 'operative',
                'En Mantenimiento': 'maintenance',
                'Retirado': 'retired'
            };
            if (submitData.status && statusReverseMap[submitData.status]) {
                submitData.status = statusReverseMap[submitData.status];
            }
            
            const url = editingHardware ? `/hardware/${editingHardware.id}` : '/hardware';
            const method = editingHardware ? 'put' : 'post';
            await api[method](url, submitData);
            toast.success(editingHardware ? '✅ Equipo actualizado' : '✅ Equipo registrado');
            if (onHardwareCreated) onHardwareCreated();
        } catch (error) {
            toast.error(error.response?.data?.error || '❌ Error al guardar equipo');
        }
    };

    const renderSelect = (label, name, value, optionsArr, placeholder = 'Seleccionar...') => {
        if (!optionsArr || !Array.isArray(optionsArr)) {
            return (
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                        {label}
                    </label>
                    <input type="text" name={name} value={value || ''} onChange={handleChange} placeholder={placeholder} className="input-premium" />
                </div>
            );
        }
        return (
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                    {label}
                </label>
                <select name={name} value={value || ''} onChange={handleChange} className="input-premium">
                    <option value="">{placeholder}</option>
                    {optionsArr.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        );
    };

    const renderInput = (label, name, value, placeholder) => (
        <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                {label}
            </label>
            <input type="text" name={name} value={value || ''} onChange={handleChange} placeholder={placeholder} className="input-premium" />
        </div>
    );

    const renderDateInput = (label, name, value) => (
        <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                {label}
            </label>
            <input type="date" name={name} value={value || ''} onChange={handleChange} className="input-premium" />
        </div>
    );

    const renderNumberInput = (label, name, value, min, max) => (
        <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                {label}
            </label>
            <input type="number" name={name} value={value || ''} onChange={handleChange} min={min} max={max} className="input-premium" />
        </div>
    );

    const renderSpecificFields = () => {
        const type = formData.device_type;
        switch (type) {
            case 'PC': return renderPCFields();
            case 'Laptop': return renderLaptopFields();
            case 'Videobeam': return renderProjectorFields();
            case 'Monitor': return renderMonitorFields();
            case 'Impresora': return renderPrinterFields();
            case 'Switch': return renderNetworkFields();
            case 'Router': return renderNetworkFields();
            default: return null;
        }
    };

    const renderPCFields = () => (
        <>
            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                    🖥️ Tarjeta Madre
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {renderSelect('Marca', 'motherboard_brand', formData.motherboard_brand, options.motherboardBrands)}
                    {renderSelect('Modelo', 'motherboard_model', formData.motherboard_model, options.motherboardModels)}
                    {renderInput('Serial', 'motherboard_serial', formData.motherboard_serial, 'Serial de la tarjeta madre')}
                    {renderSelect('Máx. RAM', 'motherboard_max_ram', formData.motherboard_max_ram, options.ramCapacities)}
                    {renderSelect('Máx. Disco', 'motherboard_max_hd', formData.motherboard_max_hd, options.hddCapacities)}
                    {renderSelect('Máx. CPU', 'motherboard_max_cpu', formData.motherboard_max_cpu, options.maxCpuOptions)}
                    {renderSelect('Máx. GPU', 'motherboard_max_gpu', formData.motherboard_max_gpu, options.maxGpuOptions)}
                </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                    ⚡ Procesador
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {renderSelect('Marca', 'processor_brand', formData.processor_brand, options.processorBrands)}
                    {renderSelect('Familia', 'processor_family', formData.processor_family, options.processorFamilies)}
                    {renderSelect('Modelo', 'processor_model', formData.processor_model, options.processorModels)}
                    {renderSelect('Velocidad', 'processor_speed', formData.processor_speed, options.processorSpeeds)}
                    {renderSelect('Socket', 'processor_socket', formData.processor_socket, options.sockets)}
                </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                    🧠 Memoria RAM
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {renderSelect('Marca', 'ram_brand', formData.ram_brand, options.ramBrands)}
                    {renderSelect('Familia', 'ram_family', formData.ram_family, options.ramFamilies)}
                    {renderSelect('Velocidad', 'ram_speed', formData.ram_speed, options.ramSpeeds)}
                    {renderNumberInput('Módulos', 'ram_modules', formData.ram_modules, 1, 8)}
                    {renderSelect('Capacidad Total', 'ram_total_capacity', formData.ram_total_capacity, options.ramCapacities)}
                </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                    💾 Disco Duro / SSD
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {renderSelect('Marca', 'hdd_brand', formData.hdd_brand, options.hddBrands)}
                    {renderSelect('Modelo', 'hdd_model', formData.hdd_model, options.hddModels)}
                    {renderSelect('Velocidad', 'hdd_speed', formData.hdd_speed, options.hddSpeeds)}
                    {renderSelect('Capacidad', 'hdd_capacity', formData.hdd_capacity, options.hddCapacities)}
                    {renderSelect('Tipo', 'hdd_type', formData.hdd_type, options.hddTypes)}
                </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                    🎮 GPU / Tarjeta Gráfica
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {renderSelect('Marca', 'gpu_brand', formData.gpu_brand, options.gpuBrands)}
                    {renderSelect('Modelo', 'gpu_capacity', formData.gpu_capacity, options.gpuModels)}
                    {renderSelect('Memoria', 'gpu_memory', formData.gpu_memory, options.gpuMemories)}
                    {renderSelect('Tipo', 'gpu_type', formData.gpu_type, options.gpuTypes)}
                </div>
            </div>
        </>
    );

    const renderLaptopFields = () => (
        <>
            {renderPCFields()}
            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                    🖥️ Pantalla
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {renderSelect('Tamaño', 'screen_size', formData.screen_size, options.monitorSizes)}
                    {renderSelect('Resolución', 'screen_resolution', formData.screen_resolution, options.resolutions)}
                </div>
            </div>
        </>
    );

    const renderProjectorFields = () => (
        <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                📽️ Especificaciones del Proyector
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {renderSelect('Lúmenes', 'projector_lumens', formData.projector_lumens, options.projectorLumens)}
                {renderSelect('Resolución', 'projector_resolution', formData.projector_resolution, options.projectorResolutions)}
                {renderSelect('Contraste', 'projector_contrast', formData.projector_contrast, options.projectorContrast)}
                {renderInput('Horas de Lámpara', 'projector_lamp_hours', formData.projector_lamp_hours, 'Horas de uso de la lámpara')}
                {renderSelect('Vida útil lámpara', 'projector_lamp_life', formData.projector_lamp_life, options.projectorLampLife)}
                {renderSelect('Entradas', 'projector_inputs', formData.projector_inputs, options.projectorInputs)}
                {renderInput('Corrección Keystone', 'projector_keystone', formData.projector_keystone, 'Ej: ±30°, ±40°')}
                {renderSelect('Potencia Altavoz', 'projector_speaker_power', formData.projector_speaker_power, options.speakerPower)}
            </div>
        </div>
    );

    const renderMonitorFields = () => (
        <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                🖥️ Especificaciones del Monitor
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {renderSelect('Tamaño', 'monitor_size', formData.monitor_size, options.monitorSizes)}
                {renderSelect('Resolución', 'monitor_resolution', formData.monitor_resolution, options.resolutions)}
                {renderSelect('Frecuencia', 'monitor_refresh_rate', formData.monitor_refresh_rate, options.refreshRates)}
                {renderSelect('Panel', 'monitor_panel_type', formData.monitor_panel_type, options.panelTypes)}
                {renderSelect('Puertos', 'monitor_ports', formData.monitor_ports, options.monitorPorts)}
                {renderSelect('Tipo de Soporte', 'monitor_stand_type', formData.monitor_stand_type, options.standTypes)}
            </div>
        </div>
    );

    const renderPrinterFields = () => (
        <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                🖨️ Especificaciones de la Impresora
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {renderSelect('Tipo', 'printer_type', formData.printer_type, options.printerTypes)}
                {renderSelect('Tecnología', 'printer_technology', formData.printer_technology, options.printerTechnologies)}
                {renderSelect('Resolución', 'printer_max_resolution', formData.printer_max_resolution, options.printerResolutions)}
                {renderSelect('Velocidad', 'printer_speed_pages', formData.printer_speed_pages, options.printerSpeeds)}
                {renderSelect('Tamaño de Papel', 'printer_paper_size', formData.printer_paper_size, options.paperSizes)}
                {renderSelect('Conectividad', 'printer_connectivity', formData.printer_connectivity, options.connectivity)}
                {renderSelect('Tipo de Tóner', 'printer_toner_type', formData.printer_toner_type, options.tonerTypes)}
            </div>
        </div>
    );

    const renderNetworkFields = () => (
        <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                🌐 Especificaciones de Red
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {renderSelect('Puertos', 'network_ports', formData.network_ports, options.networkPortCount)}
                {renderSelect('Velocidad', 'network_speed', formData.network_speed, options.networkSpeeds)}
                {renderSelect('PoE', 'network_poe', formData.network_poe, options.poeOptions)}
                {renderSelect('Administrado', 'network_managed', formData.network_managed, options.managedOptions)}
                {renderSelect('VLAN', 'network_vlan_support', formData.network_vlan_support, options.vlanOptions)}
                {renderSelect('WiFi', 'network_wifi_standard', formData.network_wifi_standard, options.wifiStandards)}
                {renderSelect('Frecuencia', 'network_frequency', formData.network_frequency, options.frequencies)}
                {renderInput('Velocidad Máx.', 'network_max_speed', formData.network_max_speed, 'Ej: 10 Gbps, 25 Gbps')}
            </div>
        </div>
    );

    return (
        <div className="card-premium" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                background: 'linear-gradient(135deg, #1B2A4A, #0D1B2A)',
                padding: '20px 24px',
                borderRadius: '12px 12px 0 0',
                margin: '-24px -24px 24px -24px',
                color: 'white',
                borderBottom: '4px solid #D4A843'
            }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700' }}>{editingHardware ? '✏️ Editar Equipo' : '💻 Registrar Equipo'}</h2>
                <p style={{ fontSize: '13px', opacity: 0.8 }}>
                    {isTechnician 
                        ? 'Como técnico, puedes registrar equipos en el inventario. La asignación de usuarios la realizará el administrador.'
                        : 'Todos los campos tienen listas desplegables'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Tipo de Equipo y Estado */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {renderSelect('Tipo de Equipo', 'device_type', formData.device_type, options.deviceTypes)}
                    {renderSelect('Estado', 'status', formData.status, ['Operativo', 'En Mantenimiento', 'Retirado'])}
                </div>

                {/* Mensaje para técnicos */}
                {isTechnician && (
                    <div style={{ padding: '12px 16px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1976D2', marginBottom: '20px' }}>
                        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
                            ℹ️ <strong>Información para Técnicos:</strong> Puedes registrar equipos en el inventario. 
                            La asignación de usuarios la realizará el administrador.
                        </p>
                    </div>
                )}

                {/* ============================================ */}
                {/* ASIGNACIÓN - CORREGIDA */}
                {/* ============================================ */}
                {!isTechnician && (
                    <div style={{ 
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        marginBottom: '20px'
                    }}>
                        <h4 style={{ 
                            fontSize: '15px', 
                            fontWeight: '700', 
                            color: '#1B2A4A', 
                            marginBottom: '16px',
                            borderBottom: '2px solid #D4A843',
                            paddingBottom: '8px'
                        }}>
                            👤 Asignación
                        </h4>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                            gap: '16px'
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                    Tipo de Asignación
                                </label>
                                <select 
                                    name="assignment_type" 
                                    value={formData.assignment_type || 'user'} 
                                    onChange={handleChange} 
                                    className="input-premium"
                                >
                                    <option value="user">👤 Usuario</option>
                                    <option value="laboratory">🏫 Laboratorio</option>
                                </select>
                            </div>
                            
                            {formData.assignment_type === 'user' ? (
                                <div style={{ position: 'relative', marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                        Buscar Usuario
                                    </label>
                                    <input 
                                        type="text" 
                                        value={searchTerm} 
                                        onChange={handleUserSearch} 
                                        onFocus={() => searchTerm.length > 0 && setShowUserDropdown(true)} 
                                        placeholder="Escribe el nombre del usuario..." 
                                        className="input-premium" 
                                    />
                                    {showUserDropdown && filteredUsers.length > 0 && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: '100%', 
                                            left: 0, 
                                            right: 0, 
                                            background: 'white', 
                                            border: '1px solid #ddd', 
                                            borderRadius: '8px', 
                                            maxHeight: '200px', 
                                            overflowY: 'auto', 
                                            zIndex: 1000, 
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.15)' 
                                        }}>
                                            {filteredUsers.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    onClick={() => selectUser(user)} 
                                                    style={{ 
                                                        padding: '10px 15px', 
                                                        cursor: 'pointer', 
                                                        borderBottom: '1px solid #f0f0f0' 
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <strong>{user.full_name}</strong> 
                                                    <span style={{ fontSize: '12px', color: '#999' }}>@{user.username}</span>
                                                    <br />
                                                    <span style={{ fontSize: '11px', color: '#aaa' }}>{user.department || 'Sin departamento'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formData.assigned_to_user && (
                                        <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px' }}>
                                            ✅ Usuario: {users.find(u => u.id === parseInt(formData.assigned_to_user))?.full_name}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px' }}>
                                        Laboratorio
                                    </label>
                                    <select 
                                        name="assigned_to_lab" 
                                        value={formData.assigned_to_lab || ''} 
                                        onChange={handleChange} 
                                        className="input-premium"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {laboratories.map(lab => (
                                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Información General */}
                <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A4A', marginBottom: '16px', borderBottom: '2px solid #D4A843', paddingBottom: '8px' }}>
                        ℹ️ Información General
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                        {renderInput('Serial / Inventario', 'serial_number', formData.serial_number, 'Serial único del equipo')}
                        {renderInput('Código de Inventario', 'inventory_code', formData.inventory_code, 'Código interno de inventario')}
                        {renderSelect('Marca', 'brand', formData.brand, options.brands)}
                        {renderSelect('Modelo', 'model', formData.model, options.models)}
                        {renderDateInput('Fecha de Compra', 'purchase_date', formData.purchase_date)}
                        {renderDateInput('Garantía hasta', 'warranty_until', formData.warranty_until)}
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        {renderInput('Observaciones', 'observations', formData.observations, 'Notas adicionales sobre el equipo')}
                    </div>
                </div>

                {/* Campos específicos */}
                {renderSpecificFields()}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button type="submit" className="btn-premium">
                        {editingHardware ? '💾 Actualizar Equipo' : '💾 Guardar Equipo'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HardwareForm;
