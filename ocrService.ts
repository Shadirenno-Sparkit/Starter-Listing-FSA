import { createWorker, PSM } from 'tesseract.js';

export class OCRService {
  private static worker: any | null = null;

  static async initializeWorker() {
    if (this.worker) {
      return this.worker;
    }

    try {
      this.worker = await createWorker();
      
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      
      // Configure for better recognition of alphanumeric codes
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_/\\:. ',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });

      console.log('OCR worker initialized');
      return this.worker;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw error;
    }
  }

  static async recognizeText(imageData: string | File | Blob): Promise<{ text: string; confidence: number }> {
    try {
      const worker = await this.initializeWorker();
      
      const { data } = await worker.recognize(imageData);
      
      return {
        text: data.text.trim(),
        confidence: data.confidence
      };
    } catch (error) {
      console.error('OCR recognition failed:', error);
      throw new Error('Failed to recognize text from image');
    }
  }

  static async recognizeErrorCode(imageData: string | File | Blob): Promise<{ 
    errorCode: string | null; 
    fullText: string; 
    confidence: number 
  }> {
    try {
      const result = await this.recognizeText(imageData);
      
      // Look for common error code patterns
      const errorCodePatterns = [
        /\b(?:ERROR|ERR|CODE|E)\s*[:-]?\s*(\d{1,4})\b/i,
        /\b([A-Z]+\d{1,4})\b/g,
        /\b(\d{1,4})\b/g,
      ];

      let errorCode: string | null = null;
      
      for (const pattern of errorCodePatterns) {
        const match = result.text.match(pattern);
        if (match) {
          errorCode = match[1] || match[0];
          break;
        }
      }

      return {
        errorCode,
        fullText: result.text,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Error code recognition failed:', error);
      throw error;
    }
  }

  static async recognizeBarcode(imageData: string | File | Blob): Promise<{ 
    barcode: string | null; 
    text: string; 
    confidence: number 
  }> {
    try {
      // Configure Tesseract for barcode recognition
      const worker = await this.initializeWorker();
      
      // Set parameters for better barcode recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      
      const { data } = await worker.recognize(imageData);
      const fullText = data.text.trim();
      
      // Look for common barcode patterns (UPC, EAN, Code 128, etc.)
      const barcodePatterns = [
        /^\d{12,14}$/, // UPC/EAN codes
        /^[A-Z0-9]{6,20}$/, // General alphanumeric codes
        /^\d{6,20}$/, // Numeric codes
        /^[A-Z]{2,4}\d{4,12}$/, // Manufacturer codes (e.g., ABC1234567)
        /^\d{4}-\d{4}-\d{4}$/, // Formatted codes
      ];

      let barcode: string | null = null;
      
      // Clean up the text first
      const cleanText = fullText.replace(/[^A-Z0-9-]/g, '');
      
      for (const pattern of barcodePatterns) {
        if (pattern.test(cleanText)) {
          barcode = cleanText;
          break;
        }
        if (pattern.test(fullText)) {
          barcode = fullText;
          break;
        }
      }

      // If no pattern match, use the first long sequence of numbers/letters
      if (!barcode && cleanText.length >= 6) {
        barcode = cleanText;
      }

      // Reset parameters back to default for other uses
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_/\\:. ',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });

      return {
        barcode,
        text: fullText,
        confidence: data.confidence
      };
    } catch (error) {
      console.error('Barcode recognition failed:', error);
      throw error;
    }
  }

  static async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}