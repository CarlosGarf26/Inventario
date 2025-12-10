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
  sctask: string;
  reqo: string;
  folioComexa: string;
  technicianName: string;
  reportDate: string;
  branchName: string;
  branchSirh?: string;
  branchRegion?: string; // Nuevo campo para Reporte Gerencial
  installationDate: string;
  itemsUsed: {
    device: string;
    model: string;
    quantity: number;
    usageType: 'Material o refacción' | 'Equipo instalado';
  }[];
}

// Helper type for the raw CSV parsing
export type CSVRow = string[];