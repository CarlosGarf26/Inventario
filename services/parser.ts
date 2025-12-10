import { StockItem, Technician, Branch, InstallationLog, CatalogItem, DeviceCatalog } from '../types';
import { ROW_START_TOP, ROW_END_TOP, ROW_START_BOTTOM, OWNER_EXECUTOR } from '../constants';
import { read, utils } from 'xlsx';

// Basic CSV Line Splitter handling quotes
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const parseCSV = (content: string): string[][] => {
  const lines = content.split(/\r?\n/);
  return lines.map(parseCSVLine);
};

// Helper to format date from DD/MM/YYYY to YYYY-MM-DD
const formatDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Check if it's already YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    // Assume Day Month Year if year is last
    if (parts[2].length === 4) {
       return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return dateStr;
};

// Logic adapted from the Python script to extract stock blocks
export const parseStockFile = (content: string, ownerName: string): StockItem[] => {
  const rows = parseCSV(content);
  const items: StockItem[] = [];

  const extractBlock = (
    rowStart: number, 
    rowEnd: number | null, 
    colIndices: number[], 
    category: string
  ) => {
    const limit = rowEnd === null ? rows.length : Math.min(rowEnd, rows.length);
    
    for (let i = rowStart; i < limit; i++) {
      const row = rows[i];
      if (!row || row.length < Math.max(...colIndices)) continue;

      const device = row[colIndices[0]];
      const model = row[colIndices[1]];
      const qtyStr = row[colIndices[2]];

      // Clean check similar to dropna(subset=['Dispositivo'])
      if (device && device !== '' && device !== '0' && device.toLowerCase() !== 'nan') {
         const quantity = parseInt(qtyStr) || 0;
         if (quantity > 0) { // Only add if we have stock? Or keep 0s. Let's keep > 0 for cleanliness
           items.push({
             id: `${ownerName}-${category}-${device}-${model}-${Math.random().toString(36).substr(2, 9)}`,
             category,
             device,
             model: model || 'N/A',
             quantity,
             owner: ownerName
           });
         }
      }
    }
  };

  // Section Definitions matching the Python logic
  // Top Section
  extractBlock(ROW_START_TOP, ROW_END_TOP, [1, 2, 3], "ALARMAS");
  extractBlock(ROW_START_TOP, ROW_END_TOP, [5, 6, 7], "CCTV");
  extractBlock(ROW_START_TOP, ROW_END_TOP, [9, 10, 11], "CONTROL DE ACCESO");

  // Bottom Section
  extractBlock(ROW_START_BOTTOM, null, [1, 2, 3], "MISCELANEOS");
  extractBlock(ROW_START_BOTTOM, null, [5, 6, 7], "CABLEADO & FLEXIBLE");
  extractBlock(ROW_START_BOTTOM, null, [9, 10, 11], "FUENTES Y BATERIAS");

  return items;
};

export const parseTechnicianFile = (content: string): Technician[] => {
  const rows = parseCSV(content);
  const headers = rows[0]?.map(h => h.toUpperCase()) || [];
  
  // Find columns
  const idcIndex = headers.findIndex(h => h.includes('IDC') || h.includes('NOMBRE'));
  const typeIndex = headers.findIndex(h => h.includes('TIPO') || h.includes('ROL') || h.includes('CATEGORIA'));

  if (idcIndex === -1) return [];

  const techs: Technician[] = [];
  // Start from 1 to skip header
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[idcIndex]) {
      const name = row[idcIndex].replace(/"/g, '').trim();
      let type: 'NOMINA' | 'EJECUTOR' = 'NOMINA'; // Default

      if (typeIndex !== -1 && row[typeIndex]) {
        const typeStr = row[typeIndex].toUpperCase();
        if (typeStr.includes('EJECUTOR')) {
          type = 'EJECUTOR';
        }
      }

      techs.push({
        id: `tech-${i}`,
        name: name,
        type: type
      });
    }
  }
  return techs;
};

export const parseBranchFile = (content: string): Branch[] => {
  const rows = parseCSV(content);
  // User requested only columns A, B, C, D (Indices 0, 1, 2, 3)
  // Assumed Mapping: 
  // A=CLIENTE, B=SIRH, C=TIPO, D=SUCURSAL
  // NEW: E=REGION (Index 4)
  
  const branches: Branch[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Ensure we have at least 4 columns (0 to 3)
    if (row.length < 4) continue; 

    // Basic cleaning to remove quotes if parser left them (though parseCSVLine handles most)
    const clean = (s: string) => s ? s.replace(/"/g, '').trim() : '';

    branches.push({
      id: `branch-${i}`,
      client: clean(row[0]),
      sirh: clean(row[1]),
      type: clean(row[2]),
      name: clean(row[3]),
      region: row[4] ? clean(row[4]) : 'SIN REGIÓN', // Capture Region if exists
      address: '' // Not requested
    });
  }

  return branches;
};

export const parseServiceConcentrate = (content: string): InstallationLog[] => {
  const rows = parseCSV(content);
  const headers = rows[0]?.map(h => h.toUpperCase().trim()) || [];

  // Required Columns:
  // FOLIO DE INCIDENTE, FOLIO COMEXA, SIRH, TIPO, INMUEBLE, REGION, FECHA REGISTRO, FECHA DE ATENCION, PERSONAL RESPONSABLE
  
  const idxIncidente = headers.findIndex(h => h.includes('INCIDENTE')); // Ticket/SCTASK
  const idxComexa = headers.findIndex(h => h.includes('COMEXA'));
  const idxSirh = headers.findIndex(h => h.includes('SIRH'));
  // const idxTipo = headers.findIndex(h => h.includes('TIPO')); // Not used in Log structure currently, maybe for logic?
  const idxInmueble = headers.findIndex(h => h.includes('INMUEBLE') || h.includes('SUCURSAL'));
  const idxRegion = headers.findIndex(h => h.includes('REGION'));
  const idxFechaReg = headers.findIndex(h => h.includes('FECHA REGISTRO'));
  const idxFechaAtt = headers.findIndex(h => h.includes('FECHA DE ATENCION') || h.includes('ATENCIÓN'));
  const idxPersonal = headers.findIndex(h => h.includes('PERSONAL') || h.includes('TECNICO') || h.includes('RESPONSABLE'));

  if (idxComexa === -1 || idxInmueble === -1) {
    // Basic validation failed
    console.warn("Missing required columns in Service Concentrate file");
    return [];
  }

  const logs: InstallationLog[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue; // Skip empty rows

    const clean = (val: string) => val ? val.replace(/"/g, '').trim() : '';

    logs.push({
      id: `hist-import-${Date.now()}-${i}`,
      
      // Map Incidente to Ticket (Generic bucket)
      ticket: idxIncidente !== -1 ? clean(row[idxIncidente]) : '',
      
      // Common Fields
      folioComexa: idxComexa !== -1 ? clean(row[idxComexa]) : 'S/F',
      technicianName: idxPersonal !== -1 ? clean(row[idxPersonal]) : 'NO DEFINIDO',
      
      reportDate: idxFechaReg !== -1 ? formatDate(clean(row[idxFechaReg])) : new Date().toISOString().split('T')[0],
      installationDate: idxFechaAtt !== -1 ? formatDate(clean(row[idxFechaAtt])) : new Date().toISOString().split('T')[0],
      
      branchName: idxInmueble !== -1 ? clean(row[idxInmueble]) : 'NO DEFINIDO',
      branchSirh: idxSirh !== -1 ? clean(row[idxSirh]) : '',
      branchRegion: idxRegion !== -1 ? clean(row[idxRegion]) : 'SIN REGION',

      // Defaults for imported history
      warrantyApplied: false,
      warrantyReason: 'Carga Masiva Histórica',
      itemsUsed: [] // No items in concentrate file
    });
  }

  return logs;
};

// NEW: Parse Catalog Excel (Banamex/Santander)
export const parseCatalogExcel = async (file: File): Promise<DeviceCatalog> => {
  const buffer = await file.arrayBuffer();
  const wb = read(buffer);
  const result: DeviceCatalog = {};

  wb.SheetNames.forEach(sheetName => {
      const upperName = sheetName.toUpperCase();
      let clientKey = '';
      if(upperName.includes('BANAMEX')) clientKey = 'BANAMEX';
      else if(upperName.includes('SANTANDER')) clientKey = 'SANTANDER';
      // Future: Add Banregio if needed
      
      if(clientKey) {
          const sheet = wb.Sheets[sheetName];
          const data = utils.sheet_to_json(sheet, { header: 1 }) as string[][];
          
          // Assumption based on request:
          // Row 0 might be headers? Or raw data. 
          // Columns: Tipo (Category) [0], Dispositivo [1], Modelo [2]
          
          const items: CatalogItem[] = [];
          
          // Skip the first row if it looks like a header (contains "Tipo" or "Dispositivo")
          const startIdx = (data[0] && (data[0][0]?.toUpperCase().includes('TIPO') || data[0][1]?.toUpperCase().includes('DISPOSITIVO'))) ? 1 : 0;

          for(let i = startIdx; i < data.length; i++) {
             const row = data[i];
             if(!row || row.length < 2) continue;

             const category = row[0]?.toString().trim() || 'MISCELANEOS';
             const device = row[1]?.toString().trim();
             const model = row[2]?.toString().trim() || 'N/A';

             if(device) {
               items.push({ category, device, model });
             }
          }

          if(items.length > 0) {
            result[clientKey] = items;
          }
      }
  });

  return result;
};