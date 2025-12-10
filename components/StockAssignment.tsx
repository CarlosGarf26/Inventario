import React, { useState, useMemo } from 'react';
import { Technician, StockItem } from '../types';
import { Button } from './ui/Button';
import { ArrowRightLeft, PackagePlus, Search, ShoppingBag, Truck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { CATEGORIES, CLIENTS, DEVICE_CATALOG } from '../constants';

interface StockAssignmentProps {
  technicians: Technician[];
  fullStock: StockItem[]; 
  onTransfer: (sourceOwner: string, destOwner: string, items: { stockId: string, quantity: number }[]) => void;
  onDirectAdd: (technicianId: string, item: { category: string, device: string, model: string, quantity: number }) => void;
}

export const StockAssignment: React.FC<StockAssignmentProps> = ({ technicians, fullStock, onTransfer, onDirectAdd }) => {
  const [mode, setMode] = useState<'TRANSFER' | 'DIRECT'>('TRANSFER');
  
  // --- Transfer State ---
  const [sourceOwner, setSourceOwner] = useState<string>('EJECUTOR');
  const [destOwner, setDestOwner] = useState<string>('');
  const [showDestStock, setShowDestStock] = useState(false); // Toggle for destination stock
  
  const [searchSource, setSearchSource] = useState('');
  const [selectedTransferItems, setSelectedTransferItems] = useState<{ stockId: string, quantity: number }[]>([]);

  // --- Direct Add State ---
  const [directTechId, setDirectTechId] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [directItem, setDirectItem] = useState({
    category: CATEGORIES.MISCELANEOS,
    device: '',
    model: '',
    quantity: 1
  });
  const [searchDirectStock, setSearchDirectStock] = useState('');

  // Create list of all possible owners (Executor + Technicians)
  const allOwners = useMemo(() => {
    return [
      { id: 'executor', name: 'EJECUTOR' },
      ...technicians.map(t => ({ id: t.id, name: t.name }))
    ];
  }, [technicians]);

  // Extract UNIQUE device names based on the SELECTED CATEGORY and SELECTED CLIENT for autocomplete
  // This combines existing stock items + the hardcoded catalog
  const availableDeviceNames = useMemo(() => {
    // 1. Devices from existing stock (that match category)
    const stockDevices = fullStock
      .filter(item => item.category === directItem.category)
      .map(item => item.device);
    
    // 2. Devices from the specific Client Catalog (that match category)
    let catalogDevices: string[] = [];
    if (selectedClient && DEVICE_CATALOG[selectedClient]) {
       catalogDevices = DEVICE_CATALOG[selectedClient]
        .filter(d => d.category === directItem.category)
        .map(d => d.device);
    } else if (!selectedClient) {
       // If no client selected, maybe show generic or all? For now, stick to Stock.
       // Or iterate all catalogs? Let's keep it clean: require Client for Catalog, else just Stock.
    }

    // Combine and Unique
    const combined = new Set([...stockDevices, ...catalogDevices]);
    return Array.from(combined).sort();
  }, [fullStock, directItem.category, selectedClient]);

  // Helper to find model in catalog when device name changes
  const handleDeviceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    let newModel = directItem.model;

    // Try to auto-fill model from Catalog if exact match
    if (selectedClient && DEVICE_CATALOG[selectedClient]) {
      const catalogItem = DEVICE_CATALOG[selectedClient].find(
        i => i.device.toLowerCase() === newName.toLowerCase() && i.category === directItem.category
      );
      if (catalogItem) {
        newModel = catalogItem.model;
      }
    }

    setDirectItem({ ...directItem, device: newName, model: newModel });
  };

  // Filter Source Stock (Transfer)
  const filteredSourceStock = useMemo(() => {
    return fullStock.filter(s => 
      s.owner === sourceOwner &&
      s.quantity > 0 && 
      (s.device.toLowerCase().includes(searchSource.toLowerCase()) || 
       s.model.toLowerCase().includes(searchSource.toLowerCase()))
    );
  }, [fullStock, sourceOwner, searchSource]);

  // Filter Destination Stock (Transfer - Reference)
  const filteredDestStock = useMemo(() => {
    if (!destOwner) return [];
    return fullStock.filter(s => 
      s.owner === destOwner &&
      s.quantity > 0
    );
  }, [fullStock, destOwner]);

  // Filter Direct Tech Stock (Direct Add - Reference)
  const filteredDirectTechStock = useMemo(() => {
     const techName = technicians.find(t => t.id === directTechId)?.name;
     if (!techName) return [];
     return fullStock.filter(s => 
        s.owner === techName && 
        s.quantity > 0 &&
        (s.device.toLowerCase().includes(searchDirectStock.toLowerCase()) || 
         s.model.toLowerCase().includes(searchDirectStock.toLowerCase()))
     );
  }, [fullStock, directTechId, technicians, searchDirectStock]);


  // Handlers for Transfer
  const handleAddToTransfer = (item: StockItem) => {
    if (selectedTransferItems.find(i => i.stockId === item.id)) return;
    setSelectedTransferItems([...selectedTransferItems, { stockId: item.id, quantity: 1 }]);
  };

  const updateTransferQty = (stockId: string, qty: number, max: number) => {
    const safeQty = Math.max(1, Math.min(qty, max));
    setSelectedTransferItems(prev => prev.map(i => i.stockId === stockId ? { ...i, quantity: safeQty } : i));
  };

  const removeTransferItem = (stockId: string) => {
    setSelectedTransferItems(prev => prev.filter(i => i.stockId !== stockId));
  };

  const submitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceOwner || !destOwner || selectedTransferItems.length === 0) return;
    if (sourceOwner === destOwner) {
      alert("El origen y el destino no pueden ser el mismo.");
      return;
    }
    
    onTransfer(sourceOwner, destOwner, selectedTransferItems);
    
    // Reset selection only
    setSelectedTransferItems([]);
  };

  // Handlers for Direct Add
  const submitDirectAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directTechId || !directItem.device || directItem.quantity < 1) return;
    onDirectAdd(directTechId, directItem);
    // Reset inputs but keep tech selected
    setDirectItem({ category: CATEGORIES.MISCELANEOS, device: '', model: '', quantity: 1 });
  };

  // Helper to pre-fill direct add from existing stock
  const prefillDirectAdd = (stockItem: StockItem) => {
    setDirectItem({
      category: stockItem.category,
      device: stockItem.device,
      model: stockItem.model,
      quantity: 1
    });
  };

  return (
    <div className="bg-[#27548A]/85 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-[#DDA853] mb-6 flex items-center gap-2">
        <ArrowRightLeft size={28} /> Asignación de Stock
      </h2>

      {/* Mode Toggle */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('TRANSFER')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'TRANSFER' ? 'bg-[#DDA853] text-[#1A2A4F] font-bold shadow-lg' : 'bg-[#1E406A]/50 text-[#DDA853] border border-[#DDA853]/30 hover:bg-[#1E406A]'}`}
        >
          <Truck size={20} /> Transferencia de Stock (Entre IDC / Ejecutor)
        </button>
        <button
          onClick={() => setMode('DIRECT')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'DIRECT' ? 'bg-[#DDA853] text-[#1A2A4F] font-bold shadow-lg' : 'bg-[#1E406A]/50 text-[#DDA853] border border-[#DDA853]/30 hover:bg-[#1E406A]'}`}
        >
          <ShoppingBag size={20} /> Solicitud / Compra Directa
        </button>
      </div>

      {mode === 'TRANSFER' ? (
        <form onSubmit={submitTransfer} className="space-y-6 animate-in fade-in duration-300">
          
          {/* Source & Dest Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-[#1E406A]/30 p-4 rounded-lg border border-[#DDA853]/10">
             <div className="space-y-2">
                <label className="block text-sm font-medium text-[#DDA853]">Origen (Desde donde sale)</label>
                <select 
                  className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none focus:border-[#DDA853]"
                  value={sourceOwner}
                  onChange={e => {
                    setSourceOwner(e.target.value);
                    setSelectedTransferItems([]); 
                  }}
                >
                  {allOwners.map(o => <option key={`src-${o.id}`} value={o.name}>{o.name}</option>)}
                </select>
             </div>

             <div className="space-y-2">
                <label className="block text-sm font-medium text-[#DDA853]">Destino (Quien recibe)</label>
                <div className="flex gap-2">
                  <select 
                    required
                    className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none focus:border-[#DDA853]"
                    value={destOwner}
                    onChange={e => setDestOwner(e.target.value)}
                  >
                    <option value="">-- Seleccionar Destino --</option>
                    {allOwners.map(o => (
                      <option key={`dst-${o.id}`} value={o.name} disabled={o.name === sourceOwner}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  {destOwner && (
                    <button 
                      type="button" 
                      onClick={() => setShowDestStock(!showDestStock)}
                      className="p-2 bg-[#27548A] border border-[#DDA853]/30 rounded hover:bg-[#DDA853]/20 text-[#DDA853]"
                      title="Ver Inventario Destino"
                    >
                      {showDestStock ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  )}
                </div>
                
                {/* Destination Stock Preview */}
                {destOwner && showDestStock && (
                  <div className="mt-2 p-3 bg-[#1A2A4F]/80 rounded border border-[#DDA853]/20 max-h-40 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-xs font-bold text-[#DDA853] mb-2 sticky top-0 bg-[#1A2A4F] py-1 border-b border-[#DDA853]/10">
                       Inventario actual en: {destOwner}
                     </h4>
                     {filteredDestStock.length === 0 ? (
                       <p className="text-xs text-[#DDA853]/50">Inventario vacío.</p>
                     ) : (
                       <div className="space-y-1">
                         {filteredDestStock.map(item => (
                           <div key={`dest-view-${item.id}`} className="text-xs flex justify-between text-[#DDA853]/80 hover:bg-white/5 p-1 rounded">
                             <span>{item.device} ({item.model})</span>
                             <span className="font-bold">{item.quantity}</span>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Source List */}
            <div className="p-4 bg-[#1E406A]/30 rounded-lg border border-[#DDA853]/10 h-96 flex flex-col">
              <h3 className="text-[#DDA853] font-semibold mb-2 flex justify-between items-center">
                <span>Stock en: <span className="text-white">{sourceOwner}</span></span>
                <span className="text-xs font-normal opacity-70">Click para agregar</span>
              </h3>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 text-[#DDA853]/50" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar material..." 
                  className="w-full pl-8 border border-[#DDA853]/30 rounded p-1.5 bg-[#1E406A] text-[#DDA853] text-sm outline-none"
                  value={searchSource}
                  onChange={e => setSearchSource(e.target.value)}
                />
              </div>
              <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
                {filteredSourceStock.length === 0 ? (
                   <div className="text-center p-4 text-[#DDA853]/50 text-sm">No hay inventario disponible.</div>
                ) : (
                  filteredSourceStock.map(item => {
                    const isSelected = selectedTransferItems.some(i => i.stockId === item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => !isSelected && handleAddToTransfer(item)}
                        className={`p-2 rounded border text-sm cursor-pointer transition-colors ${isSelected ? 'bg-[#DDA853]/20 border-[#DDA853] opacity-50 cursor-not-allowed' : 'bg-[#27548A] border-[#DDA853]/20 hover:bg-[#27548A]/80 text-[#DDA853]'}`}
                      >
                        <div className="font-bold">{item.device}</div>
                        <div className="flex justify-between text-xs opacity-80">
                          <span>{item.model}</span>
                          <span>Disp: {item.quantity}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Selected List */}
            <div className="p-4 bg-[#1E406A]/30 rounded-lg border border-[#DDA853]/10 h-96 flex flex-col">
              <h3 className="text-[#DDA853] font-semibold mb-4">Items a Transferir</h3>
              {selectedTransferItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[#DDA853]/40 text-sm italic">
                  Selecciona items de la lista izquierda
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
                  {selectedTransferItems.map(si => {
                    const item = fullStock.find(s => s.id === si.stockId)!;
                    return (
                      <div key={si.stockId} className="p-2 rounded border bg-[#1E406A] border-[#DDA853]/30 text-[#DDA853] text-sm flex justify-between items-center">
                        <div className="overflow-hidden mr-2">
                          <div className="truncate font-medium">{item.device}</div>
                          <div className="text-xs opacity-70">{item.model}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-12 bg-[#27548A] border border-[#DDA853]/30 rounded text-center text-[#DDA853]"
                            value={si.quantity}
                            onChange={e => updateTransferQty(si.stockId, parseInt(e.target.value), item.quantity)}
                          />
                          <button type="button" onClick={() => removeTransferItem(si.stockId)} className="text-red-400 hover:text-red-300">
                             &times;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-[#DDA853]/20">
                <Button type="submit" disabled={!destOwner || selectedTransferItems.length === 0} className="w-full bg-[#DDA853] text-[#1A2A4F] font-bold">
                  Confirmar Transferencia
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Left Column: Form */}
          <form onSubmit={submitDirectAdd} className="space-y-6">
            <div className="p-6 bg-[#1E406A]/30 rounded-lg border border-[#DDA853]/10 h-full flex flex-col">
              <h3 className="text-[#DDA853] font-semibold mb-4 text-lg">Registro de Compra / Solicitud</h3>
              <p className="text-sm text-[#DDA853]/70 mb-6">
                Ingresa nuevo material directamente al inventario del técnico. Selecciona el Cliente para ver su catálogo de dispositivos.
              </p>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-[#DDA853] mb-1">Técnico Receptor (IDC)</label>
                  <select 
                    required
                    className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none focus:border-[#DDA853]"
                    value={directTechId}
                    onChange={e => {
                      setDirectTechId(e.target.value);
                      // Clear item fields when switching tech
                      setDirectItem({ category: CATEGORIES.MISCELANEOS, device: '', model: '', quantity: 1 });
                    }}
                  >
                    <option value="">-- Seleccionar IDC --</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#DDA853] mb-1">Cliente (Catálogo)</label>
                    <select 
                      className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none"
                      value={selectedClient}
                      onChange={e => {
                        setSelectedClient(e.target.value);
                        // Reset inputs on client change
                        setDirectItem({ ...directItem, device: '', model: '' });
                      }}
                    >
                      <option value="">-- General / Otro --</option>
                      {Object.values(CLIENTS).map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#DDA853] mb-1">Cantidad</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none"
                      value={directItem.quantity}
                      onChange={e => setDirectItem({...directItem, quantity: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-[#DDA853] mb-1">Categoría</label>
                    <select 
                       className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none"
                       value={directItem.category}
                       onChange={e => setDirectItem({...directItem, category: e.target.value, device: '', model: ''})}
                    >
                      {Object.values(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#DDA853] mb-1">Nombre del Dispositivo</label>
                  <input 
                    type="text"
                    required
                    list="device-suggestions"
                    placeholder="Escribe o selecciona..."
                    className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none placeholder-[#DDA853]/30"
                    value={directItem.device}
                    onChange={handleDeviceChange}
                  />
                  {/* DataList for Autocomplete */}
                  <datalist id="device-suggestions">
                    {availableDeviceNames.map((name, idx) => (
                      <option key={`dev-${idx}`} value={name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#DDA853] mb-1">Modelo (Opcional)</label>
                  <input 
                    type="text"
                    placeholder="Ej. B1A21"
                    className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 text-[#DDA853] outline-none placeholder-[#DDA853]/30"
                    value={directItem.model}
                    onChange={e => setDirectItem({...directItem, model: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button type="submit" disabled={!directTechId} className="w-full flex items-center justify-center gap-2 bg-[#DDA853] text-[#1A2A4F] font-bold">
                  <PackagePlus size={18} /> Agregar al Inventario
                </Button>
              </div>
            </div>
          </form>

          {/* Right Column: Reference Stock */}
          <div className="p-4 bg-[#1E406A]/30 rounded-lg border border-[#DDA853]/10 h-full flex flex-col">
             <h3 className="text-[#DDA853] font-semibold mb-2 flex justify-between items-center">
                <span>Inventario Actual: <span className="text-white">{technicians.find(t => t.id === directTechId)?.name || '...'}</span></span>
             </h3>
             <div className="text-xs text-[#DDA853]/60 mb-3 italic">
               Haz clic en un item para autocompletar el formulario.
             </div>

             <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 text-[#DDA853]/50" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar en su inventario..." 
                  className="w-full pl-8 border border-[#DDA853]/30 rounded p-1.5 bg-[#1E406A] text-[#DDA853] text-sm outline-none"
                  value={searchDirectStock}
                  onChange={e => setSearchDirectStock(e.target.value)}
                  disabled={!directTechId}
                />
              </div>

             <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
                {!directTechId ? (
                   <div className="text-center p-10 text-[#DDA853]/40 text-sm">Selecciona un técnico para ver su stock.</div>
                ) : filteredDirectTechStock.length === 0 ? (
                   <div className="text-center p-10 text-[#DDA853]/50 text-sm">Este técnico no tiene inventario cargado.</div>
                ) : (
                   filteredDirectTechStock.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => prefillDirectAdd(item)}
                        className="p-2 rounded border bg-[#27548A] border-[#DDA853]/20 hover:bg-[#27548A]/80 cursor-pointer group"
                      >
                         <div className="flex justify-between items-start">
                            <div className="text-sm font-bold text-[#DDA853] group-hover:text-white transition-colors">{item.device}</div>
                            <span className="bg-[#1E406A] px-2 py-0.5 rounded text-xs text-[#DDA853] font-mono">{item.quantity}</span>
                         </div>
                         <div className="flex justify-between text-xs text-[#DDA853]/70 mt-1">
                            <span>{item.model}</span>
                            <span>{item.category}</span>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};