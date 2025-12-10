import React, { useRef } from 'react';
import { Upload, FileText, Trash2, AlertTriangle, Save, RefreshCw, Files } from 'lucide-react';
import { Button } from './ui/Button';

interface DataUploadProps {
  onFileUpload: (files: File[], type: 'EXECUTOR' | 'IDC_STOCK' | 'TECHS' | 'BRANCHES') => void;
  onReset: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File) => void;
}

export const DataUpload: React.FC<DataUploadProps> = ({ onFileUpload, onReset, onExportBackup, onRestoreBackup }) => {
  
  // Helper to handle drag-drop or click
  const FileZone = ({ label, type, desc }: { label: string, type: 'EXECUTOR' | 'IDC_STOCK' | 'TECHS' | 'BRANCHES', desc: string }) => (
    <div className="border-2 border-dashed border-[#DDA853]/30 rounded-lg p-6 hover:bg-[#DDA853]/10 transition-colors flex flex-col items-center justify-center text-center bg-[#1E406A]/50 group">
      <div className="relative">
        <Files className="text-[#DDA853] mb-2 group-hover:scale-110 transition-transform" size={32} />
        <span className="absolute -top-1 -right-2 bg-[#DDA853] text-[#1A2A4F] text-[10px] font-bold px-1 rounded-full">Multi</span>
      </div>
      <h3 className="font-semibold text-[#DDA853]">{label}</h3>
      <p className="text-xs text-[#DDA853]/70 mb-4">{desc}</p>
      <label className="cursor-pointer w-full">
        <span className="bg-[#DDA853] text-[#1A2A4F] px-4 py-2 rounded text-sm font-bold hover:bg-[#DDA853]/80 transition block w-full text-center">
          Seleccionar Archivos
        </span>
        <input 
          type="file" 
          multiple // Permite múltiples archivos
          className="hidden" 
          accept=".csv,.txt,.xlsx,.xls" 
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

  return (
    <div className="space-y-6">
      <div className="bg-[#27548A]/85 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20">
        <h2 className="text-xl font-bold text-[#DDA853] mb-4 flex items-center gap-2">
          <Upload size={20} /> Carga de Datos Masiva
        </h2>
        <p className="text-[#DDA853]/90 mb-6 text-sm">
          Puedes seleccionar <strong>múltiples archivos</strong> (Excel o CSV) a la vez en cada sección. El sistema los procesará y unirá la información automáticamente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileZone 
            label="Stock Ejecutor" 
            type="EXECUTOR" 
            desc="Carga múltiple: Inventarios generales" 
          />
          <FileZone 
            label="Stock IDC" 
            type="IDC_STOCK" 
            desc="Carga múltiple: Inventarios de técnicos" 
          />
          <FileZone 
            label="Lista de Técnicos" 
            type="TECHS" 
            desc="Carga múltiple: Listas de personal" 
          />
          <FileZone 
            label="Directorio Sucursales" 
            type="BRANCHES" 
            desc="Carga múltiple: Bases de sucursales" 
          />
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-[#27548A]/85 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20">
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

      <div className="bg-red-900/60 p-6 rounded-lg shadow-sm border border-red-500/50 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-red-200 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} /> Zona de Peligro
        </h3>
        <p className="text-red-200/80 text-sm mb-4">
          Si necesitas reiniciar la aplicación, puedes borrar todos los datos cargados actualmente (Inventarios, Técnicos, Sucursales y Registros).
        </p>
        <Button variant="danger" type="button" onClick={onReset} className="flex items-center gap-2">
          <Trash2 size={16} /> Borrar Todo lo Subido
        </Button>
      </div>
    </div>
  );
};