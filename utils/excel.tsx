// utils/excel.ts
import XLSX from 'xlsx';

export const parseExcel = async (arrayBuffer: ArrayBuffer): Promise<any[]> => {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws);
};
