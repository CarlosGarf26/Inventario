import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  icon?: React.ReactNode;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#27548A]/50 border border-[#DDA853]/30 rounded-md p-2 pl-10 pr-8 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-[#DDA853] focus:border-[#DDA853] relative text-[#DDA853] hover:bg-[#27548A]/70 transition-colors placeholder-[#DDA853]/50"
      >
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center text-[#DDA853]">
          {icon}
        </span>
        <span className="block truncate text-sm font-medium">
          {selected.length === 0 
            ? label 
            : `${selected.length} seleccionado${selected.length !== 1 ? 's' : ''}`}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown size={16} className="text-[#DDA853]" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-[#27548A] shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-[#DDA853]/30 backdrop-blur-sm">
          {options.length === 0 ? (
            <div className="py-2 px-4 text-[#DDA853]/70">No hay opciones</div>
          ) : (
            options.map((option) => (
              <div
                key={option}
                className={`cursor-pointer select-none relative py-2 pl-10 pr-4 hover:bg-[#DDA853]/10 transition-colors ${selected.includes(option) ? 'bg-[#DDA853]/20 text-[#DDA853]' : 'text-[#DDA853]'}`}
                onClick={() => toggleOption(option)}
              >
                <span className={`block truncate ${selected.includes(option) ? 'font-bold' : 'font-normal'}`}>
                  {option}
                </span>
                {selected.includes(option) && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#DDA853]">
                    <Check size={16} />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};