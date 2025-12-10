import React, { useState, useMemo } from 'react';
import { StockItem } from '../types';
import { Search, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/Button';
import { MultiSelect } from './ui/MultiSelect';

interface StockTableProps {
  items: StockItem[];
}

type SortKey = keyof StockItem;
type SortDirection = 'asc' | 'desc';

export const StockTable: React.FC<StockTableProps> = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // Calculate unique categories and owners for the filter dropdowns
  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);
  const owners = useMemo(() => Array.from(new Set(items.map(i => i.owner))).sort(), [items]);

  // Combined filtering logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filtro de búsqueda por texto (Dispositivo, Modelo o Propietario)
      const matchesSearch = 
        item.device.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.owner.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de Categoría (Multi-selección)
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(item.category);
      
      // Filtro de Propietario (Multi-selección)
      const matchesOwner = ownerFilter.length === 0 || ownerFilter.includes(item.owner);

      return matchesSearch && matchesCategory && matchesOwner;
    });
  }, [items, searchTerm, categoryFilter, ownerFilter]);

  // Sorting logic
  const sortedItems = useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredItems, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 text-[#DDA853]/50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-[#DDA853]" /> 
      : <ArrowDown size={14} className="ml-1 text-[#DDA853]" />;
  };

  const downloadCSV = () => {
    const headers = ["Categoria", "Dispositivo", "Modelo", "Cantidad", "Propietario"];
    const csvContent = [
      headers.join(','),
      ...sortedItems.map(item => 
        `"${item.category}","${item.device}","${item.model}",${item.quantity},"${item.owner}"`
      )
    ].join('\n');

    // Add BOM for Excel compatibility (\uFEFF)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#27548A]/85 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-[#DDA853]">Inventario Actual</h2>
        <Button onClick={downloadCSV} variant="secondary" className="flex items-center gap-2">
          <Download size={16} /> Exportar Inventario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DDA853]" size={18} />
          <input
            type="text"
            placeholder="Buscar dispositivo, modelo o propietario..."
            className="pl-10 w-full border border-[#DDA853]/30 rounded-md p-2 focus:ring-2 focus:ring-[#DDA853] focus:border-[#DDA853] text-[#DDA853] placeholder-[#DDA853]/50 bg-[#27548A]/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <MultiSelect
            label="Categorías"
            options={categories}
            selected={categoryFilter}
            onChange={setCategoryFilter}
            icon={<Filter size={18} className="text-[#DDA853]" />}
          />
        </div>

        <div className="relative">
          <MultiSelect
            label="Propietarios (IDC/Ejecutor)"
            options={owners}
            selected={ownerFilter}
            onChange={setOwnerFilter}
            icon={<Filter size={18} className="text-[#DDA853]" />}
          />
        </div>
        
        <div className="flex items-center justify-end text-sm text-[#DDA853]">
           Resultados: <span className="font-bold ml-1">{sortedItems.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#DDA853]/20 rounded-lg">
        <table className="min-w-full divide-y divide-[#DDA853]/20">
          <thead className="bg-[#1E406A]/90">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider cursor-pointer hover:bg-[#DDA853]/10 transition-colors select-none"
                onClick={() => requestSort('category')}
              >
                <div className="flex items-center">Categoria {getSortIcon('category')}</div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider cursor-pointer hover:bg-[#DDA853]/10 transition-colors select-none"
                onClick={() => requestSort('device')}
              >
                <div className="flex items-center">Dispositivo {getSortIcon('device')}</div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider cursor-pointer hover:bg-[#DDA853]/10 transition-colors select-none"
                onClick={() => requestSort('model')}
              >
                <div className="flex items-center">Modelo {getSortIcon('model')}</div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider cursor-pointer hover:bg-[#DDA853]/10 transition-colors select-none"
                onClick={() => requestSort('quantity')}
              >
                <div className="flex items-center">Cant. {getSortIcon('quantity')}</div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider cursor-pointer hover:bg-[#DDA853]/10 transition-colors select-none"
                onClick={() => requestSort('owner')}
              >
                <div className="flex items-center">Propietario {getSortIcon('owner')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDA853]/20 bg-transparent">
            {sortedItems.length > 0 ? (
              sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#DDA853]/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DDA853]">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#DDA853]">{item.device}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DDA853]/80">{item.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#DDA853]">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.owner === 'EJECUTOR' ? 'bg-purple-900/40 text-[#DDA853] border border-[#DDA853]/30' : 'bg-green-900/40 text-[#DDA853] border border-[#DDA853]/30'}`}>
                      {item.owner}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-[#DDA853]/70">
                  No se encontraron dispositivos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};