import React, { useMemo } from 'react';
import { StockItem, InstallationLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
import { Package, Users, Activity, PenTool, TrendingUp, BarChart2 } from 'lucide-react';

interface DashboardProps {
  stock: StockItem[];
  logs: InstallationLog[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Dashboard: React.FC<DashboardProps> = ({ stock, logs }) => {
  // Aggregate data for existing charts
  const categoryData = useMemo(() => {
    return stock.reduce((acc, item) => {
      const existing = acc.find(x => x.name === item.category);
      if (existing) {
        existing.value += item.quantity;
      } else {
        acc.push({ name: item.category, value: item.quantity });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [stock]);

  const ownerData = useMemo(() => {
    return stock.reduce((acc, item) => {
      // Logic could be improved here if we had technician type readily available in stock item owners
      // But for now, just split by Executor vs Others
      const key = item.owner === 'EJECUTOR' ? 'Ejecutor' : 'IDC (Técnicos)';
      const existing = acc.find(x => x.name === key);
      if (existing) {
        existing.value += item.quantity;
      } else {
        acc.push({ name: key, value: item.quantity });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [stock]);

  // --- NUEVO: Top 5 Materiales Más Utilizados ---
  const topItemsData = useMemo(() => {
    const itemMap = new Map<string, number>();

    logs.forEach(log => {
      log.itemsUsed.forEach(item => {
        const currentQty = itemMap.get(item.device) || 0;
        itemMap.set(item.device, currentQty + item.quantity);
      });
    });

    // Convertir a array, ordenar y tomar top 5
    return Array.from(itemMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [logs]);

  // --- NUEVO: Rendimiento de Técnicos (Instalaciones vs Material Gastado) ---
  const techPerformanceData = useMemo(() => {
    const techMap = new Map<string, { installations: number; itemsUsed: number }>();

    logs.forEach(log => {
      const techName = log.technicianName;
      const current = techMap.get(techName) || { installations: 0, itemsUsed: 0 };

      // Sumar instalación
      current.installations += 1;
      
      // Sumar items usados en esta instalación
      const itemsInLog = log.itemsUsed.reduce((sum, item) => sum + item.quantity, 0);
      current.itemsUsed += itemsInLog;

      techMap.set(techName, current);
    });

    return Array.from(techMap.entries()).map(([name, data]) => ({
      name,
      instalaciones: data.installations,
      material: data.itemsUsed
    }));
  }, [logs]);

  const totalItems = stock.reduce((acc, item) => acc + item.quantity, 0);
  const totalInstallations = logs.length;
  const itemsInstalled = logs.reduce((acc, log) => acc + log.itemsUsed.reduce((sum, i) => sum + i.quantity, 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 flex items-center">
          <div className="p-3 bg-blue-100/10 rounded-full text-[#DDA853] mr-4 border border-[#DDA853]/30">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-[#DDA853]/80 font-medium">Stock Total</p>
            <h3 className="text-2xl font-bold text-[#DDA853]">{totalItems}</h3>
          </div>
        </div>

        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 flex items-center">
          <div className="p-3 bg-green-100/10 rounded-full text-[#DDA853] mr-4 border border-[#DDA853]/30">
            <PenTool size={24} />
          </div>
          <div>
            <p className="text-sm text-[#DDA853]/80 font-medium">Instalaciones</p>
            <h3 className="text-2xl font-bold text-[#DDA853]">{totalInstallations}</h3>
          </div>
        </div>

        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 flex items-center">
          <div className="p-3 bg-purple-100/10 rounded-full text-[#DDA853] mr-4 border border-[#DDA853]/30">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-[#DDA853]/80 font-medium">Items Usados</p>
            <h3 className="text-2xl font-bold text-[#DDA853]">{itemsInstalled}</h3>
          </div>
        </div>

        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 flex items-center">
           <div className="p-3 bg-yellow-100/10 rounded-full text-[#DDA853] mr-4 border border-[#DDA853]/30">
            <Users size={24} />
          </div>
           <div>
            <p className="text-sm text-[#DDA853]/80 font-medium">Categorías</p>
            <h3 className="text-2xl font-bold text-[#DDA853]">{categoryData.length}</h3>
          </div>
        </div>
      </div>

      {/* Row 2: Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Consumption */}
        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-[#DDA853]" size={20} />
            <h3 className="text-lg font-bold text-[#DDA853]">Top 5: Materiales Más Utilizados</h3>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart 
              data={topItemsData} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#DDA853" strokeOpacity={0.1} horizontal={false} />
              <XAxis type="number" tick={{ fill: '#DDA853' }} axisLine={{ stroke: '#DDA853', opacity: 0.3 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={150} 
                tick={{fontSize: 11, fill: '#DDA853'}} 
                axisLine={{ stroke: '#DDA853', opacity: 0.3 }} 
              />
              <Tooltip 
                cursor={{fill: 'rgba(221, 168, 83, 0.1)'}} 
                contentStyle={{ backgroundColor: '#1A2A4F', borderRadius: '8px', border: '1px solid #DDA853', color: '#DDA853' }} 
                itemStyle={{ color: '#DDA853' }}
              />
              <Legend wrapperStyle={{ color: '#DDA853' }} />
              <Bar dataKey="value" name="Cantidad Usada" fill="#FF8042" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Technician Performance */}
        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="text-[#DDA853]" size={20} />
            <h3 className="text-lg font-bold text-[#DDA853]">Rendimiento Técnico (Instalaciones vs Gasto)</h3>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart 
              data={techPerformanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#DDA853" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#DDA853', fontSize: 11 }} axisLine={{ stroke: '#DDA853', opacity: 0.3 }} />
              <YAxis tick={{ fill: '#DDA853' }} axisLine={{ stroke: '#DDA853', opacity: 0.3 }} />
              <Tooltip 
                cursor={{fill: 'rgba(221, 168, 83, 0.1)'}} 
                contentStyle={{ backgroundColor: '#1A2A4F', borderRadius: '8px', border: '1px solid #DDA853', color: '#DDA853' }} 
              />
              <Legend wrapperStyle={{ color: '#DDA853' }} />
              <Bar dataKey="instalaciones" name="Instalaciones" fill="#00C49F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="material" name="Material Total (Piezas)" fill="#DDA853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 h-96">
          <h3 className="text-lg font-bold text-[#DDA853] mb-4">Stock Actual por Categoría</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDA853" strokeOpacity={0.1} />
              <XAxis type="number" tick={{ fill: '#DDA853' }} axisLine={{ stroke: '#DDA853', opacity: 0.3 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12, fill: '#DDA853'}} axisLine={{ stroke: '#DDA853', opacity: 0.3 }} />
              <Tooltip 
                cursor={{fill: 'rgba(221, 168, 83, 0.1)'}} 
                contentStyle={{ backgroundColor: '#1A2A4F', borderRadius: '8px', border: '1px solid #DDA853', color: '#DDA853' }} 
                itemStyle={{ color: '#DDA853' }}
              />
              <Legend wrapperStyle={{ color: '#DDA853' }} />
              <Bar dataKey="value" name="Cantidad en Stock" fill="#8884d8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20 h-96">
          <h3 className="text-lg font-bold text-[#DDA853] mb-4">Distribución de Propietario</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ownerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ownerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A2A4F', borderRadius: '8px', border: '1px solid #DDA853', color: '#DDA853' }} 
                itemStyle={{ color: '#DDA853' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};