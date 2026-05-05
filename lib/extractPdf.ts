import PDFParser from 'pdf2json';

export function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (err: any) => {
      reject(err);
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      const text = pdfData.Pages.map((page: any) =>
        page.Texts.map((t: any) =>
          decodeURIComponent(t.R.map((r: any) => r.T).join(''))
        ).join(' ')
      ).join('\n\n');
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}