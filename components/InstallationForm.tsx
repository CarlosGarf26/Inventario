import React, { useState, useMemo, useRef } from 'react';
import { StockItem, Technician, Branch, InstallationLog } from '../types';
import { Button } from './ui/Button';
import { Plus, Trash2, Save, Search, Building, MapPin, Hash, Sparkles, Upload, Loader2, FileText, Settings2, Globe } from 'lucide-react';
import { extractDataFromReport } from '../services/ai';
import { STOCK_OVERRIDES } from '../constants';

interface InstallationFormProps {
  technicians: Technician[];
  branches: Branch[];
  stock: StockItem[];
  onSave: (log: InstallationLog, updatedStock: StockItem[]) => void;
}

interface SelectedItem {
  stockId: string;
  quantityToUse: number;
  usageType: 'Material o refacción' | 'Equipo instalado';
}

export const InstallationForm: React.FC<InstallationFormProps> = ({ technicians, branches, stock, onSave }) => {
  const [formData, setFormData] = useState({
    sctask: '',
    reqo: '',
    folioComexa: '', // Nuevo campo
    technicianId: '',
    reportDate: new Date().toISOString().split('T')[0],
    branchId: '',
    installDate: new Date().toISOString().split('T')[0],
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic for Branch Filtering ---
  const [clientFilter, setClientFilter] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  // Extract unique clients for the dropdown
  const uniqueClients = useMemo(() => {
    const clients = new Set(branches.map(b => b.client).filter(Boolean));
    return Array.from(clients).sort();
  }, [branches]);

  // Filter branches based on Client and SIRH/Name search
  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      // 1. Filter by Client
      const matchClient = clientFilter ? b.client === clientFilter : true;
      
      // 2. Filter by SIRH or Name (Search text)
      const query = branchSearch.toLowerCase();
      const matchSearch = branchSearch 
        ? (b.sirh?.toLowerCase().includes(query) || b.name?.toLowerCase().includes(query)) 
        : true;

      return matchClient && matchSearch;
    });
  }, [branches, clientFilter, branchSearch]);
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
  // Shows stock belonging to the technician OR their supervisor (if overridden) OR Generic Executor
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
    if (data.folio_comexa) updates.folioComexa = data.folio_comexa; // Mapear Folio Comexa
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

    // 3. Match Branch (SIRH/# de sucursal is strongest match, then Name)
    if (data.branch_identifier) {
      const search = data.branch_identifier.toLowerCase();
      const branch = branches.find(b => 
        (b.sirh && b.sirh.toLowerCase().includes(search)) || 
        (b.name && b.name.toLowerCase().includes(search))
      );
      
      if (branch) {
        matchedBranchId = branch.id;
        updates.branchId = branch.id;
        // Also update the filter so the dropdown shows correct context
        setClientFilter(branch.client); 
        setBranchSearch(branch.sirh || branch.name);
      } else {
        // If not found, at least put the text in the search box
        setBranchSearch(data.branch_identifier);
      }
    }

    // 4. Match Items (Fuzzy logic)
    // We determine ownership based on the logic (Tech or Supervisor)
    const effectiveOwner = getEffectiveStockOwner(matchedTechId);
    
    // Filter stock relevant to this owner (or executor)
    const relevantStock = stock.filter(s => 
      s.owner === 'EJECUTOR' || (effectiveOwner && s.owner === effectiveOwner)
    );

    const newSelectedItems: SelectedItem[] = [];

    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((aiItem: any) => {
        // Try to find a stock item where the name contains the AI detected name, or vice versa
        // Simple heuristic: token matching
        const aiTokens = aiItem.device_name.toLowerCase().split(' ');
        
        const bestMatch = relevantStock.find(stockItem => {
          const stockName = stockItem.device.toLowerCase();
          // Check if stock name contains significant parts of AI name
          return aiTokens.some((token: string) => token.length > 3 && stockName.includes(token));
        });

        if (bestMatch) {
          // Avoid duplicates
          if (!newSelectedItems.find(i => i.stockId === bestMatch.id)) {
            newSelectedItems.push({
              stockId: bestMatch.id,
              quantityToUse: Math.min(aiItem.quantity || 1, bestMatch.quantity),
              // Use AI detection or default to Equipment if unknown
              usageType: aiItem.item_category === 'Material o refacción' ? 'Material o refacción' : 'Equipo instalado'
            });
          }
        }
      });
    }

    setFormData(prev => ({ ...prev, ...updates }));
    if (newSelectedItems.length > 0) {
      setSelectedItems(prev => {
        // Merge without duplicates
        const combined = [...prev];
        newSelectedItems.forEach(newItem => {
           if (!combined.find(c => c.stockId === newItem.stockId)) {
             combined.push(newItem);
           }
        });
        return combined;
      });
    }

    alert(`Análisis completado.\n\nDatos detectados:\n- Items encontrados: ${newSelectedItems.length}\n- Sucursal detectada: ${matchedBranchId ? 'Sí' : 'No'}\n- Técnico detectado: ${matchedTechId ? 'Sí' : 'No'}`);
  };

  const handleAddItem = (stockId: string) => {
    if (selectedItems.find(i => i.stockId === stockId)) return;
    // Default to 'Equipo instalado', user can change it
    setSelectedItems([...selectedItems, { stockId, quantityToUse: 1, usageType: 'Equipo instalado' }]);
  };

  const updateItemQuantity = (stockId: string, qty: number) => {
    const itemInStock = stock.find(s => s.id === stockId);
    if (!itemInStock) return;
    const max = itemInStock.quantity;
    const finalQty = Math.max(1, Math.min(qty, max));
    setSelectedItems(prev => prev.map(i => i.stockId === stockId ? { ...i, quantityToUse: finalQty } : i));
  };

  const updateItemType = (stockId: string, type: 'Material o refacción' | 'Equipo instalado') => {
    setSelectedItems(prev => prev.map(i => i.stockId === stockId ? { ...i, usageType: type } : i));
  };

  const handleRemoveItem = (stockId: string) => {
    setSelectedItems(prev => prev.filter(i => i.stockId !== stockId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const technician = technicians.find(t => t.id === formData.technicianId);
    const branch = branches.find(b => b.id === formData.branchId);

    if (!technician || !branch || selectedItems.length === 0) {
      alert("Por favor completa todos los campos requeridos y selecciona al menos un dispositivo.");
      return;
    }

    const log: InstallationLog = {
      id: `log-${Date.now()}`,
      sctask: formData.sctask,
      reqo: formData.reqo,
      folioComexa: formData.folioComexa,
      technicianName: technician.name,
      reportDate: formData.reportDate,
      branchName: branch.name,
      branchSirh: branch.sirh, 
      branchRegion: branch.region || 'SIN REGIÓN', // Capture Region
      installationDate: formData.installDate,
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
      folioComexa: '',
    });
    setSelectedItems([]);
  };

  const effectiveOwnerName = getEffectiveStockOwner(formData.technicianId);
  const isOverridden = effectiveOwnerName && technicianIdHasOverride(formData.technicianId);
  
  function technicianIdHasOverride(id: string) {
    const t = technicians.find(tec => tec.id === id);
    return t && STOCK_OVERRIDES[t.name];
  }

  // Selected branch details for UI
  const selectedBranch = branches.find(b => b.id === formData.branchId);

  return (
    <div className="bg-[#27548A]/85 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 max-w-4xl mx-auto">
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
      
      {/* AI Hint */}
      <div className="mb-4 bg-blue-900/40 p-3 rounded border border-blue-400/30 flex items-start gap-2">
        <FileText size={18} className="text-blue-300 mt-1" />
        <p className="text-xs text-blue-200">
          <strong>Tip:</strong> Sube una foto o PDF. Para autocompletar el <strong># de Sucursal/SIRH</strong>, el <strong>Folio Comexa</strong> y clasificará los items automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
             <label className="block text-sm font-medium text-[#DDA853]">SCTASK</label>
             <input required type="text" className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.sctask} onChange={e => setFormData({...formData, sctask: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-[#DDA853]">REQO</label>
             <input required type="text" className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.reqo} onChange={e => setFormData({...formData, reqo: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-[#DDA853]">Folio Comexa</label>
             <input type="text" className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.folioComexa} onChange={e => setFormData({...formData, folioComexa: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-[#DDA853]">Técnico (IDC)</label>
             <select required className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.technicianId} onChange={e => setFormData({...formData, technicianId: e.target.value})}>
               <option value="">Seleccionar...</option>
               {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             {isOverridden && (
                <p className="text-xs text-yellow-500 mt-1">
                  * El stock se descontará del inventario de: <strong>{effectiveOwnerName}</strong>
                </p>
             )}
          </div>
          
          {/* Branch Section - Advanced Filtering */}
          <div className="bg-[#1E406A]/30 p-4 rounded-md border border-[#DDA853]/20 md:row-span-2">
             <label className="block text-sm font-medium text-[#DDA853] mb-2">Búsqueda de Sucursal (# de sucursal / SIRH)</label>
             <div className="grid grid-cols-1 gap-2">
                
                {/* 1. Client Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={14} className="text-[#DDA853]/70" />
                  </div>
                  <select 
                    className="w-full pl-9 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none text-sm"
                    value={clientFilter}
                    onChange={(e) => {
                      setClientFilter(e.target.value);
                      setFormData({...formData, branchId: ''}); // Reset selection on filter change
                    }}
                  >
                    <option value="">Todos los Clientes</option>
                    {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* 2. SIRH Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={14} className="text-[#DDA853]/70" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Buscar SIRH o Nombre..." 
                    className="w-full pl-9 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none placeholder-[#DDA853]/50 text-sm"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                  />
                </div>

                {/* 3. Final Selection */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={14} className="text-[#DDA853]/70" />
                  </div>
                  <select 
                    required 
                    className="w-full pl-9 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none text-sm"
                    value={formData.branchId} 
                    onChange={e => setFormData({...formData, branchId: e.target.value})}
                  >
                    <option value="">
                      {filteredBranches.length === 0 ? "Sin resultados" : "-- Seleccionar Sucursal --"}
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
                 <div>Seleccionado: <strong>{selectedBranch.name}</strong> - {selectedBranch.client}</div>
                 <div className="flex items-center gap-1 text-[#8CE4FF]">
                    <Globe size={10} /> Región: {selectedBranch.region || 'NO DEFINIDA'}
                 </div>
               </div>
             )}
          </div>

          <div>
             <label className="block text-sm font-medium text-[#DDA853]">Fecha Reporte</label>
             <input required type="date" className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.reportDate} onChange={e => setFormData({...formData, reportDate: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-[#DDA853]">Fecha Instalación</label>
             <input required type="date" className="mt-1 w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none" value={formData.installDate} onChange={e => setFormData({...formData, installDate: e.target.value})} />
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
                className="w-full pl-9 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A]/50 focus:bg-[#1E406A]/80 text-[#DDA853] focus:border-[#DDA853] outline-none placeholder-[#DDA853]/50 disabled:opacity-50"
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
                       
                       {/* Classification Selector */}
                       <div className="col-span-4 md:col-span-4">
                         <div className="relative">
                            <Settings2 size={12} className="absolute left-2 top-2.5 text-[#DDA853]/50 pointer-events-none" />
                            <select 
                               className="w-full pl-6 border border-[#DDA853]/30 rounded p-1 text-xs bg-[#1E406A] text-[#DDA853] outline-none focus:border-[#DDA853]"
                               value={si.usageType}
                               onChange={(e) => updateItemType(si.stockId, e.target.value as any)}
                            >
                               <option value="Equipo instalado">Equipo instalado</option>
                               <option value="Material o refacción">Material o refacción</option>
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

        <div className="flex justify-end pt-4 border-t border-[#DDA853]/30">
          <Button type="submit" variant="primary" className="flex items-center gap-2 bg-[#DDA853] hover:bg-[#DDA853]/80 text-[#1A2A4F] border-none">
            <Save size={18} /> Guardar Instalación
          </Button>
        </div>
      </form>
    </div>
  );
};