// views.js — pagine pubbliche del negozio. I dati vengono da STATE (già caricato dal server).

function overallAvgRating(){ return STATE.stats.avgRating || 0; }

function paymentMethodsText(){
  const s=STATE.settings; const list=[];
  if(s.payPaypal) list.push('PayPal'); if(s.payCard) list.push('Carta di credito'); if(s.payCrypto) list.push('Criptovalute');
  return 'Accettiamo ' + (list.join(', ') || 'diversi metodi di pagamento') + '.';
}
function faqItem(q,a){
  return '<div class="faq-item"><div class="faq-q" data-faq><span>'+esc(q)+'</span><span class="plus">+</span></div><div class="faq-a">'+esc(a)+'</div></div>';
}
function productCard(p){
  const rating = avgRating(p.id);
  return `<div class="pcard" data-open-product="${p.id}">
    <div class="pcard-media" style="${mediaStyle(p.color)}"><span class="pcard-cat">${CATS[p.category].label}</span>${p.icon}</div>
    <h3>${esc(p.name)}</h3><p class="pdesc">${esc(p.description)}</p>
    <div class="pcard-foot"><div class="price">${euro(p.price)}${p.billing?('<small><br>'+esc(p.billing)+'</small>'):''}</div>
    <div class="stars">${rating?starRow(rating):'—'}</div></div></div>`;
}
function reviewCard(r){
  const p = STATE.products.find(x=>x.id===r.product_id);
  return `<div class="rev-card"><span class="stars">${starRow(r.rating)}</span><p>"${esc(r.text)}"</p>
    <div class="rev-who"><div class="rev-avatar">${esc(r.name.charAt(0))}</div>
      <div><b>${esc(r.name)}</b><span>${p?esc(p.name):'Cliente verificato'}</span></div></div></div>`;
}

function viewHome(){
  const s = STATE.settings;
  const featured = STATE.products.slice(0,6);
  const reviews = STATE.reviews.slice(0,3);
  return `
  <section class="hero"><div class="wrap hero-grid">
    <div>
      <div class="eyebrow-tag"><span class="dot"></span> Consegna istantanea su tutti i prodotti</div>
      <h1>Tutto il digitale di cui hai bisogno, in un <span class="grad">unico hub</span>.</h1>
      <p class="hero-sub">${esc(s.heroSubtitle)}</p>
      <div class="hero-cta"><a href="#catalog" data-nav="catalog" class="btn btn-primary">Sfoglia il catalogo</a>
        <a href="#home" data-nav="home" data-scroll="faq" class="btn btn-ghost">Come funziona</a></div>
      <div class="hero-stats">
        <div class="hero-stat"><b>${STATE.stats.activeProducts}+</b><span>Prodotti attivi</span></div>
        <div class="hero-stat"><b>${STATE.stats.totalOrders}+</b><span>Ordini gestiti</span></div>
        <div class="hero-stat"><b>${overallAvgRating() ? overallAvgRating().toFixed(1) : '5.0'}/5</b><span>Valutazione media</span></div>
      </div>
    </div>
    <div class="hero-visual" aria-hidden="true">
      <div class="floating-card fc-1"><div class="fc-icon">🎨</div><h4>Prodotti Digitali</h4><p>Template, ebook, asset pronti</p></div>
      <div class="floating-card fc-2"><div class="fc-icon">🔑</div><h4>Licenze Software</h4><p>Attivazione immediata</p></div>
      <div class="floating-card fc-3"><div class="fc-icon">💬</div><h4>Abbonamenti</h4><p>Community e strumenti riservati</p></div>
    </div>
  </div></section>
  <section><div class="wrap">
    <div class="section-head"><div><h2>In evidenza</h2><p>Una selezione dal catalogo, aggiornata regolarmente.</p></div>
      <a href="#catalog" data-nav="catalog" class="btn btn-soft btn-sm">Vedi tutto</a></div>
    <div class="grid-products">${featured.map(productCard).join('')}</div>
  </div></section>
  <section><div class="wrap">
    <div class="section-head"><div><h2>Perché scegliere ${esc(s.siteName)}</h2></div></div>
    <div class="why-grid">
      <div class="why-card"><div class="wi">⚡</div><h3>Consegna istantanea</h3><p>Ricevi prodotti, licenze e accessi subito dopo l'acquisto, senza attese.</p></div>
      <div class="why-card"><div class="wi">🛡️</div><h3>Acquisti garantiti</h3><p>Supporto reale e politica di rimborso chiara su ogni ordine.</p></div>
      <div class="why-card"><div class="wi">🔄</div><h3>Aggiornamenti inclusi</h3><p>Licenze e abbonamenti restano sempre aggiornati all'ultima versione.</p></div>
    </div>
  </div></section>
  <section><div class="wrap">
    <div class="section-head"><div><h2>Cosa dicono i clienti</h2></div></div>
    <div class="rev-strip">${reviews.map(reviewCard).join('') || '<p style="color:var(--text-faint);">Ancora nessuna recensione.</p>'}</div>
  </div></section>
  <section id="faq"><div class="wrap page-narrow" style="max-width:720px;">
    <div class="section-head" style="margin-bottom:10px;"><div><h2>Domande frequenti</h2></div></div>
    ${faqItem('Come ricevo il prodotto dopo l\u2019acquisto?','Immediatamente dopo la conferma, trovi il prodotto nella pagina "I miei ordini" e via email.')}
    ${faqItem('Quali metodi di pagamento accettate?', paymentMethodsText())}
    ${faqItem('Posso richiedere un rimborso?','Sì, entro 14 giorni per i prodotti non ancora attivati. Contattaci dal supporto.')}
    ${faqItem('Le licenze includono gli aggiornamenti?','Sì, tutte le licenze e gli abbonamenti includono gli aggiornamenti per tutta la durata.')}
  </div></section>`;
}

function viewCatalog(){
  const activeCat = route.params.cat || 'all';
  const tabs = [['all','Tutti'],['digital','Prodotti Digitali'],['license','Licenze Software'],['subscription','Abbonamenti']];
  const list = STATE.products.filter(p=>activeCat==='all' || p.category===activeCat);
  return `<section style="padding-top:44px;"><div class="wrap">
    <div class="section-head"><div><h2>Catalogo</h2><p>${list.length} prodotti disponibili.</p></div></div>
    <div class="cat-tabs">${tabs.map(([key,label])=>`<a href="#catalog${key==='all'?'':'?cat='+key}" data-nav="catalog" class="cat-tab ${activeCat===key?'active':''}">${label}</a>`).join('')}</div>
    <div class="grid-products">${list.map(productCard).join('') || '<p style="color:var(--text-faint);">Nessun prodotto in questa categoria al momento.</p>'}</div>
  </div></section>`;
}

function viewCheckout(){
  if(!CART.length){
    return `<section style="padding-top:70px;"><div class="wrap page-narrow"><div class="empty-state"><div class="es-icon">🛒</div><p>Il tuo carrello è vuoto.</p>
    <div style="margin-top:20px;"><a href="#catalog" data-nav="catalog" class="btn btn-primary">Vai al catalogo</a></div></div></div></section>`;
  }
  const s = STATE.settings;
  const lines = CART.map(i=>{
    const p = STATE.products.find(x=>x.id===i.id); if(!p) return '';
    return `<div class="summary-line"><span>${esc(p.name)} × ${i.qty}</span><span>${euro(p.price*i.qty)}</span></div>`;
  }).join('');
  return `<section style="padding-top:44px;"><div class="wrap">
    <div class="section-head"><div><h2>Checkout</h2><p>Ultimo passo prima della consegna istantanea.</p></div></div>
    <div class="checkout-grid">
      <form id="checkout-form">
        <div class="field"><label>Nome e cognome</label><input required name="name" placeholder="Mario Rossi"></div>
        <div class="field"><label>Email</label><input required type="email" name="email" placeholder="mario@email.com"></div>
        <div class="field"><label>Note (opzionale)</label><textarea name="notes" placeholder="Eventuali richieste particolari"></textarea></div>
        <div class="field"><label>Metodo di pagamento</label><div class="pay-options">
          ${s.payPaypal?'<label class="pay-opt selected"><input type="radio" name="pay" value="PayPal" checked>PayPal</label>':''}
          ${s.payCard?'<label class="pay-opt"><input type="radio" name="pay" value="Carta">Carta</label>':''}
          ${s.payCrypto?'<label class="pay-opt"><input type="radio" name="pay" value="Crypto">Crypto</label>':''}
        </div></div>
        <p style="font-size:.78rem;color:var(--text-faint);margin-bottom:20px;">Il pagamento in questa demo è simulato: nessun addebito reale viene effettuato. Per accettare pagamenti veri collega un gateway (es. Stripe o PayPal Checkout).</p>
        <button type="submit" class="btn btn-primary btn-block">Conferma ordine · ${euro(cartTotal())}</button>
      </form>
      <div class="summary-box"><h3 style="font-size:1rem;margin-bottom:14px;">Riepilogo ordine</h3>${lines}
        <div class="summary-total"><span>Totale</span><span>${euro(cartTotal())}</span></div></div>
    </div>
  </div></section>`;
}

async function viewConfirmation(orderId){
  let order = null;
  try{ order = await API.get('/orders/'+encodeURIComponent(orderId)); }catch(e){}
  return `<section style="padding-top:60px;"><div class="wrap page-narrow"><div class="confirm-box">
    <div class="confirm-check">✓</div><h2>Ordine confermato</h2>
    <p style="color:var(--text-dim);margin-top:10px;">Grazie${order?', '+esc(order.name.split(' ')[0]):''}! Riceverai i dettagli via email a breve.</p>
    <div class="order-id-tag">Ordine ${order?esc(order.id):''}</div>
    <div style="margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <a href="#account" data-nav="account" class="btn btn-soft">Vai ai miei ordini</a>
      <a href="#catalog" data-nav="catalog" class="btn btn-primary">Continua lo shopping</a>
    </div></div></div></section>`;
}

function viewAccount(){
  return `<section style="padding-top:44px;"><div class="wrap page-narrow">
    <div class="section-head"><div><h2>I tuoi ordini</h2><p>Inserisci l'ID ordine ricevuto via email per controllarne lo stato.</p></div></div>
    <form id="order-lookup-form" style="margin-bottom:24px;display:flex;gap:10px;">
      <input name="orderId" placeholder="es. ORD-1234" style="flex:1;padding:12px 14px;border-radius:8px;border:1px solid var(--border);background:var(--bg-3);color:var(--text);">
      <button class="btn btn-primary" type="submit">Cerca</button>
    </form>
    <div id="order-lookup-result"></div>
  </div></section>`;
}
function orderRowPublic(o){
  return `<div class="order-row"><div class="row-between" style="margin-bottom:8px;">
    <b style="font-family:var(--font-display);">${esc(o.id)}</b>
    <span class="status-pill status-${o.status}">${statusLabel(o.status)}</span></div>
    <div style="font-size:.85rem;color:var(--text-faint);margin-bottom:6px;">${new Date(Number(o.created_at)).toLocaleDateString('it-IT')} · ${o.items.length} articoli</div>
    <div style="font-size:.9rem;color:var(--text-dim);">${o.items.map(i=>esc(i.name)+' ×'+i.qty).join(', ')}</div>
    <div class="row-between" style="margin-top:10px;"><span style="color:var(--text-faint);font-size:.82rem;">Totale</span><b>${euro(o.total)}</b></div>
  </div>`;
}

function openProductModal(id){
  const p = STATE.products.find(x=>x.id===id); if(!p) return;
  const revs = STATE.reviews.filter(r=>r.product_id===id);
  const rating = avgRating(id);
  openModal(`
    <div class="pd-media" style="${mediaStyle(p.color)}">${p.icon}</div>
    <div class="pd-meta"><span class="badge ${CATS[p.category].badgeClass}">${CATS[p.category].label}</span>
      ${rating?'<span class="stars">'+starRow(rating)+' ('+revs.length+')</span>':''}</div>
    <h2 class="pd-title">${esc(p.name)}</h2><p class="pd-desc">${esc(p.description)}</p>
    <div class="pd-price-row"><div class="price" style="font-size:1.6rem;">${euro(p.price)}${p.billing?('<small> / '+esc(p.billing)+'</small>'):''}</div>
      <button class="btn btn-primary" data-add-cart="${p.id}">Aggiungi al carrello</button></div>
    ${revs.length? '<div style="margin-top:26px;border-top:1px solid var(--border);padding-top:20px;">'+revs.map(reviewCard).join('')+'</div>' : ''}
  `, true);
}

function openLegal(kind){
  const s = STATE.settings;
  const content = {
    terms:'Utilizzando '+s.siteName+' accetti le presenti condizioni. I prodotti digitali sono concessi in licenza d\u2019uso personale salvo diversa indicazione. Il tentativo di rivendita non autorizzata non è consentito. Per domande scrivi a '+s.supportEmail+'.',
    privacy:'Raccogliamo solo i dati necessari a evadere il tuo ordine (nome, email). Non condividiamo i tuoi dati con terze parti a scopo pubblicitario. Puoi richiedere la cancellazione dei tuoi dati scrivendo a '+s.supportEmail+'.',
    refund:'Puoi richiedere un rimborso entro 14 giorni dall\u2019acquisto per prodotti non ancora attivati o utilizzati. Scrivi a '+s.supportEmail+' indicando il numero d\u2019ordine.'
  };
  const titles = {terms:'Termini di servizio', privacy:'Privacy policy', refund:'Politica di rimborso'};
  openModal('<h2 style="margin-bottom:16px;">'+titles[kind]+'</h2><p style="color:var(--text-dim);font-size:.92rem;">'+esc(content[kind])+'</p>');
}
