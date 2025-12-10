import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Box, ClipboardList, Settings, AlertCircle, History, ShieldCheck, ArrowRightLeft, PieChart } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { StockTable } from './components/StockTable';
import { DataUpload } from './components/DataUpload';
import { InstallationForm } from './components/InstallationForm';
import { InstallationHistory } from './components/InstallationHistory';
import { StockAssignment } from './components/StockAssignment';
import { ExecutiveReport } from './components/ExecutiveReport'; // New Import
import { IdcSelector } from './components/IdcSelector';
import { parseStockFile, parseTechnicianFile, parseBranchFile, parseServiceConcentrate, parseCatalogExcel } from './services/parser';
import { StockItem, Technician, Branch, InstallationLog, DeviceCatalog } from './types';
import { OWNER_EXECUTOR, STOCK_OVERRIDES, DEVICE_CATALOG } from './constants';
import { read, utils } from 'xlsx';

enum Tab {
  DASHBOARD = 'Dashboard',
  INVENTORY = 'Inventario',
  ASSIGNMENT = 'Asignación',
  INSTALLATION = 'Registro Instalación',
  HISTORY = 'Historial',
  EXECUTIVE = 'Reporte Gerencial', // New Tab
  UPLOAD = 'Carga Datos'
}

// Keys for LocalStorage
const STORAGE_KEYS = {
  STOCK: 'comexa_stock',
  TECHS: 'comexa_techs',
  BRANCHES: 'comexa_branches',
  LOGS: 'comexa_logs',
  CATALOG: 'comexa_catalog'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  
  // App State with Lazy Initialization from LocalStorage
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK);
    return saved ? JSON.parse(saved) : [];
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TECHS);
    return saved ? JSON.parse(saved) : [];
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<InstallationLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : [];
  });

  // Device Catalog State (Initialized with hardcoded constants, then override with localStorage)
  const [deviceCatalog, setDeviceCatalog] = useState<DeviceCatalog>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATALOG);
    // If saved exists, use it. Otherwise use the default constant.
    return saved ? JSON.parse(saved) : DEVICE_CATALOG;
  });

  // Upload Logic State
  const [showIdcSelector, setShowIdcSelector] = useState(false);
  // Store Files instead of Content string to handle multiples later
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  // We no longer strictly need pendingUploadType for logic, but might use it for UI titles
  const [pendingUploadType, setPendingUploadType] = useState<'IDC' | 'EXECUTOR' | null>(null);
  
  // Notifications
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TECHS, JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(deviceCatalog));
  }, [deviceCatalog]);


  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotify = (msg: string, type: 'success' | 'error') => setNotification({msg, type});

  // Helper to read file content (handles xlsx conversion internally)
  const readFileContent = async (file: File): Promise<string> => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return utils.sheet_to_csv(sheet, { blankrows: true });
    } else {
      return await file.text();
    }
  };

  const handleFileUpload = async (files: File[], type: 'IDC_STOCK' | 'TECHS' | 'BRANCHES' | 'SERVICES' | 'CATALOG') => {
    try {
      showNotify(`Procesando ${files.length} archivo(s)...`, 'success');

      switch (type) {
        case 'IDC_STOCK':
          if (technicians.length === 0) {
            showNotify("Debes cargar la Lista de Técnicos antes de subir stock para poder asignar el nombre.", 'error');
            return;
          }
          // Store files and wait for Owner Selection
          setPendingUploadFiles(files);
          setPendingUploadType('IDC'); // Generic Label
          setShowIdcSelector(true);
          break;

        case 'TECHS':
          let allTechs: Technician[] = [];
          for (const file of files) {
            const content = await readFileContent(file);
            const techs = parseTechnicianFile(content);
            allTechs = [...allTechs, ...techs];
          }
          // Remove duplicates based on ID if necessary, or just replace
          setTechnicians(allTechs); 
          showNotify(`Cargados ${allTechs.length} técnicos desde ${files.length} archivos`, 'success');
          break;

        case 'BRANCHES':
          let allBranches: Branch[] = [];
          for (const file of files) {
            const content = await readFileContent(file);
            const br = parseBranchFile(content);
            // Fix IDs to be unique across multiple files
            const brWithUniqueIds = br.map((b, idx) => ({ ...b, id: `${b.id}-${idx}-${Math.random().toString(36).substr(2,5)}` }));
            allBranches = [...allBranches, ...brWithUniqueIds];
          }
          setBranches(allBranches);
          showNotify(`Cargadas ${allBranches.length} sucursales desde ${files.length} archivos`, 'success');
          break;

        case 'SERVICES':
          let allLogs: InstallationLog[] = [];
          for (const file of files) {
            const content = await readFileContent(file);
            const newLogs = parseServiceConcentrate(content);
            allLogs = [...allLogs, ...newLogs];
          }
          setLogs(prev => [...prev, ...allLogs]);
          showNotify(`Importados ${allLogs.length} registros históricos de servicios`, 'success');
          break;

        case 'CATALOG':
          if (files.length > 0) {
            // Only process the first file for Catalog as it should contain all sheets
            const catalog = await parseCatalogExcel(files[0]);
            // Merge with existing or overwrite? Let's overwrite specific keys found in file, keep others.
            setDeviceCatalog(prev => ({ ...prev, ...catalog }));
            const clientsFound = Object.keys(catalog).join(', ');
            showNotify(`Catálogo actualizado para: ${clientsFound}`, 'success');
          }
          break;
      }
    } catch (e) {
      console.error(e);
      showNotify("Error al procesar los archivos. Asegúrate de que el formato sea correcto.", 'error');
    }
  };

  const handleOwnerSelected = async (selectedName: string) => {
    if (pendingUploadFiles.length > 0) {
      try {
        let allNewItems: StockItem[] = [];
        
        // CHECK OVERRIDE: If selected name is Mauro/Angel/Alex, map to Julio
        const effectiveOwner = STOCK_OVERRIDES[selectedName] || selectedName;
        const wasRedirected = effectiveOwner !== selectedName;

        // Process each file with the selected owner (or the overridden one)
        for (const file of pendingUploadFiles) {
          const content = await readFileContent(file);
          // Parse using the effective owner (Julio if overridden)
          const items = parseStockFile(content, effectiveOwner);
          allNewItems = [...allNewItems, ...items];
        }
        
        // Logic: Remove previous stock for THIS specific owner if it exists, then add new (merged from all files)
        setStock(prev => [...prev.filter(i => i.owner !== effectiveOwner), ...allNewItems]);
        
        if (wasRedirected) {
          showNotify(`Cargados ${allNewItems.length} items. Redireccionado de ${selectedName} a ${effectiveOwner}`, 'success');
        } else {
          showNotify(`Cargados ${allNewItems.length} items para: ${effectiveOwner}`, 'success');
        }
      } catch (e) {
        showNotify("Error al procesar los archivos de stock", 'error');
      } finally {
        setPendingUploadFiles([]);
        setPendingUploadType(null);
      }
    }
  };

  // --- Logic for Manual Technician Add ---
  const handleAddTechnician = (name: string, type: 'NOMINA' | 'EJECUTOR') => {
    const normalizedName = name.trim().toUpperCase();
    
    // Check for duplicates
    if (technicians.some(t => t.name.toUpperCase() === normalizedName)) {
      showNotify(`El técnico "${normalizedName}" ya existe en la lista.`, 'error');
      return;
    }

    const newTech: Technician = {
      id: `tech-manual-${Date.now()}`,
      name: normalizedName,
      type: type
    };

    setTechnicians(prev => [...prev, newTech]);
    showNotify(`${type === 'EJECUTOR' ? 'Ejecutor' : 'Técnico'} "${normalizedName}" agregado correctamente.`, 'success');
  };
  // -------------------------------------

  const handleInstallationSave = (log: InstallationLog, newStock: StockItem[]) => {
    setLogs(prev => [log, ...prev]);
    setStock(newStock);
    showNotify("Instalación registrada y stock actualizado", 'success');
    setActiveTab(Tab.DASHBOARD);
  };

  // --- New Handlers for Stock Assignment ---
  
  // 1. Transfer Stock (Flexible Source -> Destination)
  const handleTransferStock = (sourceOwnerName: string, destOwnerName: string, itemsToTransfer: { stockId: string, quantity: number }[]) => {
    if (sourceOwnerName === destOwnerName) {
      showNotify("El origen y el destino no pueden ser el mismo.", 'error');
      return;
    }
    
    // CHECK OVERRIDE DESTINATION
    // If transferring TO Mauro, it should go TO Julio
    const finalDestOwner = STOCK_OVERRIDES[destOwnerName] || destOwnerName;

    // Warning: If source also has an override, theoretically they shouldn't have stock to transfer FROM.
    // But if they selected "Julio" as source and "Mauro" as dest, it becomes "Julio" -> "Julio", which is invalid.
    if (sourceOwnerName === finalDestOwner) {
       showNotify(`Transferencia inválida. ${destOwnerName} comparte inventario con ${sourceOwnerName}.`, 'error');
       return;
    }

    let updatedStock = [...stock];
    let transferredCount = 0;
    const logItems: { device: string; model: string; quantity: number; usageType: 'Instalación' | 'Suministro' | 'Suministro e instalación' }[] = [];

    itemsToTransfer.forEach(transfer => {
      // Find Source Item
      const sourceIndex = updatedStock.findIndex(s => s.id === transfer.stockId);
      if (sourceIndex === -1) return;

      const sourceItem = updatedStock[sourceIndex];
      // Verify owner matches source (sanity check)
      if (sourceItem.owner !== sourceOwnerName) return;

      const qty = Math.min(transfer.quantity, sourceItem.quantity);

      if (qty > 0) {
        // 1. Decrement Source
        updatedStock[sourceIndex] = { ...sourceItem, quantity: sourceItem.quantity - qty };

        // 2. Add to Destination (Using finalDestOwner)
        // Check if destination already has this exact item
        const destIndex = updatedStock.findIndex(s => 
          s.owner === finalDestOwner && 
          s.device === sourceItem.device && 
          s.model === sourceItem.model &&
          s.category === sourceItem.category
        );

        if (destIndex !== -1) {
          updatedStock[destIndex].quantity += qty;
        } else {
          updatedStock.push({
            ...sourceItem,
            id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            owner: finalDestOwner,
            quantity: qty
          });
        }
        transferredCount++;

        // Add to log list
        logItems.push({
           device: sourceItem.device,
           model: sourceItem.model,
           quantity: qty,
           usageType: 'Suministro' // Default generic type for transfers
        });
      }
    });

    // Create Log Entry
    // We log the names the user selected (e.g. Mauro), even if stock went to Julio, for transparency.
    const transferLog: InstallationLog = {
      id: `trans-log-${Date.now()}`,
      sctask: 'TRANSFERENCIA',
      reqo: 'INTERNA',
      folioComexa: '-',
      technicianName: `${sourceOwnerName} -> ${destOwnerName}`,
      reportDate: new Date().toISOString().split('T')[0],
      branchName: 'MOVIMIENTO STOCK',
      branchSirh: 'ALMACEN',
      branchRegion: 'ALMACEN CENTRAL',
      installationDate: new Date().toISOString().split('T')[0],
      itemsUsed: logItems,
      warrantyApplied: false,
      warrantyReason: 'Transferencia de Stock'
    };

    setLogs(prev => [transferLog, ...prev]);
    setStock(updatedStock);
    
    if (finalDestOwner !== destOwnerName) {
       showNotify(`Transferencia exitosa. Stock asignado a supervisor: ${finalDestOwner} (en vez de ${destOwnerName}).`, 'success');
    } else {
       showNotify(`Transferencia de ${sourceOwnerName} a ${destOwnerName} exitosa.`, 'success');
    }
    setActiveTab(Tab.INVENTORY);
  };

  // 2. Direct Add (Solicitud/Compra)
  const handleDirectAddStock = (technicianId: string, newItem: { category: string, device: string, model: string, quantity: number }) => {
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return;

    // CHECK OVERRIDE: Map tech name to supervisor if applicable
    const targetOwnerName = STOCK_OVERRIDES[tech.name] || tech.name;

    let updatedStock = [...stock];
    
    // Check if item exists for this target owner
    const existingIndex = updatedStock.findIndex(s => 
      s.owner === targetOwnerName && 
      s.device === newItem.device && 
      s.model === newItem.model && 
      s.category === newItem.category
    );

    if (existingIndex !== -1) {
      updatedStock[existingIndex].quantity += newItem.quantity;
    } else {
      updatedStock.push({
        id: `direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: newItem.category,
        device: newItem.device,
        model: newItem.model,
        quantity: newItem.quantity,
        owner: targetOwnerName
      });
    }

    // Create Log Entry
    const directLog: InstallationLog = {
      id: `direct-log-${Date.now()}`,
      sctask: 'COMPRA/SOLICITUD',
      reqo: 'EXTERNA',
      folioComexa: '-',
      technicianName: tech.name, // Keep original name in log
      reportDate: new Date().toISOString().split('T')[0],
      branchName: 'INGRESO DIRECTO',
      branchSirh: 'COMPRA',
      branchRegion: 'ADMINISTRACIÓN',
      installationDate: new Date().toISOString().split('T')[0],
      itemsUsed: [{
        device: newItem.device,
        model: newItem.model,
        quantity: newItem.quantity,
        usageType: 'Suministro'
      }],
      warrantyApplied: false,
      warrantyReason: 'Ingreso Directo / Compra'
    };

    setLogs(prev => [directLog, ...prev]);
    setStock(updatedStock);
    
    if (targetOwnerName !== tech.name) {
       showNotify(`Material agregado al stock de ${targetOwnerName} (Supervisor de ${tech.name}).`, 'success');
    } else {
       showNotify(`Agregado nuevo material a ${tech.name}.`, 'success');
    }
    setActiveTab(Tab.INVENTORY);
  };
  // -----------------------------------------

  const handleResetData = () => {
    if (window.confirm('⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\n¿Estás seguro de que quieres BORRAR TODA LA BASE DE DATOS?\n\nEsta acción eliminará permanentemente:\n- Todo el Inventario (Stock)\n- Lista de Técnicos\n- Directorio de Sucursales\n- Historial de Instalaciones\n- Catálogo de Dispositivos\n\nEsta acción NO se puede deshacer.')) {
      if (window.confirm('¿Confirmas definitivamente que deseas eliminar todos los datos y reiniciar el sistema desde cero?')) {
        localStorage.removeItem(STORAGE_KEYS.STOCK);
        localStorage.removeItem(STORAGE_KEYS.TECHS);
        localStorage.removeItem(STORAGE_KEYS.BRANCHES);
        localStorage.removeItem(STORAGE_KEYS.LOGS);
        localStorage.removeItem(STORAGE_KEYS.CATALOG);

        setStock([]);
        setTechnicians([]);
        setBranches([]);
        setLogs([]);
        setDeviceCatalog(DEVICE_CATALOG); // Reset to default hardcoded
        
        setActiveTab(Tab.DASHBOARD);
        showNotify("El sistema se ha reiniciado correctamente. Todos los datos han sido borrados.", 'success');
      }
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      stock,
      technicians,
      branches,
      logs,
      deviceCatalog
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `comexa_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotify("Respaldo descargado exitosamente.", 'success');
  };

  const handleRestoreBackup = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.stock || !Array.isArray(data.stock)) {
        throw new Error("Formato de respaldo inválido");
      }

      if (window.confirm("¿Estás seguro de restaurar este respaldo? Esto sobrescribirá los datos actuales.")) {
        setStock(data.stock || []);
        setTechnicians(data.technicians || []);
        setBranches(data.branches || []);
        setLogs(data.logs || []);
        setDeviceCatalog(data.deviceCatalog || DEVICE_CATALOG);
        showNotify("Respaldo restaurado correctamente.", 'success');
      }
    } catch (e) {
      console.error(e);
      showNotify("Error al restaurar el respaldo. El archivo podría estar dañado.", 'error');
    }
  };

  const bgImage = "https://wsrv.nl/?url=comexa.com.mx/wp-content/uploads/2023/12/photo_5136793754194258942_y.jpg&w=1920&output=webp";
  const logoImage = "https://wsrv.nl/?url=comexa.com.mx/wp-content/themes/comexa2019/images/logos/logo-1.png&h=100&output=webp";

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url('${bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#0f172a'
      }}
    >
      <div className="absolute inset-0 bg-black/10 pointer-events-none fixed z-0 print:hidden" />

      <nav className="bg-slate-900/95 text-white shadow-xl sticky top-0 z-50 border-b border-[#DDA853]/20 backdrop-blur-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="Comexa Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight leading-none text-white">CONTROL STOCK</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <button onClick={() => setActiveTab(Tab.DASHBOARD)} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === Tab.DASHBOARD ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Dashboard</button>
                <button onClick={() => setActiveTab(Tab.INVENTORY)} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === Tab.INVENTORY ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Inventario</button>
                <button onClick={() => setActiveTab(Tab.ASSIGNMENT)} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === Tab.ASSIGNMENT ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Asignación</button>
                <button onClick={() => setActiveTab(Tab.INSTALLATION)} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === Tab.INSTALLATION ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Registro Instalación</button>
                <button onClick={() => setActiveTab(Tab.HISTORY)} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === Tab.HISTORY ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Historial</button>
                <button onClick={() => setActiveTab(Tab.EXECUTIVE)} className={`px-3 py-2 rounded-md text-sm font-bold border border-[#DDA853]/50 ${activeTab === Tab.EXECUTIVE ? 'bg-[#DDA853] text-[#1A2A4F] shadow-lg' : 'text-[#DDA853] hover:bg-[#DDA853]/20'}`}>Reporte Gerencial</button>
                <button onClick={() => setActiveTab(Tab.UPLOAD)} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === Tab.UPLOAD ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Cargar Datos</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-slate-800 flex justify-around p-2 z-10 relative border-b border-slate-700 print:hidden">
         <button onClick={() => setActiveTab(Tab.DASHBOARD)} className="text-slate-300 p-2 active:text-[#DDA853]"><LayoutDashboard size={20}/></button>
         <button onClick={() => setActiveTab(Tab.INVENTORY)} className="text-slate-300 p-2 active:text-[#DDA853]"><Box size={20}/></button>
         <button onClick={() => setActiveTab(Tab.ASSIGNMENT)} className="text-slate-300 p-2 active:text-[#DDA853]"><ArrowRightLeft size={20}/></button>
         <button onClick={() => setActiveTab(Tab.INSTALLATION)} className="text-slate-300 p-2 active:text-[#DDA853]"><ClipboardList size={20}/></button>
         <button onClick={() => setActiveTab(Tab.EXECUTIVE)} className="text-[#DDA853] p-2 active:text-white"><PieChart size={20}/></button>
      </div>

      <main className="flex-grow p-4 sm:p-8 z-10 relative print:p-0 print:bg-white">
        <div className="max-w-7xl mx-auto print:w-full print:max-w-none">
          {notification && (
            <div className={`fixed top-20 right-4 px-4 py-3 rounded shadow-lg text-white flex items-center gap-2 animate-bounce z-50 ${notification.type === 'success' ? 'bg-green-600/90 backdrop-blur' : 'bg-red-600/90 backdrop-blur'} print:hidden`}>
              <AlertCircle size={20} />
              {notification.msg}
            </div>
          )}

          {activeTab === Tab.DASHBOARD && <Dashboard stock={stock} logs={logs} />}
          {activeTab === Tab.INVENTORY && <StockTable items={stock} />}
          {activeTab === Tab.ASSIGNMENT && (
             <StockAssignment 
               technicians={technicians}
               fullStock={stock} 
               onTransfer={handleTransferStock}
               onDirectAdd={handleDirectAddStock}
               deviceCatalog={deviceCatalog}
             />
          )}
          {activeTab === Tab.INSTALLATION && (
            <InstallationForm 
              technicians={technicians} 
              branches={branches} 
              stock={stock}
              onSave={handleInstallationSave}
            />
          )}
          {activeTab === Tab.HISTORY && <InstallationHistory logs={logs} />}
          {activeTab === Tab.EXECUTIVE && <ExecutiveReport logs={logs} />}
          {activeTab === Tab.UPLOAD && (
            <DataUpload 
              onFileUpload={handleFileUpload} 
              onAddTechnician={handleAddTechnician}
              onReset={handleResetData}
              onExportBackup={handleExportBackup}
              onRestoreBackup={handleRestoreBackup}
            />
          )}
        </div>
      </main>

      <IdcSelector 
        isOpen={showIdcSelector}
        onClose={() => setShowIdcSelector(false)}
        onSelect={handleOwnerSelected}
        technicians={technicians}
        title={pendingUploadType === 'EXECUTOR' ? 'Asignar Stock de Ejecutor' : 'Asignar Stock a Personal'}
      />
    </div>
  );
};

export default App;