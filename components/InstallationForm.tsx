import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StockItem, Technician, Branch, InstallationLog } from '../types';
import { Button } from './ui/Button';
import { Plus, Trash2, Save, Search, Building, MapPin, Hash, Sparkles, Loader2, FileText, Settings2, Globe, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { extractDataFromReport } from '../services/ai';
import { STOCK_OVERRIDES, CLIENTS } from '../constants';

interface InstallationFormProps {
  technicians: Technician[];
  branches: Branch[];
  stock: StockItem[];
  onSave: (log: InstallationLog, updatedStock: StockItem[]) => void;
}

interface SelectedItem {
  stockId: string;
  quantityToUse: number;
  usageType: 'Instalación' | 'Suministro' | 'Suministro e instalación';
}

export const InstallationForm: React.FC<InstallationFormProps> = ({ technicians, branches, stock, onSave }) => {
  // State for the main Client Selector
  const [selectedClientType, setSelectedClientType] = useState<string>(''); // 'BANAMEX', 'BANREGIO', 'SANTANDER'

  const [formData, setFormData] = useState({
    sctask: '',
    reqo: '',
    ticket: '', // Banregio specific
    sbo: '',    // Santander specific
    folioComexa: '', // GLOBAL CMX
    technicianId: '',
    reportDate: new Date().toISOString().split('T')[0],
    branchId: '',
    installDate: new Date().toISOString().split('T')[0],
  });

  // Warranty State
  const [warrantyApplied, setWarrantyApplied] = useState<boolean | null>(null);
  const [warrantyReason, setWarrantyReason] = useState<string>('');

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic for Branch Filtering ---
  const [branchSearch, setBranchSearch] = useState('');

  // Extract unique clients for the dropdown (in case they want to override manually)
  const uniqueClients = useMemo(() => {
    const clients = new Set(branches.map(b => b.client).filter(Boolean));
    return Array.from(clients).sort();
  }, [branches]);

  // Filter branches based on Client and SIRH/Name search
  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      // 1. Filter by Client (Driven by the top menu now)
      const matchClient = selectedClientType ? b.client === selectedClientType : true;
      
      // 2. Filter by SIRH or Name (Search text)
      const query = branchSearch.toLowerCase();
      const matchSearch = branchSearch 
        ? (b.sirh?.toLowerCase().includes(query) || b.name?.toLowerCase().includes(query)) 
        : true;

      return matchClient && matchSearch;
    });
  }, [branches, selectedClientType, branchSearch]);
  // ----------------------------------

  // Helper to determine who the stock should actually come from
  const getEffectiveStockOwner = (techId: string): string | null => {
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return null;
    
    // Check if this technician has a stock override (e.g. supervised by Julio)
    if (STOCK_OVERRIDES[tech.name]) {
      return STOCK_OVERRIDES[tech.name];
    }
    return tech.name;
  };

  // Derived state for the item selector
  const availableStock = useMemo(() => {
    const effectiveOwner = getEffectiveStockOwner(formData.technicianId);
    
    return stock.filter(s => 
      s.quantity > 0 && 
      (effectiveOwner ? (s.owner === effectiveOwner || s.owner === 'EJECUTOR') : true)
    );
  }, [stock, formData.technicianId, technicians]);
  
  const filteredStock = availableStock.filter(s => 
    s.device.toLowerCase().includes(itemSearch.toLowerCase()) || 
    s.model.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // --- AI Handler Functions ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        try {
          const data = await extractDataFromReport(base64String, mimeType);
          applyAiData(data);
        } catch (error) {
          alert("Hubo un error al procesar el reporte con IA. Por favor verifica el archivo.");
        } finally {
          setIsAnalyzing(false);
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  const applyAiData = (data: any) => {
    const updates: any = {};
    let matchedTechId = '';
    let matchedBranchId = '';

    // 1. Map simple fields
    if (data.sctask) updates.sctask = data.sctask;
    if (data.reqo) updates.reqo = data.reqo;
    if (data.folio_comexa) updates.folioComexa = data.folio_comexa;
    if (data.report_date) updates.reportDate = data.report_date;
    if (data.installation_date) updates.installDate = data.installation_date;

    // 2. Match Technician
    if (data.technician_name) {
      const tech = technicians.find(t => 
        t.name.toLowerCase().includes(data.technician_name.toLowerCase()) || 
        data.technician_name.toLowerCase().includes(t.name.toLowerCase())
      );
      if (tech) {
        matchedTechId = tech.id;
        updates.technicianId = tech.id;
      }
    }

    // 3. Match Branch & Set Client Type automatically
    if (data.branch_identifier) {
      const search = data.branch_identifier.toLowerCase();
      const branch = branches.find(b => 
        (b.sirh && b.sirh.toLowerCase().includes(search)) || 
        (b.name && b.name.toLowerCase().includes(search))
      );
      
      if (branch) {
        matchedBranchId = branch.id;
        updates.branchId = branch.id;
        setBranchSearch(branch.sirh || branch.name);
        
        // Auto-select the client type menu
        if (branch.client) {
            setSelectedClientType(branch.client);
        }
      } else {
        setBranchSearch(data.branch_identifier);
      }
    }

    // 4. Match Items
    const effectiveOwner = getEffectiveStockOwner(matchedTechId);
    const relevantStock = stock.filter(s => 
      s.owner === 'EJECUTOR' || (effectiveOwner && s.owner === effectiveOwner)
    );

    const newSelectedItems: SelectedItem[] = [];
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((aiItem: any) => {
        const aiTokens = aiItem.device_name.toLowerCase().split(' ');
        const bestMatch = relevantStock.find(stockItem => {
          const stockName = stockItem.device.toLowerCase();
          return aiTokens.some((token: string) => token.length > 3 && stockName.includes(token));
        });

        if (bestMatch) {
          if (!newSelectedItems.find(i => i.stockId === bestMatch.id)) {
            // Default mapping from AI category string to our specific types
            let mappedType: any = 'Suministro e instalación';
            if (aiItem.item_category === 'Material o refacción') mappedType = 'Suministro';
            if (aiItem.item_category === 'Equipo instalado') mappedType = 'Instalación';

            newSelectedItems.push({
              stockId: bestMatch.id,
              quantityToUse: Math.min(aiItem.quantity || 1, bestMatch.quantity),
              usageType: mappedType
            });
          }
        }
      });
    }

    setFormData(prev => ({ ...prev, ...updates }));
    if (newSelectedItems.length > 0) {
      setSelectedItems(prev => {
        const combined = [...prev];
        newSelectedItems.forEach(newItem => {
           if (!combined.find(c => c.stockId === newItem.stockId)) {
             combined.push(newItem);
           }
        });
        return combined;
      });
    }

    alert(`Análisis completado. Datos detectados.`);
  };

  const handleAddItem = (stockId: string) => {
    if (selectedItems.find(i => i.stockId === stockId)) return;
    // Default to 'Suministro e instalación' as it is the most common combo
    setSelectedItems([...selectedItems, { stockId, quantityToUse: 1, usageType: 'Suministro e instalación' }]);
  };

  const updateItemQuantity = (stockId: string, qty: number) => {
    const itemInStock = stock.find(s => s.id === stockId);
    if (!itemInStock) return;
    const max = itemInStock.quantity;
    const finalQty = Math.max(1, Math.min(qty, max));
    setSelectedItems(prev => prev.map(i => i.stockId === stockId ? { ...i, quantityToUse: finalQty } : i));
  };

  const updateItemType = (stockId: string, type: 'Instalación' | 'Suministro' | 'Suministro e instalación') => {
    setSelectedItems(prev => prev.map(i => i.stockId === stockId ? { ...i, usageType: type } : i));
  };

  const handleRemoveItem = (stockId: string) => {
    setSelectedItems(prev => prev.filter(i => i.stockId !== stockId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientType) {
      alert("Por favor selecciona el Cliente (Menú superior).");
      return;
    }

    const technician = technicians.find(t => t.id === formData.technicianId);
    const branch = branches.find(b => b.id === formData.branchId);

    if (!technician || !branch || selectedItems.length === 0) {
      alert("Por favor completa todos los campos requeridos y selecciona al menos un dispositivo.");
      return;
    }

    if (warrantyApplied === null) {
      alert("Por favor indica si aplica o no Garantía.");
      return;
    }

    if (!warrantyReason.trim()) {
      alert("Por favor escribe el motivo de la garantía (o por qué no aplica).");
      return;
    }

    // VALIDATION REMOVED FOR IDs as requested
    // Previously required CMX, SCTASK, REQO, Ticket, SBO. 
    // Now optional.

    const log: InstallationLog = {
      id: `log-${Date.now()}`,
      // Client specific fields
      sctask: selectedClientType === CLIENTS.BANAMEX ? formData.sctask : '',
      reqo: selectedClientType === CLIENTS.BANAMEX ? formData.reqo : '',
      ticket: selectedClientType === CLIENTS.BANREGIO ? formData.ticket : '',
      sbo: selectedClientType === CLIENTS.SANTANDER ? formData.sbo : '',
      // Common field
      folioComexa: formData.folioComexa,
      
      technicianName: technician.name,
      reportDate: formData.reportDate,
      branchName: branch.name,
      branchSirh: branch.sirh, 
      branchRegion: branch.region || 'SIN REGIÓN',
      installationDate: formData.installDate,

      // Warranty Data
      warrantyApplied: warrantyApplied,
      warrantyReason: warrantyReason,

      itemsUsed: selectedItems.map(si => {
        const item = stock.find(s => s.id === si.stockId)!;
        return {
          device: item.device,
          model: item.model,
          quantity: si.quantityToUse,
          usageType: si.usageType
        };
      })
    };

    // Calculate new stock
    const newStock = stock.map(s => {
      const used = selectedItems.find(si => si.stockId === s.id);
      if (used) {
        return { ...s, quantity: s.quantity - used.quantityToUse };
      }
      return s;
    });

    onSave(log, newStock);
    
    // Reset form
    setFormData({
      ...formData,
      sctask: '',
      reqo: '',
      ticket: '',
      sbo: '',
      folioComexa: ''
    });
    setWarrantyApplied(null);
    setWarrantyReason('');
    setSelectedItems([]);
  };

  const effectiveOwnerName = getEffectiveStockOwner(formData.technicianId);
  const isOverridden = effectiveOwnerName && technicianIdHasOverride(formData.technicianId);
  
  function technicianIdHasOverride(id: string) {
    const t = technicians.find(tec => tec.id === id);
    return t && STOCK_OVERRIDES[t.name];
  }

  const selectedBranch = branches.find(b => b.id === formData.branchId);

  return (
    <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-[#DDA853]/30 pb-2">
        <h2 className="text-2xl font-bold text-[#DDA853]">Registrar Instalación</h2>
        
        {/* AI Upload Section */}
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
          />
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 border-[#DDA853] text-[#DDA853] hover:bg-[#DDA853]/10"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {isAnalyzing ? "Analizando..." : "Autocompleta"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* --- CLIENT SELECTOR MENU --- */}
        <div className="bg-[#1E406A]/60 p-4 rounded-lg border border-[#DDA853]/30">
           <label className="block text-sm font-bold text-[#DDA853] mb-3 uppercase tracking-wide">
             1. Selecciona el Cliente
           </label>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[CLIENTS.BANAMEX, CLIENTS.BANREGIO, CLIENTS.SANTANDER].map(client => (
                <button
                  key={client}
                  type="button"
                  onClick={() => {
                    setSelectedClientType(client);
                    setFormData(prev => ({ ...prev, branchId: '' })); // Reset branch on change
                    setBranchSearch('');
                  }}
                  className={`
                    relative p-3 rounded-md border text-center transition-all duration-200
                    ${selectedClientType === client 
                      ? 'bg-[#DDA853] border-[#DDA853] text-[#1A2A4F] font-bold shadow-lg transform scale-105' 
                      : 'bg-[#1E406A] border-[#DDA853]/20 text-[#DDA853] hover:bg-[#1E406A]/80 hover:border-[#DDA853]/50'
                    }
                  `}
                >
                  {selectedClientType === client && (
                    <div className="absolute top-1 right-2">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                  {client}
                </button>
              ))}
           </div>
        </div>

        {/* Dynamic Fields Section */}
        {selectedClientType && (
          <div className="flex flex-wrap justify-center items-end gap-6 animate-in fade-in slide-in-from-top-2 duration-300 p-6 bg-[#1E406A]/30 rounded-lg border border-[#DDA853]/10 text-center">
            
            {/* COMMON FIELD: CMX */}
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-bold text-[#DDA853] mb-1">Folio Comexa (CMX)</label>
              <input 
                type="text" 
                placeholder="CMX012025..." 
                className="w-full sm:w-64 text-center border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] text-[#DDA853] focus:border-[#DDA853] outline-none tracking-wider font-mono" 
                value={formData.folioComexa} 
                onChange={e => setFormData({...formData, folioComexa: e.target.value})} 
              />
            </div>

            {/* Fields for BANAMEX */}
            {selectedClientType === CLIENTS.BANAMEX && (
              <>
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-[#DDA853] mb-1">SCTASK</label>
                  <input 
                    type="text" 
                    placeholder="SCTASK00..."
                    className="w-full sm:w-60 text-center border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] text-[#DDA853] focus:border-[#DDA853] outline-none tracking-wider font-mono" 
                    value={formData.sctask} 
                    onChange={e => setFormData({...formData, sctask: e.target.value})} 
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-[#DDA853] mb-1">REQO</label>
                  <input 
                    type="text" 
                    placeholder="REQ000..."
                    className="w-full sm:w-48 text-center border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] text-[#DDA853] focus:border-[#DDA853] outline-none tracking-wider font-mono" 
                    value={formData.reqo} 
                    onChange={e => setFormData({...formData, reqo: e.target.value})} 
                  />
                </div>
              </>
            )}

            {/* Fields for BANREGIO */}
            {selectedClientType === CLIENTS.BANREGIO && (
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-[#DDA853] mb-1">Ticket / Folio Cliente</label>
                <input 
                  type="text" 
                  placeholder="Ej. 465520"
                  className="w-full sm:w-40 text-center border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] text-[#DDA853] focus:border-[#DDA853] outline-none tracking-wider font-mono" 
                  value={formData.ticket} 
                  onChange={e => setFormData({...formData, ticket: e.target.value})} 
                />
              </div>
            )}

            {/* Fields for SANTANDER */}
            {selectedClientType === CLIENTS.SANTANDER && (
               <div className="w-full sm:w-auto">
                 <label className="block text-sm font-medium text-[#DDA853] mb-1">SBO</label>
                 <input 
                   type="text" 
                   placeholder="SBO017..." 
                   className="w-full sm:w-44 text-center border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] text-[#DDA853] focus:border-[#DDA853] outline-none tracking-wider font-mono" 
                   value={formData.sbo} 
                   onChange={e => setFormData({...formData, sbo: e.target.value})} 
                 />
               </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-[#DDA853]">Técnico (IDC)</label>
             <select required className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.technicianId} onChange={e => setFormData({...formData, technicianId: e.target.value})}>
               <option value="">Seleccionar...</option>
               {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             {isOverridden && (
                <p className="text-xs text-yellow-500 mt-1">
                  * El stock se descontará del inventario de: <strong>{effectiveOwnerName}</strong>
                </p>
             )}
          </div>
          
          {/* Branch Section */}
          <div className="bg-[#1E406A]/30 p-4 rounded-md border border-[#DDA853]/20 md:row-span-2">
             <label className="block text-sm font-medium text-[#DDA853] mb-2">
               {selectedClientType ? `Sucursales de ${selectedClientType}` : 'Selecciona un cliente arriba'}
             </label>
             <div className="grid grid-cols-1 gap-2">
                
                {/* SIRH Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={14} className="text-[#DDA853]/70" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Buscar SIRH o Nombre..." 
                    disabled={!selectedClientType}
                    className="w-full pl-9 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none placeholder-[#DDA853]/50 text-sm disabled:opacity-50"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                  />
                </div>

                {/* Final Selection */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={14} className="text-[#DDA853]/70" />
                  </div>
                  <select 
                    required 
                    disabled={!selectedClientType}
                    className="w-full pl-9 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none text-sm disabled:opacity-50"
                    value={formData.branchId} 
                    onChange={e => setFormData({...formData, branchId: e.target.value})}
                  >
                    <option value="">
                      {!selectedClientType 
                        ? "-- Selecciona cliente primero --" 
                        : filteredBranches.length === 0 ? "Sin resultados" : "-- Seleccionar Sucursal --"
                      }
                    </option>
                    {filteredBranches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.sirh ? `[${b.sirh}] ` : ''}{b.name}
                      </option>
                    ))}
                  </select>
                </div>
             </div>
             {selectedBranch && (
               <div className="mt-2 text-xs text-[#DDA853]/80 pl-1 space-y-1">
                 <div>Seleccionado: <strong>{selectedBranch.name}</strong></div>
                 <div className="flex items-center gap-1 text-[#8CE4FF]">
                    <Globe size={10} /> Región: {selectedBranch.region || 'NO DEFINIDA'}
                 </div>
               </div>
             )}
          </div>

          <div>
             <label className="block text-sm font-medium text-[#DDA853]">Fecha Reporte</label>
             <input required type="date" className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.reportDate} onChange={e => setFormData({...formData, reportDate: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-[#DDA853]">Fecha Instalación</label>
             <input required type="date" className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.installDate} onChange={e => setFormData({...formData, installDate: e.target.value})} />
          </div>
        </div>

        {/* Item Selection */}
        <div className="border-t border-[#DDA853]/30 pt-4">
          <h3 className="text-lg font-medium text-[#DDA853] mb-2">Dispositivos Utilizados</h3>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-[#DDA853]" size={16}/>
              <input 
                type="text" 
                placeholder={formData.technicianId ? "Buscar dispositivo en stock..." : "Selecciona un técnico primero"}
                disabled={!formData.technicianId}
                className="w-full pl-9 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none placeholder-[#DDA853]/50 disabled:opacity-50"
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto border border-[#DDA853]/30 rounded-md mb-4 bg-[#1E406A]/30 p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredStock.slice(0, 10).map(item => (
              <div key={item.id} className="flex justify-between items-center bg-[#27548A] border border-[#DDA853]/30 p-2 rounded shadow-sm hover:bg-[#27548A]/70 transition-colors">
                <div className="text-sm truncate text-[#DDA853]">
                  <span className="font-bold">{item.device}</span> ({item.model})
                  <div className="text-xs text-[#DDA853]/70">Disp: {item.quantity} | {item.owner}</div>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => handleAddItem(item.id)} disabled={selectedItems.some(i => i.stockId === item.id)}>
                  <Plus size={14} />
                </Button>
              </div>
            ))}
            {filteredStock.length === 0 && (
              <div className="text-center p-2 text-[#DDA853]/60 col-span-2">
                {formData.technicianId ? "No hay stock disponible con ese nombre." : "Selecciona un técnico para ver su stock disponible."}
              </div>
            )}
          </div>

          {/* Selected Items List */}
          {selectedItems.length > 0 && (
            <div className="bg-[#1E406A]/50 p-4 rounded-md border border-[#DDA853]/30">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-[#DDA853] mb-2 uppercase tracking-wide border-b border-[#DDA853]/20 pb-1">
                <div className="col-span-4 md:col-span-5">Dispositivo</div>
                <div className="col-span-4 md:col-span-4">Clasificación</div>
                <div className="col-span-4 md:col-span-3 text-center">Acciones</div>
              </div>

              <div className="space-y-2">
                {selectedItems.map((si) => {
                  const item = stock.find(s => s.id === si.stockId)!;
                  return (
                    <div key={si.stockId} className="grid grid-cols-12 gap-2 items-center bg-[#27548A]/80 p-2 rounded border border-[#DDA853]/30">
                       {/* Name */}
                       <div className="col-span-4 md:col-span-5 text-sm text-[#DDA853] truncate">
                         <span className="font-medium">{item.device}</span>
                         <div className="text-[#DDA853]/60 text-xs">Stock: {item.quantity}</div>
                       </div>
                       
                       {/* Classification Selector - UPDATED */}
                       <div className="col-span-4 md:col-span-4">
                         <div className="relative">
                            <Settings2 size={12} className="absolute left-2 top-2.5 text-[#DDA853]/50 pointer-events-none" />
                            <select 
                               className="w-full pl-6 border border-[#DDA853]/30 rounded p-1 text-xs bg-[#1E406A] text-[#DDA853] outline-none focus:border-[#DDA853]"
                               value={si.usageType}
                               onChange={(e) => updateItemType(si.stockId, e.target.value as any)}
                            >
                               <option value="Instalación">Instalación</option>
                               <option value="Suministro">Suministro</option>
                               <option value="Suministro e instalación">Suministro e instalación</option>
                            </select>
                         </div>
                       </div>

                       {/* Qty & Delete */}
                       <div className="col-span-4 md:col-span-3 flex items-center justify-end gap-2">
                         <input 
                           type="number" 
                           min="1" 
                           max={item.quantity} 
                           className="w-14 border border-[#DDA853]/30 rounded p-1 text-center bg-[#1E406A] text-[#DDA853] outline-none text-sm"
                           value={si.quantityToUse}
                           onChange={(e) => updateItemQuantity(si.stockId, parseInt(e.target.value))}
                         />
                         <button type="button" onClick={() => handleRemoveItem(si.stockId)} className="text-red-400 hover:text-red-300 p-1">
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* WARRANTY SECTION - COLORS SWAPPED */}
        <div className="border-t border-[#DDA853]/30 pt-6">
           <div className="flex items-center gap-2 text-lg font-bold text-[#DDA853] mb-4">
             {warrantyApplied === true ? <ShieldAlert size={24} className="text-red-500"/> : warrantyApplied === false ? <ShieldCheck size={24} className="text-green-500"/> : <ShieldCheck size={24}/>}
             <h3>¿Aplica Garantía?</h3>
           </div>
           
           <div className="flex gap-4 mb-4">
              <button 
                type="button" 
                onClick={() => setWarrantyApplied(true)}
                className={`flex-1 py-3 px-4 rounded border transition-all ${warrantyApplied === true ? 'bg-red-600/20 border-red-500 text-red-400 font-bold' : 'bg-[#1E406A]/50 border-[#DDA853]/30 text-[#DDA853]/60 hover:bg-[#DDA853]/10'}`}
              >
                SÍ APLICA
              </button>
              <button 
                type="button" 
                onClick={() => setWarrantyApplied(false)}
                className={`flex-1 py-3 px-4 rounded border transition-all ${warrantyApplied === false ? 'bg-green-600/20 border-green-500 text-green-400 font-bold' : 'bg-[#1E406A]/50 border-[#DDA853]/30 text-[#DDA853]/60 hover:bg-[#DDA853]/10'}`}
              >
                NO APLICA
              </button>
           </div>
           
           {warrantyApplied !== null && (
             <div className="animate-in fade-in slide-in-from-top-2">
               <label className="block text-sm font-medium text-[#DDA853] mb-2">
                 {warrantyApplied ? "Motivo por el cual aplica la garantía:" : "Motivo por el cual NO aplica / Comentarios:"}
               </label>
               <textarea 
                 required
                 rows={3}
                 className="w-full border border-[#DDA853]/30 rounded-md p-3 bg-[#1E406A]/50 text-[#DDA853] focus:border-[#DDA853] outline-none placeholder-[#DDA853]/30"
                 placeholder={warrantyApplied ? "Ej. Falla de fábrica en sensor..." : "Ej. Daño por vandalismo, fuera de periodo..."}
                 value={warrantyReason}
                 onChange={e => setWarrantyReason(e.target.value)}
               />
             </div>
           )}
        </div>

        <div className="flex justify-end pt-4 border-t border-[#DDA853]/30">
          <Button type="submit" variant="primary" className="flex items-center gap-2 bg-[#DDA853] hover:bg-[#DDA853]/80 text-[#1A2A4F] border-none">
            <Save size={18} /> Guardar Instalación
          </Button>
        </div>
      </form>
    </div>
  );
};