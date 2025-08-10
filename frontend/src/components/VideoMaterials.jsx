export default function VideoMaterials({ materiais }) {
  return (
    <div style={{ padding: '1rem' }}>
      {(!materiais || materiais.length === 0) && <p style={{ color: '#ccc' }}>Nenhum material relacionado.</p>}
      {materiais.map(m => (
        <div
          key={m.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 12,
            background: '#1e1e1e',
            borderRadius: 6,
            marginBottom: 8,
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{m.titulo}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{m.tipo}</div>
          </div>
          <a
            href={m.url_arquivo}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--accent)',
              padding: '6px 12px',
              borderRadius: 6,
              color: '#000',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Abrir
          </a>
        </div>
      ))}
    </div>
  );
}
