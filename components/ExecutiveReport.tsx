import React, { useMemo, useState } from 'react';
import { InstallationLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Printer, FileSpreadsheet, TrendingUp, MapPin, Briefcase, Filter } from 'lucide-react';
import { Button } from './ui/Button';
import { CLIENTS } from '../constants';

interface ExecutiveReportProps {
  logs: InstallationLog[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300'];

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ logs }) => {
  
  // --- Filters State ---
  const [filterClient, setFilterClient] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterTech, setFilterTech] = useState<string>('');

  // Extract unique technicians for the filter dropdown
  const uniqueTechs = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.technicianName))).sort();
  }, [logs]);

  // --- Filter Logic ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Client Filter (Checking if log has client-specific fields or inferring from branch name if possible, 
      // but strictly we use the fields present. Since we don't store 'client' directly in log root, we infer)
      // Inference: Banamex has SCTASK, Banregio has Ticket, Santander has SBO.
      let matchesClient = true;
      if (filterClient) {
        if (filterClient === CLIENTS.BANAMEX) matchesClient = !!log.sctask;
        else if (filterClient === CLIENTS.BANREGIO) matchesClient = !!log.ticket;
        else if (filterClient === CLIENTS.SANTANDER) matchesClient = !!log.sbo;
      }

      // 2. Date Filter
      let matchesDate = true;
      if (filterStartDate) matchesDate = matchesDate && log.installationDate >= filterStartDate;
      if (filterEndDate) matchesDate = matchesDate && log.installationDate <= filterEndDate;

      // 3. Tech Filter
      let matchesTech = true;
      if (filterTech) matchesTech = log.technicianName === filterTech;

      return matchesClient && matchesDate && matchesTech;
    });
  }, [logs, filterClient, filterStartDate, filterEndDate, filterTech]);


  // --- Data Aggregation (Using filteredLogs) ---

  // 1. Installations by Region
  const regionData = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach(log => {
       const region = log.branchRegion || 'SIN REGION';
       map.set(region, (map.get(region) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLogs]);

  // 2. Material Cost (Quantity) by Region
  const materialByRegionData = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach(log => {
       const region = log.branchRegion || 'SIN REGION';
       const totalItems = log.itemsUsed.reduce((sum, item) => sum + item.quantity, 0);
       map.set(region, (map.get(region) || 0) + totalItems);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLogs]);

  // 3. Top Technicians (Efficiency)
  const topTechnicians = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach(log => {
      map.set(log.technicianName, (map.get(log.technicianName) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredLogs]);


  // --- Export Functions ---

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    const headers = ["Región", "Sucursal", "Fecha Instalación", "Folio Comexa", "Técnico", "Garantía", "Total Items"];
    
    // Create rows optimized for management reading
    const rows = filteredLogs.map(log => {
      const totalItems = log.itemsUsed.reduce((sum, item) => sum + item.quantity, 0);
      return [
        `"${log.branchRegion || 'N/A'}"`,
        `"${log.branchName}"`,
        log.installationDate,
        `"${log.folioComexa}"`,
        `"${log.technicianName}"`,
        `"${log.warrantyApplied ? 'SI' : 'NO'}"`,
        totalItems
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_gerencial_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:bg-white print:p-0 print:m-0 print:absolute print:inset-0 print:z-[9999]">
      
      {/* Header - Printable */}
      <div className="bg-[#1E406A] p-6 rounded-lg shadow-lg border-b-4 border-[#DDA853] flex flex-col md:flex-row justify-between items-center print:bg-white print:shadow-none print:border-black">
        <div>
          <h1 className="text-3xl font-bold text-white print:text-black">Reporte Gerencial Ejecutivo</h1>
          <p className="text-[#DDA853] text-sm mt-1 print:text-gray-600">Resumen de Operaciones, Regiones y Rendimiento</p>
          <p className="text-white/50 text-xs mt-2 print:text-gray-500">Generado: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0 print:hidden">
          <Button onClick={handleExcelExport} className="bg-green-700 text-white flex items-center gap-2 hover:bg-green-800">
            <FileSpreadsheet size={18} /> Exportar Excel
          </Button>
          <Button onClick={handlePrint} className="bg-[#DDA853] text-[#1A2A4F] font-bold flex items-center gap-2 hover:bg-[#DDA853]/80">
            <Printer size={18} /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* FILTER BAR (Hidden on Print) */}
      <div className="bg-[#27548A]/40 p-4 rounded-lg border border-[#DDA853]/20 print:hidden">
         <h3 className="text-[#DDA853] font-bold text-sm mb-3 flex items-center gap-2">
            <Filter size={16} /> Filtros del Reporte
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Client Filter */}
             <div>
               <label className="block text-xs text-[#DDA853]/70 mb-1">Cliente</label>
               <select 
                 className="w-full bg-[#1E406A] border border-[#DDA853]/30 rounded p-2 text-[#DDA853] text-sm outline-none"
                 value={filterClient}
                 onChange={e => setFilterClient(e.target.value)}
               >
                 <option value="">Todos los Clientes</option>
                 {Object.values(CLIENTS).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>

             {/* Tech Filter */}
             <div>
               <label className="block text-xs text-[#DDA853]/70 mb-1">Técnico (IDC)</label>
               <select 
                 className="w-full bg-[#1E406A] border border-[#DDA853]/30 rounded p-2 text-[#DDA853] text-sm outline-none"
                 value={filterTech}
                 onChange={e => setFilterTech(e.target.value)}
               >
                 <option value="">Todos los Técnicos</option>
                 {uniqueTechs.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>

             {/* Date Start */}
             <div>
               <label className="block text-xs text-[#DDA853]/70 mb-1">Desde</label>
               <input 
                 type="date" 
                 className="w-full bg-[#1E406A] border border-[#DDA853]/30 rounded p-2 text-[#DDA853] text-sm outline-none"
                 value={filterStartDate}
                 onChange={e => setFilterStartDate(e.target.value)}
               />
             </div>

             {/* Date End */}
             <div>
               <label className="block text-xs text-[#DDA853]/70 mb-1">Hasta</label>
               <input 
                 type="date" 
                 className="w-full bg-[#1E406A] border border-[#DDA853]/30 rounded p-2 text-[#DDA853] text-sm outline-none"
                 value={filterEndDate}
                 onChange={e => setFilterEndDate(e.target.value)}
               />
             </div>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 print:border-gray-400">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="text-blue-600" size={24} />
            <h3 className="text-gray-600 font-bold uppercase text-sm">Total Instalaciones</h3>
          </div>
          <p className="text-4xl font-bold text-gray-800">{filteredLogs.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#DDA853] print:border-gray-400">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="text-[#DDA853]" size={24} />
            <h3 className="text-gray-600 font-bold uppercase text-sm">Regiones Activas</h3>
          </div>
          <p className="text-4xl font-bold text-gray-800">{regionData.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 print:border-gray-400">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600" size={24} />
            <h3 className="text-gray-600 font-bold uppercase text-sm">Material Total (Pzas)</h3>
          </div>
          <p className="text-4xl font-bold text-gray-800">
             {filteredLogs.reduce((acc, log) => acc + log.itemsUsed.reduce((sum, item) => sum + item.quantity, 0), 0)}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
        {/* Installations by Region */}
        <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none print:border print:border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
            <MapPin className="text-blue-600" size={20} /> Distribución por Región
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Instalaciones" fill="#0088FE" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Consumption by Region */}
        <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none print:border print:border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
            <TrendingUp className="text-[#DDA853]" size={20} /> Consumo Material por Región
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materialByRegionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {materialByRegionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Technicians Table */}
      <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Top 5 Técnicos con Mayor Actividad</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Técnico</th>
               <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Instalaciones</th>
               <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rendimiento Relativo</th>
             </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
             {topTechnicians.map((tech, idx) => (
               <tr key={idx}>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tech.name}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{tech.value}</td>
                 <td className="px-6 py-4 whitespace-nowrap align-middle">
                   <div className="w-full bg-gray-200 rounded-full h-2.5">
                     <div 
                       className="bg-[#DDA853] h-2.5 rounded-full" 
                       style={{ width: `${(tech.value / (topTechnicians[0]?.value || 1)) * 100}%` }}
                     ></div>
                   </div>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block text-center mt-10 text-xs text-gray-400 border-t pt-4">
        Reporte generado por Plataforma Comexa Stock Control - Uso confidencial interno.
      </div>
    </div>
  );
};