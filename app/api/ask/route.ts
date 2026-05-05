import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { store } from '@/lib/store';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question) {
      return new Response('Question is required', { status: 400 });
    }

    if (!store.extractedText) {
      return new Response('No document uploaded yet. Please upload a file first.', {
        status: 400,
      });
    }

    // Trim to 6000 chars to stay within Groq's context limit
    const docContent = store.extractedText.slice(0, 6000);

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that answers questions based strictly on the provided document content. If the answer is not in the document, say so clearly.',
        },
        {
          role: 'user',
          content: `Here is the document content:\n\n${docContent}\n\nQuestion: ${question}`,
        },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Ask error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Error: ${message}`, { status: 500 });
  }
}