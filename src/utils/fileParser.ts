import { WeatherCondition, TafReport } from '../types';
import { parseMetarOrSpeci, parseTaf } from './tafEvaluator';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ParsedReports {
  tafs: TafReport[];
  observations: WeatherCondition[];
  rawText: string;
  referenceMonthYear: string;
  fileHeader?: string;
}

// Utility to parse month/year and header from the first line or non-empty non-report lines of the file
export function getReferenceDateInfo(text: string): { monthYearStr: string; fullHeader?: string } {
  if (!text) {
    const now = new Date();
    return { monthYearStr: `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}` };
  }
  
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    const now = new Date();
    return { monthYearStr: `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}` };
  }

  // Find the first line that is not a raw meteorological report
  let headerLine = "";
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith('TAF') || upper.startsWith('METAR') || upper.startsWith('SPECI') || upper.startsWith('AAXX') || upper.startsWith('TTYY')) {
      continue;
    }
    // Found a potential header line
    headerLine = line;
    break;
  }

  if (headerLine) {
    // Try to find patterns like "Tháng XX năm YYYY" or "Tháng XX/YYYY" or "XX/YYYY"
    const monthYearRegexes = [
      /(tháng\s+\d+\s+năm\s+\d+)/i,
      /(tháng\s+\d+[\/\-]\d+)/i,
      /(\d+[\/\-]\d{4})/,
      /(tháng\s+\d+)/i
    ];

    for (const regex of monthYearRegexes) {
      const match = headerLine.match(regex);
      if (match) {
        return {
          monthYearStr: match[1].trim(),
          fullHeader: headerLine
        };
      }
    }

    return {
      monthYearStr: headerLine.length > 60 ? headerLine.slice(0, 60) + "..." : headerLine,
      fullHeader: headerLine
    };
  }

  const now = new Date();
  return { monthYearStr: `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}` };
}

// Extract TAFs and METARs from raw text
export function parseReportsFromText(text: string): ParsedReports {
  const tafs: TafReport[] = [];
  const observations: WeatherCondition[] = [];

  // Split by '=' first, which is the standard separator for aeronautical bulletins
  const parts = text.split('=');

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    const normalized = part.replace(/\s+/g, ' ');

    // Check if it's a TAF
    if (normalized.startsWith('TAF') || normalized.includes('TAF ') || normalized.includes('TAF\n')) {
      // Clean up TAF
      const cleanTaf = part + ' =';
      const parsed = parseTaf(cleanTaf);
      if (parsed) {
        tafs.push(parsed);
      }
    } else {
      // Check if it's METAR or SPECI
      const cleanObs = part + ' =';
      const parsed = parseMetarOrSpeci(cleanObs);
      if (parsed) {
        observations.push(parsed);
      } else {
        // Fallback: try parsing line by line in case some reports are not separated by '='
        const lines = part.split(/\r?\n/);
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          const parsedLine = parseMetarOrSpeci(trimmedLine + ' =');
          if (parsedLine) {
            observations.push(parsedLine);
          }
        }
      }
    }
  }

  // If no TAFs were found, search line-by-line as fallback
  if (tafs.length === 0) {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      if (trimmedLine.startsWith('TAF') || trimmedLine.includes('TAF ')) {
        const parsed = parseTaf(trimmedLine + ' =');
        if (parsed) {
          tafs.push(parsed);
        }
      }
    }
  }

  const dateInfo = getReferenceDateInfo(text);

  return {
    tafs,
    observations,
    rawText: text,
    referenceMonthYear: dateInfo.monthYearStr,
    fileHeader: dateInfo.fullHeader
  };
}

// Convert HTML to simple text
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Parse file content based on extension
export async function parseFile(file: File): Promise<ParsedReports> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (extension === 'txt' || extension === 'csv') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(parseReportsFromText(text));
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file text.'));
      reader.readAsText(file);

    } else if (extension === 'html') {
      reader.onload = (e) => {
        const html = e.target?.result as string;
        const text = stripHtml(html);
        resolve(parseReportsFromText(text));
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file HTML.'));
      reader.readAsText(file);

    } else if (extension === 'docx') {
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(parseReportsFromText(result.value));
        } catch (error) {
          reject(new Error('Lỗi khi phân giải file .docx: ' + (error as Error).message));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file Word.'));
      reader.readAsArrayBuffer(file);

    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          let text = '';
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            text += XLSX.utils.sheet_to_txt(worksheet) + '\n';
          });
          resolve(parseReportsFromText(text));
        } catch (error) {
          reject(new Error('Lỗi khi phân giải file Excel: ' + (error as Error).message));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file Excel.'));
      reader.readAsArrayBuffer(file);

    } else {
      reject(new Error('Định dạng file không được hỗ trợ. Hãy tải lên .txt, .docx, .xlsx, .csv hoặc .html.'));
    }
  });
}
