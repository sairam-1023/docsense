import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { extractPdfText } from '@/lib/extractPdf';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.type === 'application/pdf') {
      store.pdfBase64 = buffer.toString('base64');
      store.pdfMediaType = 'application/pdf';
      // Extract clean text from PDF right here on upload
      store.extractedText = await extractPdfText(buffer);
    } else if (file.type === 'text/plain') {
      store.pdfBase64 = buffer.toString('base64');
      store.pdfMediaType = 'text/plain';
      store.extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Only PDF and .txt files are supported' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Document uploaded successfully',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}