'use client';

import { useState, useRef } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadStatus('Processing document...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        setUploadStatus('✅ Ready! Document uploaded successfully.');
      } else {
        setUploadStatus(`❌ ${data.error}`);
      }
    } catch {
      setUploadStatus('❌ Upload failed. Check your connection.');
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk() {
    if (!question.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: assistantText,
          };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '❌ Something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">DocSense</h1>
          <p className="text-gray-600 mt-1">Upload a document, ask it anything</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-3">1. Upload your document</h2>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <p className="text-gray-900 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">Click to select a PDF or .txt file</p>
                <p className="text-gray-500 text-sm mt-1">Max ~50 pages works best</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={e => {
              setFile(e.target.files?.[0] || null);
              setUploadStatus('');
            }}
          />

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-4 w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium
                       hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Indexing document...' : 'Upload & Index'}
          </button>

          {uploadStatus && (
            <p className="mt-3 text-sm text-gray-800">{uploadStatus}</p>
          )}
        </div>

        {/* Chat Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-3">2. Ask questions</h2>

          {/* Messages */}
          <div className="space-y-4 mb-4 min-h-[80px]">
            {messages.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">
                Upload a document above, then ask anything about it
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  {msg.content}
                  {msg.role === 'assistant' && loading && i === messages.length - 1 && (
                    <span className="inline-block w-1 h-4 bg-gray-400 ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="What is this document about?"
              style={{ color: '#111827' }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400
                         placeholder:text-gray-400"
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium
                         hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}