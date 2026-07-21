import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function NoteCleanup() {
  const [rawNote, setRawNote] = useState('');
  const [cleanedNote, setCleanedNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCleanup = async () => {
    if (!rawNote.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/ai/notes/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw_note: rawNote }),
      });

      if (!response.ok) throw new Error('Failed to clean up note.');
      
      const data = await response.json();
      setCleanedNote(data.cleaned_note);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>✨ AI Note Cleanup</h2>
      
      <textarea
        value={rawNote}
        onChange={(e) => setRawNote(e.target.value)}
        placeholder="Paste your messy thoughts, brain dumps, or meeting notes here..."
        style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', fontFamily: 'inherit' }}
      />

      <button 
        onClick={handleCleanup}
        disabled={isLoading || !rawNote.trim()}
        style={{ padding: '10px 20px', backgroundColor: isLoading ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {isLoading ? 'Cleaning up...' : 'Clean Up Note ✨'}
      </button>

      {error && <div style={{ color: '#ef4444', marginTop: '16px' }}>{error}</div>}

      {cleanedNote && (
        <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1f2937' }}>Cleaned Plan:</h3>
          <ReactMarkdown>{cleanedNote}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}