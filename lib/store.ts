interface Store {
  pdfBase64: string | null;
  pdfMediaType: string | null;
  extractedText: string | null;
}

const globalStore = global as typeof global & { __store?: Store };

if (!globalStore.__store) {
  globalStore.__store = {
    pdfBase64: null,
    pdfMediaType: null,
    extractedText: null,
  };
}

export const store = globalStore.__store;