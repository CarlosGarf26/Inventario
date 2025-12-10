
export const APP_NAME = "Comexa Stock Control";
export const OWNER_EXECUTOR = "EJECUTOR";

// Based on the Python script logic
export const ROW_START_TOP = 10;
export const ROW_END_TOP = 38;
export const ROW_START_BOTTOM = 39;

export const CATEGORIES = {
  ALARMAS: 'ALARMAS',
  CCTV: 'CCTV',
  ACCESO: 'CONTROL DE ACCESO',
  MISCELANEOS: 'MISCELANEOS',
  CABLEADO: 'CABLEADO & FLEXIBLE',
  FUENTES: 'FUENTES Y BATERIAS'
};

export const CLIENTS = {
  BANAMEX: 'BANAMEX',
  SANTANDER: 'SANTANDER',
  BANREGIO: 'BANREGIO'
};

// Configuration for Stock Redirection (Child -> Parent Supervisor)
// Any stock added/assigned to the Key (Child) will actually be stored under the Value (Supervisor)
// Any stock used by the Key (Child) will be deducted from the Value (Supervisor)
export const STOCK_OVERRIDES: Record<string, string> = {
  "MAURO ISRAEL GUTIÉRREZ HEREDIA": "JULIO FERNANDO BARROSO CHAN",
  "ANGEL FERNANDO MOO MONTEJO": "JULIO FERNANDO BARROSO CHAN",
  "ALEX ROBERTO HOIL PUCH": "JULIO FERNANDO BARROSO CHAN"
};

// Base de datos de dispositivos por Cliente y Categoría
export const DEVICE_CATALOG: Record<string, { category: string, device: string, model: string }[]> = {
  [CLIENTS.BANAMEX]: [
    // ALARMAS
    { category: CATEGORIES.ALARMAS, device: 'BASE DE HOCHIKI', model: 'NS6-100' },
    { category: CATEGORIES.ALARMAS, device: 'BOTÓN DE ASALTO DMP', model: '1142 - BC' },
    { category: CATEGORIES.ALARMAS, device: 'BOTONERA DE ASALTO', model: '269R' },
    { category: CATEGORIES.ALARMAS, device: 'CONTACTO MAGNÉTICO', model: '7939WG-WH' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR DE HUMO', model: 'SF119-4(12)' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR DE MOVIMIENTO', model: 'LC100' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR DE MOVIMIENTO', model: 'LC200S' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR DE MOVIMIENTO', model: 'DT 8035' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR DE TEMPERATURA HOCHIKI', model: 'DFE -135' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR DE VIBRACIÓN (DV) PARA ATM', model: 'DSC SS-102' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR SISMICO (DS) PARA BÓVEDA', model: 'SC100' },
    { category: CATEGORIES.ALARMAS, device: 'DETECTOR TÉRMICO', model: '503' },
    { category: CATEGORIES.ALARMAS, device: 'ESTACIÓN MANUAL', model: 'BG-12LSP' },
    { category: CATEGORIES.ALARMAS, device: 'ESTROBO & SIRENA', model: 'P2R-L' },
    { category: CATEGORIES.ALARMAS, device: 'EXPANSORA DMP', model: '714-16' },
    { category: CATEGORIES.ALARMAS, device: 'LUZ ESTROBO', model: '' },
    { category: CATEGORIES.ALARMAS, device: 'MÓDULO RELAY DMP', model: '716' },
    { category: CATEGORIES.ALARMAS, device: 'MÓDULO RELAY NOE O MC', model: 'COMEXA' },
    { category: CATEGORIES.ALARMAS, device: 'MÓDULO WIEGAND DMP', model: '734' },
    { category: CATEGORIES.ALARMAS, device: 'MONEY CLIP LINEAR', model: 'DXS-81' },
    { category: CATEGORIES.ALARMAS, device: 'MONEY CLIP DMP', model: '1139' },
    { category: CATEGORIES.ALARMAS, device: 'RECEPTORA DMP', model: '1100X' },
    { category: CATEGORIES.ALARMAS, device: 'RECEPTORA PARA LINEAR', model: 'DSXR-1508' },
    { category: CATEGORIES.ALARMAS, device: 'SIRENA', model: 'VARIOS' },
    { category: CATEGORIES.ALARMAS, device: 'TAMPER SECOM ALAR', model: '' },
    { category: CATEGORIES.ALARMAS, device: 'TARJETA DMP', model: 'XR550-DN' },
    { category: CATEGORIES.ALARMAS, device: 'TECLADO DMP', model: '7060W' },
    { category: CATEGORIES.ALARMAS, device: 'TECLADO DMP TOUCH', model: '7800' },
    
    // CCTV
    { category: CATEGORIES.CCTV, device: 'ADAPTADOR (PLATO)', model: 'SBP-301HMW2' },
    { category: CATEGORIES.CCTV, device: 'BRAZO MURO EXT', model: 'SBP-300WM1' },
    { category: CATEGORIES.CCTV, device: 'BRAZO MURO INT', model: 'SBP-120WMW' },
    { category: CATEGORIES.CCTV, device: 'CÁMARA 360° OJO DE PEZ IP', model: 'XNF-8010R' },
    { category: CATEGORIES.CCTV, device: 'CÁMARA 180°', model: 'PNM-C9022RV' },
    { category: CATEGORIES.CCTV, device: 'CÁMARA ANALOGICA EXT.', model: 'SCV-6085R / HCV-6070R' },
    { category: CATEGORIES.CCTV, device: 'CÁMARA ANALOGICA INT.', model: 'HCD-6070R' },
    { category: CATEGORIES.CCTV, device: 'CÁMARA AXIS', model: 'P3245' },
    { category: CATEGORIES.CCTV, device: 'CÁMARA IP INT.', model: 'QND-6082R' },
    { category: CATEGORIES.CCTV, device: 'CAMARA IP EXT.', model: 'QNV-6082R' },
    { category: CATEGORIES.CCTV, device: 'GRABADOR DVR', model: 'SRD-1676DN' },
    { category: CATEGORIES.CCTV, device: 'GRABADOR NVR', model: 'XRN-6410' },
    { category: CATEGORIES.CCTV, device: 'HDD 8TB', model: 'WD8002PURP' },
    { category: CATEGORIES.CCTV, device: 'HUB (16 CANALES)', model: 'VARIOS' },
    { category: CATEGORIES.CCTV, device: 'JOYSTICK ANÁLAGO', model: 'SPC-1010' },
    { category: CATEGORIES.CCTV, device: 'JOYSTICK IP', model: 'DS-1600' },
    { category: CATEGORIES.CCTV, device: 'KIT TRANSCEPTOR (EPCOM-TITANIUM)', model: 'VARIOS' },
    { category: CATEGORIES.CCTV, device: 'MEMORIA USB (32 GB)', model: '' },
    { category: CATEGORIES.CCTV, device: 'MONITOR CCTV (VARIOS TAMAÑOS)', model: 'VARIOS' },
    { category: CATEGORIES.CCTV, device: 'PATCHCORD', model: '' },
    { category: CATEGORIES.CCTV, device: 'PTZ ANÁLOGA', model: 'HCP-6320 HA' },
    { category: CATEGORIES.CCTV, device: 'PTZ IP', model: 'QNP-6230RH' },
    { category: CATEGORIES.CCTV, device: 'TRANSCEPTOR', model: 'EPCOM' },
    { category: CATEGORIES.CCTV, device: 'TRANSCEPTOR PASIVO', model: 'NVT' },
    { category: CATEGORIES.CCTV, device: 'VENTILADOR DE NVR', model: 'NOCTUA PREMIUN' },
    { category: CATEGORIES.CCTV, device: 'VENTILADOR PARA RACK', model: 'LP-VENT-01' },

    // CONTROL DE ACCESO
    { category: CATEGORIES.ACCESO, device: 'BOTÓN DE EMERGENCIA (STI)', model: 'SS2422EX-ES' },
    { category: CATEGORIES.ACCESO, device: 'BOTÓN DE LIBERACIÓN', model: 'PRO800B / RP-26' },
    { category: CATEGORIES.ACCESO, device: 'BRACKET U PARA ELECTRÓIMAN (RCI)', model: 'RCI' },
    { category: CATEGORIES.ACCESO, device: 'CENTRAL DE INTERFÓN 3 CANALES', model: 'LEF-3' },
    { category: CATEGORIES.ACCESO, device: 'CENTRAL DE INTERFÓN 5 CANALES', model: 'LEF-5' },
    { category: CATEGORIES.ACCESO, device: 'CONTRA CON PERNO (PTA CRISTAL)', model: 'PROEB-500U' },
    { category: CATEGORIES.ACCESO, device: 'CONTRA ELÉCTRICA', model: 'LOCK / PHILLIPS' },
    { category: CATEGORIES.ACCESO, device: 'CONTRA ELÉCTRICA', model: 'ACCESSPRO / ADAM RITE' },
    { category: CATEGORIES.ACCESO, device: 'ELECTROIMÁN (1200 LB)', model: 'ACCESSPRO' },
    { category: CATEGORIES.ACCESO, device: 'FRENTE DE INTERFÓN APARENTE', model: 'LE-D' },
    { category: CATEGORIES.ACCESO, device: 'FRENTE DE INTERFÓN APARENTE INT.', model: 'IF-DA' },
    { category: CATEGORIES.ACCESO, device: 'FRENTE DE INTERFÓN EMPOTRADO', model: 'LE-DA' },
    { category: CATEGORIES.ACCESO, device: 'FUENTE DE ALIMENTACION', model: 'CUTRON' },
    { category: CATEGORIES.ACCESO, device: 'FUENTE DE INTERFÓN', model: 'PS-1225UL' },
    { category: CATEGORIES.ACCESO, device: 'LECTORA', model: 'R10' },
    { category: CATEGORIES.ACCESO, device: 'LECTORA', model: 'R20' },
    { category: CATEGORIES.ACCESO, device: 'LECTORA SIGNO', model: 'R20KSP' },
    { category: CATEGORIES.ACCESO, device: 'LÓGICA ESCLUSA LITE', model: 'COMEXA' },
    { category: CATEGORIES.ACCESO, device: 'LÓGICA ESCLUSA PARA DISCAPACITADOS', model: 'COMEXA' },
    { category: CATEGORIES.ACCESO, device: 'LÓGICA ESCLUSA', model: 'CUTRON' },
    { category: CATEGORIES.ACCESO, device: 'TARJETA R2', model: 'R2' },
    { category: CATEGORIES.ACCESO, device: 'TARJETA IC', model: 'IC' },
    { category: CATEGORIES.ACCESO, device: 'TECLADO', model: 'ACCESSPRO / IEI' },
    { category: CATEGORIES.ACCESO, device: 'TECLADO COMEXA', model: 'CESTEK' },
    { category: CATEGORIES.ACCESO, device: 'TECLADO COMEXA', model: 'CURTISA / CUTRON' },
    { category: CATEGORIES.ACCESO, device: 'TECLADO ESCLUSA', model: 'CUTRON' },

    // MISCELANEOS
    { category: CATEGORIES.MISCELANEOS, device: 'BOTAS AZULES', model: '' },
    { category: CATEGORIES.MISCELANEOS, device: 'JACKS (PATCHPANEL)', model: 'VARIOS' },
    { category: CATEGORIES.MISCELANEOS, device: 'LAMPARA LED', model: 'COMEXA' },

    // CABLEADO
    { category: CATEGORIES.CABLEADO, device: 'CABLE 2X18 (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'CABLE 4X22 (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'CABLE 6X22 (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'CABLE COAXIAL (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'CABLE DE USO RUDO 3X16 (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'CABLE UTP CAT 6 (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'CONECTOR P/ FLEXIBLE', model: 'PZA' },
    { category: CATEGORIES.CABLEADO, device: 'CONECTOR P/ LICUATITE', model: 'PZA' },
    { category: CATEGORIES.CABLEADO, device: 'FLEXIBLE 1/2" (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'FLEXIBLE 3/4" (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'LICUATITE (ML)', model: 'ML' },
    { category: CATEGORIES.CABLEADO, device: 'REGISTRO CON TAPA', model: 'PZA' },
    { category: CATEGORIES.CABLEADO, device: 'ABRAZADERAS TIPO UÑA', model: 'PZA' },

    // FUENTES
    { category: CATEGORIES.FUENTES, device: 'FUENTE DE ALIMENTACIÓN 10 AMP', model: 'AL-1012-UL-ACM' },
    { category: CATEGORIES.FUENTES, device: 'FUENTE DE ALIMENTACIÓN 3 AMP', model: 'SMP3' },
    { category: CATEGORIES.FUENTES, device: 'FUENTE DE ALIMENTACIÓN 5 AMP', model: 'SMP5' },
    { category: CATEGORIES.FUENTES, device: 'FUENTE DE ALIMENTACIÓN 6 AMP', model: 'AL600ULXB' },
  ],

  [CLIENTS.SANTANDER]: [
    // ALARMAS
    { category: CATEGORIES.ALARMAS, device: 'Panel de Alarma DMP', model: 'XR550' },
    { category: CATEGORIES.ALARMAS, device: 'Panel de Alarma Bosch', model: 'B9512G' },
    { category: CATEGORIES.ALARMAS, device: 'Tarjeta Módulo Expansor DMP', model: '716' },
    { category: CATEGORIES.ALARMAS, device: 'Tarjeta Módulo Expansor DMP', model: '714' },
    { category: CATEGORIES.ALARMAS, device: 'Tarjeta Expansor DMP', model: '711' },
    { category: CATEGORIES.ALARMAS, device: 'Módulo Expansor de Zona DMP', model: '711S' },
    { category: CATEGORIES.ALARMAS, device: 'Módulo de Rele DMP', model: '716' },
    { category: CATEGORIES.ALARMAS, device: 'Teclado (Command Center) DMP', model: 'P640HA' },
    { category: CATEGORIES.ALARMAS, device: 'Command Center DMP Inalámbrico', model: '7060-W' },
    { category: CATEGORIES.ALARMAS, device: 'Command Center Bosch', model: 'B920' },
    { category: CATEGORIES.ALARMAS, device: 'Command Center Bosch', model: 'D1255B' },
    { category: CATEGORIES.ALARMAS, device: 'Tarjeta Zonex Bosch', model: 'B600' },
    { category: CATEGORIES.ALARMAS, device: 'Octorelay Bosch', model: 'B308' },
    { category: CATEGORIES.ALARMAS, device: 'Tarjeta Popex Bosch', model: 'D8125' },
    { category: CATEGORIES.ALARMAS, device: 'Repetidor DMP', model: '1100R' },
    { category: CATEGORIES.ALARMAS, device: 'Comunicador Celular DMP', model: '263LTE' },
    { category: CATEGORIES.ALARMAS, device: 'Módulo Telefónico Bosch', model: 'B430' },
    { category: CATEGORIES.ALARMAS, device: 'Tarjeta Cell Bosch', model: 'B443' },
    { category: CATEGORIES.ALARMAS, device: 'Sensor de Movimiento (PIR) DMP', model: '1121 (DM 90)' },
    { category: CATEGORIES.ALARMAS, device: 'Sensor de Movimiento (PIR) DMP', model: '1127 (DM 90)' },
    { category: CATEGORIES.ALARMAS, device: 'Sensor de Movimiento (PIR) DMP', model: '1126 (DM 360)' },
    { category: CATEGORIES.ALARMAS, device: 'Detector Movimiento Bosch', model: 'DS936' },
    { category: CATEGORIES.ALARMAS, device: 'Detector Movimiento Bosch', model: 'ISC-PDL1-W18G' },
    { category: CATEGORIES.ALARMAS, device: 'Detector Movimiento Interlogix', model: '6530UCM' },
    { category: CATEGORIES.ALARMAS, device: 'Detector Movimiento Interlogix', model: '6550U' },
    { category: CATEGORIES.ALARMAS, device: 'Detector Movimiento Sentrol', model: 'RCR-C50' },
    { category: CATEGORIES.ALARMAS, device: 'Detector Ruptura Cristal (DRC) DMP', model: '1128' },
    { category: CATEGORIES.ALARMAS, device: 'DRC Interlogix', model: '5815-NT' },
    { category: CATEGORIES.ALARMAS, device: 'DRC Interlogix', model: 'R5815-NT' },
    { category: CATEGORIES.ALARMAS, device: 'DRC Bosch', model: 'DS1103i' },
    { category: CATEGORIES.ALARMAS, device: 'Detector de Humo (DH) System Sensor', model: 'C4-WB' },
    { category: CATEGORIES.ALARMAS, device: 'Detector de Humo (DH) System Sensor', model: '1412A' },
    { category: CATEGORIES.ALARMAS, device: 'Detector de Humo (DH) DMP', model: '1164' },
    { category: CATEGORIES.ALARMAS, device: 'Detector de Temperatura (DT) DMP', model: '1115' },
    { category: CATEGORIES.ALARMAS, device: 'Detector de Vibración (DV) Sentrol', model: '5402-W' },
    { category: CATEGORIES.ALARMAS, device: 'Detector de Vibración (DV) Honeywell', model: 'SC100' },
    { category: CATEGORIES.ALARMAS, device: 'Contacto Magnético (CM) Interlogix', model: '1078C-N / 1085T-N' },
    { category: CATEGORIES.ALARMAS, device: 'Contacto Magnético (CM) DMP', model: '1101/1106' },
    
    // ACCESO
    { category: CATEGORIES.ACCESO, device: 'Lector Wiegand DMP', model: '734' },
    { category: CATEGORIES.ACCESO, device: 'Lector Biométrico Spider', model: '3i SPIDER' },
    { category: CATEGORIES.ACCESO, device: 'Lector Biométrico Spider', model: '2e SPIDER' },
    { category: CATEGORIES.ACCESO, device: 'Accesor Nortek', model: '212ilw' },
    { category: CATEGORIES.ACCESO, device: 'Botón Pulsador de Salida DMP', model: 'CM-30E' },
    { category: CATEGORIES.ACCESO, device: 'Botón de Pánico (B.A.) DMP', model: '1142 / 1148-G' },
    { category: CATEGORIES.ACCESO, device: 'Botón de Pánico Bosch', model: 'RFPB-TB-A' },
    { category: CATEGORIES.ACCESO, device: 'Receptor Inalámbrico Bosch', model: 'B810' },
    { category: CATEGORIES.ACCESO, device: 'Receptor (RX) Seco-Larm', model: 'SK-910R4Q' },
    { category: CATEGORIES.ACCESO, device: 'Receptor (RX) Visonic', model: 'MCR-304 / MCR-308' },
    { category: CATEGORIES.ACCESO, device: 'Cerradura Spider', model: 'COM 102.0002 / PRO 102.0003' },
    { category: CATEGORIES.ACCESO, device: 'Cerradura Kaba', model: '252 P/CF / R100' },
    { category: CATEGORIES.ACCESO, device: 'Electroimán Seco-Larm', model: 'E941SA' },
    { category: CATEGORIES.ACCESO, device: 'Electroimán Securitron', model: 'M32' },
    { category: CATEGORIES.ACCESO, device: 'Contra Eléctrica Adams Rite', model: '7140-315' },
    { category: CATEGORIES.ACCESO, device: 'Interfón Aiphone', model: 'LEF-3 / IE-1AD' },

    // CCTV
    { category: CATEGORIES.CCTV, device: 'DVR Scati', model: 'SANM-W7E-X01-4TB' },
    { category: CATEGORIES.CCTV, device: 'NVR Scati', model: 'SANM-W7E-X02-24TB' },
    { category: CATEGORIES.CCTV, device: 'NVR Scati Serie G400', model: 'SANMJ24-W10-G516' },
    { category: CATEGORIES.CCTV, device: 'Disco Duro WD Purple', model: 'WD30PURX (3TB)' },
    { category: CATEGORIES.CCTV, device: 'Cámara Bala Sony', model: 'SSC-E473 / SSC-DC374' },
    { category: CATEGORIES.CCTV, device: 'Domo Bosch', model: 'VDN5085V' },
    { category: CATEGORIES.CCTV, device: 'Domo Samsung', model: 'SCV-3083N' },
    { category: CATEGORIES.CCTV, device: 'Domo Scati', model: 'SIM-3511VR-XYMA' },
    { category: CATEGORIES.CCTV, device: 'Domo Scati 360', model: 'SEM-3711NR-EAO' },
    { category: CATEGORIES.CCTV, device: 'Cámara Scati', model: 'SDL-3501NR1-XA-FR' },

    // MISCELANEOS (Seguridad Fisica)
    { category: CATEGORIES.MISCELANEOS, device: 'Caja Fuerte Tipo Ropero', model: 'Mosler / Magnum / Armstrong / BTV' },
    { category: CATEGORIES.MISCELANEOS, device: 'Caja de Transferencia', model: 'BTV CEN4' },
    { category: CATEGORIES.MISCELANEOS, device: 'Esclusa Unipersonal', model: 'Curtisa CM96' },
    { category: CATEGORIES.MISCELANEOS, device: 'Esclusa Cestek-Dimeyco', model: 'EMD-U / EMD-2 / EMD-4' },
    { category: CATEGORIES.MISCELANEOS, device: 'Puerta Blindada', model: 'Cestek-Dimeyco ANTF / PCO-N2' },
    { category: CATEGORIES.MISCELANEOS, device: 'Cierrapuertas Dorma', model: '7305 / TS COMPA' },
    { category: CATEGORIES.MISCELANEOS, device: 'Cierrapuertas Phillips', model: 'C-53 1404' },
    { category: CATEGORIES.MISCELANEOS, device: 'Roto Transfer', model: 'Cestek-Dimeyco RT-3' },

    // FUENTES / CABLEADO (Energía, Cables)
    { category: CATEGORIES.FUENTES, device: 'Fuente de Poder Altronix', model: 'SMP-3 / SMP-5 / SMP7' },
    { category: CATEGORIES.FUENTES, device: 'Transformador DMP', model: 'MGT1650' },
    { category: CATEGORIES.FUENTES, device: 'Batería 12V 7A', model: 'Epcom / Genesis' },
    { category: CATEGORIES.FUENTES, device: 'Pilas de Litio', model: 'CR2450, CR2032, CR2, 1/2AA' },
    { category: CATEGORIES.CABLEADO, device: 'Cable Coaxial', model: 'Belden RG59' },
    { category: CATEGORIES.CABLEADO, device: 'Cable UTP', model: 'Belden CAT6' },
    { category: CATEGORIES.CABLEADO, device: 'Cable Blindado', model: 'Belden 2x22 / 4x22' },
    { category: CATEGORIES.CABLEADO, device: 'Cable Uso Rudo', model: '3x16' },
    { category: CATEGORIES.CABLEADO, device: 'Tubería Flexible', model: 'Zapa (1", 3/4", 1/2", 3/8")' },
  ]
};
