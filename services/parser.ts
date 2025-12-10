import { StockItem, Technician, Branch } from '../types';
import { ROW_START_TOP, ROW_END_TOP, ROW_START_BOTTOM, OWNER_EXECUTOR } from '../constants';

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
  const idcIndex = headers.findIndex(h => h.includes('IDC'));

  if (idcIndex === -1) return [];

  const techs: Technician[] = [];
  // Start from 1 to skip header
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[idcIndex]) {
      techs.push({
        id: `tech-${i}`,
        name: row[idcIndex].replace(/"/g, '').trim()
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