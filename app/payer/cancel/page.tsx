export default function PayerCancelPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.6rem',
          fontWeight: 'bold',
          color: '#0B1F45',
          letterSpacing: '0.05em',
        }}>
          Nova<span style={{ color: '#C8973A' }}>Biz</span>
        </span>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e8e0d0',
        borderRadius: '12px',
        padding: '2rem 2.5rem',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 2px 16px rgba(11,31,69,0.07)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❌</p>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.2rem',
          color: '#0B1F45',
          marginBottom: '1.5rem',
        }}>
          Paiement annulé.
        </p>
        <a
          href="/"
          style={{
            color: '#C8973A',
            fontFamily: 'Georgia, serif',
            fontSize: '0.9rem',
            textDecoration: 'none',
            borderBottom: '1px solid #C8973A',
          }}
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  )
}
