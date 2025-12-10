import React from 'react';
import { InstallationLog } from '../types';
import { Button } from './ui/Button';
import { Download, FileText, Calendar, MapPin, User, Hash, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';

interface InstallationHistoryProps {
  logs: InstallationLog[];
}

export const InstallationHistory: React.FC<InstallationHistoryProps> = ({ logs }) => {

  const downloadHistoryCSV = () => {
    // Definir encabezados del CSV incluyendo todos los datos solicitados
    const headers = [
      "ID Registro",
      "Fecha Reporte",
      "Fecha Instalación",
      "Folio Comexa (CMX)", // Mandatory for all
      "SCTASK",
      "REQO",
      "Ticket/Folio Cliente", // Banregio
      "SBO", // Santander
      "Técnico",
      "Garantía",
      "Motivo Garantía",
      "Sucursal (Nombre)",
      "Sucursal (SIRH)",
      "Región",
      "Dispositivo",
      "Modelo",
      "Cantidad",
      "Tipo de Uso"
    ];

    // Aplanar los datos: una fila por cada ítem dentro de cada log
    const rows = logs.flatMap(log => 
      log.itemsUsed.map(item => [
        log.id,
        log.reportDate,
        log.installationDate,
        `"${log.folioComexa || ''}"`, // CMX
        `"${log.sctask || ''}"`, 
        `"${log.reqo || ''}"`,
        `"${log.ticket || ''}"`, // Banregio Ticket
        `"${log.sbo || ''}"`, // Santander SBO
        `"${log.technicianName}"`,
        log.warrantyApplied ? '"SI"' : '"NO"',
        `"${log.warrantyReason || ''}"`,
        `"${log.branchName}"`,
        `"${log.branchSirh || 'N/A'}"`, 
        `"${log.branchRegion || 'N/A'}"`,
        `"${item.device}"`,
        `"${item.model}"`,
        item.quantity,
        `"${item.usageType}"`
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historial_instalaciones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#27548A]/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-[#DDA853]/20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-[#DDA853] flex items-center gap-2">
          <FileText size={24} /> Historial de Instalaciones
        </h2>
        <Button onClick={downloadHistoryCSV} variant="primary" className="flex items-center gap-2 bg-[#DDA853] text-[#1A2A4F] hover:bg-[#DDA853]/80 font-bold border-none">
          <Download size={18} /> Descargar Historial Completo (CSV)
        </Button>
      </div>

      <p className="text-[#DDA853]/80 mb-4 text-sm">
        Aquí puedes ver los últimos registros. Utiliza el botón de descarga para obtener el reporte detallado (incluyendo SIRH, Folio Comexa, Región y dispositivos desglosados).
      </p>

      <div className="overflow-x-auto border border-[#DDA853]/20 rounded-lg">
        <table className="min-w-full divide-y divide-[#DDA853]/20">
          <thead className="bg-[#1E406A]/90">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider">Fecha Inst.</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider">Sucursal / Región</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider">Identificadores</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider">Técnico</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider">Garantía</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#DDA853] uppercase tracking-wider">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDA853]/20 bg-transparent">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#DDA853]/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DDA853]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#DDA853]/60"/> {log.installationDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DDA853]">
                    <div className="font-bold">{log.branchName}</div>
                    <div className="text-xs text-[#DDA853]/70">SIRH: {log.branchSirh || 'N/A'}</div>
                    <div className="text-xs text-[#8CE4FF] flex items-center gap-1 mt-1">
                      <Globe size={10} /> {log.branchRegion || 'SIN REGION'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DDA853]">
                    <div className="text-xs font-bold text-white mb-1">CMX: {log.folioComexa}</div>
                    {log.sbo && <div className="text-xs font-bold text-[#8CE4FF]">SBO: {log.sbo}</div>}
                    {log.ticket && <div className="text-xs font-bold text-yellow-500">Ticket: {log.ticket}</div>}
                    {log.sctask && <div className="text-xs">SCTASK: {log.sctask}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#DDA853]">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[#DDA853]/60"/> {log.technicianName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.warrantyApplied ? (
                      <div className="flex flex-col">
                         <span className="flex items-center gap-1 text-red-400 font-bold"><ShieldAlert size={14}/> SÍ</span>
                         <span className="text-xs text-[#DDA853]/60 max-w-[150px] truncate" title={log.warrantyReason}>{log.warrantyReason}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-green-400 font-bold"><ShieldCheck size={14}/> NO</span>
                        <span className="text-xs text-[#DDA853]/60 max-w-[150px] truncate" title={log.warrantyReason}>{log.warrantyReason}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#DDA853]">
                    <div className="flex flex-col gap-1">
                      {log.itemsUsed.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-[#1E406A] px-2 py-1 rounded border border-[#DDA853]/20">
                          <span>{item.quantity}x {item.device}</span>
                          <span className="opacity-50 text-[10px] uppercase">{item.usageType}</span>
                        </div>
                      ))}
                      {log.itemsUsed.length > 2 && (
                        <span className="text-xs text-[#DDA853]/60 italic">+{log.itemsUsed.length - 2} más...</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-[#DDA853]/70">
                  No hay instalaciones registradas aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};