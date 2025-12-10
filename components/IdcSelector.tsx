import React, { useState } from 'react';
import { Technician } from '../types';
import { Button } from './ui/Button';
import { User } from 'lucide-react';

interface IdcSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (technicianName: string) => void;
  technicians: Technician[];
  title?: string;
}

export const IdcSelector: React.FC<IdcSelectorProps> = ({ isOpen, onClose, onSelect, technicians, title = "Asignar Stock a IDC" }) => {
  const [selectedTech, setSelectedTech] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedTech) {
      onSelect(selectedTech);
      onClose();
      setSelectedTech('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#27548A]/95 rounded-lg shadow-2xl max-w-md w-full p-6 border border-[#DDA853]/40">
        <div className="flex items-center gap-3 mb-4 text-[#DDA853]">
          <User size={24} />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        
        <p className="text-[#DDA853]/90 mb-4">
          Selecciona el nombre de la lista de técnicos al cual pertenece este archivo de inventario.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#DDA853] mb-2">
            Nombre del Propietario (IDC/Ejecutor)
          </label>
          <select 
            className="w-full border border-[#DDA853]/30 rounded-md p-2 focus:ring-2 focus:ring-[#DDA853] outline-none bg-[#1E406A]/50 text-[#8CE4FF]"
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            {technicians.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          {technicians.length === 0 && (
            <p className="text-red-400 text-xs mt-1">
              * No hay técnicos cargados. Por favor carga la lista de técnicos primero.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={!selectedTech}
            className="bg-[#DDA853] text-[#1A2A4F] hover:bg-[#DDA853]/80"
          >
            Confirmar Carga
          </Button>
        </div>
      </div>
    </div>
  );
};