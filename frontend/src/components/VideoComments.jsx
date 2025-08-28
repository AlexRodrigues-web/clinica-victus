// src/components/VideoComments.jsx
import { useState } from 'react';

export default function VideoComments({ aula, comentarios, setComentarios }) {
  const [nova, setNova] = useState('');

  const enviar = async () => {
    if (!nova.trim() || !aula) return;
    try {
      const res = await fetch(`/aula/${aula.id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: nova })
      });
      const data = await res.json();
      if (data.sucesso) {
        setComentarios(prev => [data.dado || data.dados || {}, ...prev]);
        setNova('');
      }
    } catch (e) {
      console.error('Erro ao enviar comentário', e);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: 12 }}>
        <textarea
          placeholder="Escreva um comentário..."
          value={nova}
          onChange={e => setNova(e.target.value)}
          style={{
            width: '100%',
            minHeight: 80,
            padding: 8,
            borderRadius: 6,
            background: '#1e1e1e',
            color: '#fff',
            border: '1px solid #333'
          }}
        />
        <button
          onClick={enviar}
          style={{
            marginTop: 6,
            padding: '8px 16px',
            borderRadius: 6,
            background: 'var(--accent)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Enviar
        </button>
      </div>
      <div>
        {(!comentarios || comentarios.length === 0) && (
          <p style={{ color: '#ccc' }}>Sem comentários ainda.</p>
        )}
        {comentarios.map(c => (
          <div
            key={c.id || Math.random()}
            style={{
              padding: 8,
              background: '#1e1e1e',
              borderRadius: 6,
              marginBottom: 8
            }}
          >
            <div style={{ fontSize: 12, marginBottom: 4, color: '#aaa' }}>
              {c.autor_nome || 'Usuário'}
            </div>
            <div>{c.texto}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
