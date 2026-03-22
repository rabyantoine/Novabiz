export default function Home() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #FAF8F4; color: #0B1F45; }
        nav { background: #0B1F45; padding: 0 2rem; height: 64px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(200,151,58,0.2); }
        .logo { font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #fff; }
        .logo span { color: #C8973A; }
        .btn-gold { background: #C8973A; border: none; color: #fff; padding: 10px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
        .hero { background: #0B1F45; padding: 100px 2rem 80px; text-align: center; }
        .hero h1 { font-family: Georgia, serif; font-size: 62px; font-weight: 800; color: #fff; line-height: 1.05; margin-bottom: 24px; }
        .hero h1 em { color: #C8973A; font-style: normal; }
        .hero p { font-size: 18px; color: rgba(255,255,255,0.6); max-width: 500px; margin: 0 auto 40px; }
        .hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .btn-hero { background: #C8973A; border: none; color: #fff; padding: 15px 36px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 15px 36px; border-radius: 10px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; }
        .stats { display: flex; justify-content: center; gap: 60px; padding: 40px 2rem; background: #fff; flex-wrap: wrap; }
        .stat-num { font-family: Georgia, serif; font-size: 36px; font-weight: 800; color: #C8973A; }
        .stat-label { font-size: 13px; color: #4A5568; }
        .section { padding: 80px 2rem; max-width: 1100px; margin: 0 auto; }
        .tag { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #C8973A; margin-bottom: 14px; }
        .section-h { font-family: Georgia, serif; font-size: 42px; font-weight: 800; color: #0B1F45; max-width: 500px; line-height: 1.1; margin-bottom: 48px; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2px; background: rgba(11,31,69,0.1); border-radius: 16px; overflow: hidden; }
        .feat { background: #fff; padding: 32px; }
        .feat-num { font-family: Georgia, serif; font-size: 36px; font-weight: 800; color: #E8E3D8; margin-bottom: 16px; }
        .feat h3 { font-size: 17px; font-weight: 600; margin-bottom: 10px; }
        .feat p { font-size: 14px; color: #4A5568; line-height: 1.7; }
        .pricing-bg { background: #F3F0EA; padding: 80px 2rem; }
        .pricing-inner { max-width: 1000px; margin: 0 auto; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 20px; }
        .price-card { background: #fff; border: 1px solid rgba(11,31,69,0.1); border-radius: 16px; padding: 36px; }
        .price-card.featured { border: 2px solid #C8973A; background: #0B1F45; }
        .price-name { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #0B1F45; margin-bottom: 16px; }
        .price-card.featured .price-name { color: #fff; }
        .price-eur { font-family: Georgia, serif; font-size: 48px; font-weight: 800; color: #C8973A; }
        .price-per { font-size: 14px; color: #8A92A3; }
        .price-card.featured .price-per { color: rgba(255,255,255,0.5); }
        .price-list { list-style: none; margin: 20px 0 28px; }
        .price-list li { font-size: 14px; color: #4A5568; padding: 8px 0; border-bottom: 1px solid rgba(11,31,69,0.08); }
        .price-card.featured .price-list li { color: rgba(255,255,255,0.75); border-color: rgba(255,255,255,0.1); }
        .cta-banner { background: #0B1F45; padding: 80px 2rem; text-align: center; }
        .cta-banner h2 { font-family: Georgia, serif; font-size: 48px; font-weight: 800; color: #fff; margin-bottom: 16px; }
        .cta-banner p { font-size: 17px; color: rgba(255,255,255,0.55); margin-bottom: 36px; }
        footer { background: #070F22; padding: 40px 2rem; text-align: center; }
        footer p { font-size: 13px; color: rgba(255,255,255,0.3); }
      `}</style>

      <nav>
        <div className="logo">Nova<span>Biz</span></div>
        <a href="/signup" className="btn-gold">Essai gratuit →</a>
      </nav>

      <section className="hero">
        <h1>Pilotez votre entreprise.<br/><em>Pas votre paperasse.</em></h1>
        <p>Factures, relances IA, notes de frais et projets. Tout au même endroit.</p>
        <div className="hero-btns">
          <a href="/signup" className="btn-hero">Démarrer gratuitement →</a>
          <a href="#pricing" className="btn-outline">Voir les tarifs</a>
        </div>
      </section>

      <div className="stats">
        <div><div className="stat-num">2min</div><div className="stat-label">Pour créer une facture</div></div>
        <div><div className="stat-num">-68%</div><div className="stat-label">D&apos;impayés en moyenne</div></div>
        <div><div className="stat-num">500+</div><div className="stat-label">PME déjà inscrites</div></div>
        <div><div className="stat-num">99.9%</div><div className="stat-label">Disponibilité</div></div>
      </div>

      <div className="section">
        <div className="tag">Fonctionnalités</div>
        <div className="section-h">Tout ce qu&apos;il faut. Rien de superflu.</div>
        <div className="features-grid">
          <div className="feat"><div className="feat-num">01</div><h3>Devis & Factures</h3><p>Créez des factures professionnelles en 2 minutes. Envoi automatique, PDF téléchargeable.</p></div>
          <div className="feat"><div className="feat-num">02</div><h3>Relances IA</h3><p>L&apos;IA rédige des relances personnalisées selon le profil de chaque client.</p></div>
          <div className="feat"><div className="feat-num">03</div><h3>Notes de frais</h3><p>Photo du ticket, extraction automatique, validation et export comptable.</p></div>
          <div className="feat"><div className="feat-num">04</div><h3>Gestion de projets</h3><p>Liez vos projets à vos factures. Suivez l&apos;avancement en temps réel.</p></div>
        </div>
      </div>

      <div className="pricing-bg" id="pricing">
        <div className="pricing-inner">
          <div className="tag">Tarifs</div>
          <div className="section-h" style={{marginBottom:'40px'}}>Simple et transparent</div>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="price-name">Starter</div>
              <div><span className="price-eur">39€</span><span className="price-per">/mois</span></div>
              <ul className="price-list">
                <li>✓ 30 factures/mois</li>
                <li>✓ 10 relances/mois</li>
                <li>✓ 1 utilisateur</li>
                <li>✓ Support email</li>
              </ul>
              <a href="/signup" className="btn-gold" style={{display:'block',textAlign:'center',padding:'13px'}}>Commencer</a>
            </div>
            <div className="price-card featured">
              <div className="price-name">Business</div>
              <div><span className="price-eur">79€</span><span className="price-per">/mois</span></div>
              <ul className="price-list">
                <li>✓ Factures illimitées</li>
                <li>✓ Relances IA 30/mois</li>
                <li>✓ 5 utilisateurs</li>
                <li>✓ Support prioritaire</li>
              </ul>
              <a href="/signup" className="btn-gold" style={{display:'block',textAlign:'center',padding:'13px'}}>Commencer →</a>
            </div>
            <div className="price-card">
              <div className="price-name">Premium</div>
              <div><span className="price-eur">149€</span><span className="price-per">/mois</span></div>
              <ul className="price-list">
                <li>✓ Tout illimité</li>
                <li>✓ IA illimitée</li>
                <li>✓ Utilisateurs illimités</li>
                <li>✓ Support dédié 24/7</li>
              </ul>
              <a href="/signup" style={{display:'block',textAlign:'center',padding:'13px',background:'none',border:'1px solid rgba(11,31,69,0.2)',borderRadius:'10px',cursor:'pointer',fontSize:'14px',color:'#0B1F45',textDecoration:'none'}}>Nous contacter</a>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-banner">
        <h2>Prêt à vous lancer ?</h2>
        <p>14 jours gratuits. Sans carte bancaire.</p>
        <a href="/signup" className="btn-hero">Démarrer maintenant →</a>
      </div>

      <footer>
        <p>© 2026 NovaBiz — Fait avec soin en France 🇫🇷</p>
      </footer>
    </>
  )
}