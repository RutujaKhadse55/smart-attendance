// utils/csv.ts
import Papa from 'papaparse';

type PapaParseResult = {
  data: any[];
  errors: any[];
  meta: any;
};

export const parseCSV = async (content: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (res: PapaParseResult) => resolve(res.data),
      error: (err: any) => reject(err),
    });
  });
