import React, { useState } from 'react';
import { Upload, FileText, Trash2, AlertTriangle, Save, RefreshCw, Files, UserPlus, User, FileSpreadsheet, Database } from 'lucide-react';
import { Button } from './ui/Button';

interface DataUploadProps {
  onFileUpload: (files: File[], type: 'IDC_STOCK' | 'TECHS' | 'BRANCHES' | 'SERVICES' | 'CATALOG') => void;
  onAddTechnician: (name: string, type: 'NOMINA' | 'EJECUTOR') => void;
  onReset: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File) => void;
}

export const DataUpload: React.FC<DataUploadProps> = ({ onFileUpload, onAddTechnician, onReset, onExportBackup, onRestoreBackup }) => {
  const [newTechName, setNewTechName] = useState('');
  const [newTechType, setNewTechType] = useState<'NOMINA' | 'EJECUTOR'>('NOMINA');
  
  // Helper to handle drag-drop or click
  const FileZone = ({ label, type, desc, icon: Icon }: { label: string, type: 'IDC_STOCK' | 'TECHS' | 'BRANCHES' | 'SERVICES' | 'CATALOG', desc: string, icon: React.ElementType }) => (
    <div className="border-2 border-dashed border-[#DDA853]/30 rounded-lg p-6 hover:bg-[#DDA853]/10 transition-colors flex flex-col items-center justify-center text-center bg-[#1E406A]/50 group h-full">
      <div className="relative">
        <Icon className="text-[#DDA853] mb-2 group-hover:scale-110 transition-transform" size={32} />
        {type !== 'CATALOG' && <span className="absolute -top-1 -right-2 bg-[#DDA853] text-[#1A2A4F] text-[10px] font-bold px-1 rounded-full">Multi</span>}
      </div>
      <h3 className="font-semibold text-[#DDA853]">{label}</h3>
      <p className="text-xs text-[#DDA853]/70 mb-4">{desc}</p>
      <label className="cursor-pointer w-full mt-auto">
        <span className="bg-[#DDA853] text-[#1A2A4F] px-4 py-2 rounded text-sm font-bold hover:bg-[#DDA853]/80 transition block w-full text-center">
          Seleccionar Archivos
        </span>
        <input 
          type="file" 
          multiple={type !== 'CATALOG'} 
          className="hidden" 
          accept={type === 'CATALOG' ? ".xlsx,.xls" : ".csv,.txt,.xlsx,.xls"} 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              // Convert FileList to Array
              const filesArray = Array.from(e.target.files);
              onFileUpload(filesArray, type);
              e.target.value = ''; // reset
            }
          }} 
        />
      </label>
    </div>
  );

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTechName.trim()) {
      onAddTechnician(newTechName.trim(), newTechType);
      setNewTechName('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sección Carga Masiva */}
      <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20">
        <h2 className="text-xl font-bold text-[#DDA853] mb-4 flex items-center gap-2">
          <Upload size={20} /> Carga de Datos Masiva
        </h2>
        <p className="text-[#DDA853]/90 mb-6 text-sm">
          Puedes seleccionar <strong>múltiples archivos</strong> en las secciones indicadas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <FileZone 
            label="1. Lista de Técnicos" 
            type="TECHS" 
            desc="Listas de personal (Incluye columna TIPO)" 
            icon={Files}
          />
          <FileZone 
            label="2. Directorio Sucursales" 
            type="BRANCHES" 
            desc="Base de sucursales" 
            icon={Files}
          />
          <FileZone 
            label="3. Concentrado Servicios" 
            type="SERVICES" 
            desc="Historial masivo de instalaciones" 
            icon={FileSpreadsheet}
          />
          <FileZone 
            label="4. Carga de Inventario" 
            type="IDC_STOCK" 
            desc="Stock (Se asignará a un técnico)" 
            icon={Files}
          />
          <FileZone 
            label="5. Catálogo Dispositivos" 
            type="CATALOG" 
            desc="Excel con hojas 'Banamex' y 'Santander' (Tipo, Disp, Modelo)" 
            icon={Database}
          />
        </div>
      </div>

      {/* Sección Alta Manual IDC */}
      <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20">
        <h3 className="text-lg font-bold text-[#DDA853] mb-4 flex items-center gap-2">
          <UserPlus size={20} /> Alta Manual de Técnico / Ejecutor
        </h3>
        <p className="text-[#DDA853]/80 text-sm mb-4">
          Agrega un técnico individualmente sin necesidad de subir un archivo.
        </p>
        
        <form onSubmit={handleManualAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-[#DDA853] mb-1">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-[#DDA853]/50" size={18} />
              <input 
                type="text" 
                required
                placeholder="Ej. JUAN PEREZ LOPEZ"
                className="w-full pl-10 border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] text-[#DDA853] outline-none focus:border-[#DDA853]"
                value={newTechName}
                onChange={(e) => setNewTechName(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-[#DDA853] mb-1">Tipo de Personal</label>
            <select
               className="w-full border border-[#DDA853]/30 rounded-md p-2 bg-[#1E406A] text-[#DDA853] outline-none focus:border-[#DDA853]"
               value={newTechType}
               onChange={(e) => setNewTechType(e.target.value as 'NOMINA' | 'EJECUTOR')}
            >
              <option value="NOMINA">Nómina (IDC)</option>
              <option value="EJECUTOR">Ejecutor</option>
            </select>
          </div>

          <Button type="submit" variant="primary" className="bg-[#DDA853] text-[#1A2A4F] font-bold w-full md:w-auto flex items-center justify-center gap-2">
            <Save size={18} /> Agregar
          </Button>
        </form>
      </div>

      {/* Backup Section */}
      <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20">
        <h3 className="text-lg font-bold text-[#DDA853] mb-4 flex items-center gap-2">
          <Save size={20} /> Copia de Seguridad
        </h3>
        <p className="text-[#DDA853]/80 text-sm mb-6">
          Guarda una copia completa de la base de datos actual o restaura una copia anterior.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={onExportBackup} variant="secondary" className="flex items-center justify-center gap-2 flex-1 py-3">
            <Save size={18} /> Exportar Respaldo
          </Button>
          
          <label className="flex-1">
            <div className="bg-[#27548A]/50 text-[#DDA853] border border-[#DDA853]/50 hover:bg-[#27548A]/80 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium cursor-pointer transition-colors h-full">
              <RefreshCw size={18} /> Restaurar Respaldo
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".json" 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onRestoreBackup(e.target.files[0]);
                  e.target.value = ''; // reset
                }
              }} 
            />
          </label>
        </div>
      </div>

      <div className="bg-red-900/40 p-6 rounded-lg shadow-sm border border-red-500/50 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-red-200 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} /> Zona de Peligro
        </h3>
        <p className="text-red-200/80 text-sm mb-4">
          Si necesitas reiniciar la aplicación, puedes borrar todos los datos cargados actualmente.
        </p>
        <Button variant="danger" type="button" onClick={onReset} className="flex items-center gap-2">
          <Trash2 size={16} /> Borrar Todo lo Subido
        </Button>
      </div>
    </div>
  );
};