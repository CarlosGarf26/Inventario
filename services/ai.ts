import { GoogleGenAI, Type } from "@google/genai";

// Definimos la estructura de datos que esperamos que la IA nos devuelva
// Nota: Usamos 'Type' en lugar de 'SchemaType' conforme a la última versión del SDK.
const reportSchema = {
  type: Type.OBJECT,
  properties: {
    sctask: { type: Type.STRING, description: "El número de SCTASK o Ticket si aparece en el reporte." },
    reqo: { type: Type.STRING, description: "El número de REQO o Requerimiento." },
    folio_comexa: { type: Type.STRING, description: "El Folio Comexa si aparece en el reporte." },
    technician_name: { type: Type.STRING, description: "Nombre del técnico que realizó el servicio." },
    branch_identifier: { type: Type.STRING, description: "Código SIRH, Número de sucursal o Nombre de la sucursal/cliente." },
    report_date: { type: Type.STRING, description: "Fecha del reporte en formato YYYY-MM-DD." },
    installation_date: { type: Type.STRING, description: "Fecha de instalación/servicio en formato YYYY-MM-DD." },
    items: {
      type: Type.ARRAY,
      description: "Lista de materiales o dispositivos instalados/utilizados.",
      items: {
        type: Type.OBJECT,
        properties: {
          device_name: { type: Type.STRING, description: "Nombre del dispositivo o material." },
          quantity: { type: Type.NUMBER, description: "Cantidad utilizada." },
          item_category: { 
            type: Type.STRING, 
            enum: ["Material o refacción", "Equipo instalado"],
            description: "Clasificación del item: 'Material o refacción' para consumibles/partes, 'Equipo instalado' para dispositivos principales."
          }
        }
      }
    }
  },
  required: ["items"]
};

export const extractDataFromReport = async (fileBase64: string, mimeType: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Usamos gemini-2.5-flash por su rapidez y capacidad multimodal
    const model = 'gemini-2.5-flash';

    const prompt = `
      Analiza este reporte de servicio técnico de alarmas/CCTV.
      Extrae la información clave: SCTASK, REQO, Folio Comexa, Nombre del Técnico, Fechas y la tabla de materiales utilizados.
      
      Reglas Específicas:
      1. **Identificadores:** Busca SCTASK, REQO y el **Folio Comexa**.
      2. **Sucursal (SIRH):** Busca el identificador de la sucursal. En los reportes suele aparecer etiquetado como "SIRH", "Ceco", "ID" o muy comúnmente como "**# de sucursal**". Extrae ese valor numérico o alfanumérico.
      3. **Items:** Extrae la lista de materiales. Clasifica CADA item en una de estas dos categorías:
         - "Material o refacción": Para cables, conectores, baterías, tornillos, tubería, etc.
         - "Equipo instalado": Para cámaras, grabadores (DVR/NVR), paneles de alarma, sensores, teclados, etc.
      4. **Fechas:** Conviértelas estrictamente al formato ISO YYYY-MM-DD.
      5. Si no encuentras un valor, déjalo vacío.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        temperature: 0.1 // Bajo para ser más preciso y determinista
      }
    });

    // Obtener el texto y limpiarlo de posibles bloques markdown (```json ... ```)
    const rawText = response.text || "{}";
    const cleanText = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error analizando el reporte con IA:", error);
    throw error;
  }
};