export interface StockItem {
  id: string; // Unique ID for tracking
  category: string;
  device: string;
  model: string;
  quantity: number;
  owner: string; // 'EJECUTOR' or specific IDC Name
}

export interface Technician {
  id: string;
  name: string;
  type: 'NOMINA' | 'EJECUTOR'; // New field
}

export interface Branch {
  id: string;
  client: string;
  sirh: string;
  type: string;
  name: string;
  region: string;
  address: string;
}

export interface InstallationLog {
  id: string;
  sctask?: string; // Banamex
  reqo?: string;   // Banamex
  sbo?: string;    // Santander
  ticket?: string; // Banregio (Folio Cliente)
  folioComexa?: string; // CMX (Internal) - ALL Clients
  technicianName: string;
  reportDate: string;
  branchName: string;
  branchSirh?: string;
  branchRegion?: string;
  installationDate: string;
  
  // New Warranty Fields
  warrantyApplied: boolean;
  warrantyReason: string;

  itemsUsed: {
    device: string;
    model: string;
    quantity: number;
    usageType: 'Instalación' | 'Suministro' | 'Suministro e instalación';
  }[];
}

export interface CatalogItem {
  category: string;
  device: string;
  model: string;
}

export type DeviceCatalog = Record<string, CatalogItem[]>;

// Helper type for the raw CSV parsing
export type CSVRow = string[];