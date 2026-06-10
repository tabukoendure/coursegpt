import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { hashFile, getCachedPdfText, cachePdfText } from './aiOptimizer';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

async function extractRawText(file: File): Promise<{ text: string; pages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 20);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  if (fullText.length > 20000) {
    fullText = fullText.substring(0, 20000);
  }
  return { text: fullText.trim(), pages: pdf.numPages };
}

export async function extractTextFromFile(file: File): Promise<{ text: string; pages: number; fromCache?: boolean }> {
  try {
    const fileHash = await hashFile(file);
    const cached = await getCachedPdfText(fileHash);
    if (cached) {
      console.log('PDF cache hit — skipping extraction');
      return { ...cached, fromCache: true };
    }
    const result = await extractRawText(file);
    await cachePdfText(fileHash, result.text, result.pages, file.size);
    return { ...result, fromCache: false };
  } catch (err) {
    console.error('extractTextFromFile error:', err);
    return extractRawText(file);
  }
}

export { hashFile };
