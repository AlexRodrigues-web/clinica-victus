import { useState } from 'react';

export default function VideoNotes({ aula, notas, setNotas }) {
  const [nova, setNova] = useState('');

  const salvar = async () => {
    if (!nova.trim() || !aula) return;
    try {
      const res = await fetch(`/aula/${aula.id}/anotacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: nova })
      });
      const data = await res.json();
      if (data.sucesso) {
        setNotas(prev => [data.dado, ...prev]);
        setNova('');
      }
    } catch (e) {
      console.error('Erro ao salvar anotação', e);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: 12 }}>
        <textarea
          placeholder="Escreva suas anotações..."
          value={nova}
          onChange={e => setNova(e.target.value)}
          style={{ width: '100%', minHeight: 80, padding: 8, borderRadius: 6, background: '#1e1e1e', color: '#fff', border: '1px solid #333' }}
        />
        <button onClick={salvar} style={{ marginTop: 6, padding: '8px 16px', borderRadius: 6, background: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
          Salvar
        </button>
      </div>
      <div>
        {notas.length === 0 && <p style={{ color: '#ccc' }}>Nenhuma anotação ainda.</p>}
        {notas.map(n => (
          <div key={n.id} style={{ padding: 8, background: '#1e1e1e', borderRadius: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 12, marginBottom: 4, color: '#aaa' }}>{n.data_criacao}</div>
            <div>{n.texto}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
