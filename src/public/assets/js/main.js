// main.js — punto di ingresso: init app, listener globali (click/submit/change).
(function(){
"use strict";

document.addEventListener('click', function(e){
  const navEl = e.target.closest('[data-nav]');
  if(navEl){
    if(navEl.hasAttribute('data-close-cart')) closeCart();
    // I <button> con data-nav (es. "Vai al checkout" nel carrello) non hanno href: senza questo la pagina non cambiava.
    if(navEl.tagName !== 'A') location.hash = '#' + navEl.getAttribute('data-nav');
    if(navEl.hasAttribute('data-scroll')){
      setTimeout(()=>{ const t = document.getElementById(navEl.getAttribute('data-scroll')); if(t) t.scrollIntoView({behavior:'smooth'}); }, 60);
    }
    return;
  }
  if(e.target.closest('#open-cart-btn')){ openCart(); return; }
  if(e.target.closest('#close-cart-btn')){ closeCart(); return; }
  if(e.target === document.getElementById('cart-overlay')){ closeCart(); return; }
  if(e.target.closest('#burger-btn')){
    const nav = document.querySelector('nav.main-nav');
    nav.style.display = nav.style.display==='flex' ? 'none' : 'flex';
    nav.style.cssText += 'position:absolute;top:76px;left:0;right:0;background:var(--bg-2);flex-direction:column;padding:14px;border-bottom:1px solid var(--border);z-index:39;';
    return;
  }
  const legalEl = e.target.closest('[data-legal]'); if(legalEl){ openLegal(legalEl.getAttribute('data-legal')); return; }
  const openProd = e.target.closest('[data-open-product]'); if(openProd){ openProductModal(openProd.getAttribute('data-open-product')); return; }
  const addCart = e.target.closest('[data-add-cart]'); if(addCart){ addToCart(addCart.getAttribute('data-add-cart')); closeModal(); return; }
  const qtyInc = e.target.closest('[data-qty-inc]'); if(qtyInc){ updateQty(qtyInc.getAttribute('data-qty-inc'), 1); return; }
  const qtyDec = e.target.closest('[data-qty-dec]'); if(qtyDec){ updateQty(qtyDec.getAttribute('data-qty-dec'), -1); return; }
  const rmCart = e.target.closest('[data-remove-cart]'); if(rmCart){ removeFromCart(rmCart.getAttribute('data-remove-cart')); return; }
  const faqEl = e.target.closest('[data-faq]'); if(faqEl){ faqEl.parentElement.classList.toggle('open'); return; }
  const payOpt = e.target.closest('.pay-opt');
  if(payOpt){
    document.querySelectorAll('.pay-opt').forEach(o=>o.classList.remove('selected'));
    payOpt.classList.add('selected');
    const input = payOpt.querySelector('input'); if(input) input.checked = true;
    return;
  }

  /* -------- Admin -------- */
  const adminTabEl = e.target.closest('[data-admin-tab]');
  if(adminTabEl){
    adminTab = adminTabEl.getAttribute('data-admin-tab');
    document.querySelectorAll('.admin-nav-item').forEach(n=>n.classList.remove('active'));
    document.querySelectorAll('[data-admin-tab="'+adminTab+'"]').forEach(n=>n.classList.add('active'));
    renderAdminMain();
    const sb = document.getElementById('admin-sidebar'); if(sb) sb.classList.remove('open');
    return;
  }
  if(e.target.closest('#admin-burger')){ document.getElementById('admin-sidebar').classList.toggle('open'); return; }
  if(e.target.closest('#admin-logout')){
    API.post('/auth/logout').then(()=>{ location.hash = '#home'; });
    return;
  }
  if(e.target.closest('#add-product-btn')){ productFormModal(null); return; }
  const editP = e.target.closest('[data-edit-product]');
  if(editP){ productFormModal(STATE.adminProducts.find(p=>p.id===editP.getAttribute('data-edit-product'))); return; }
  const delP = e.target.closest('[data-delete-product]');
  if(delP){
    const id = delP.getAttribute('data-delete-product');
    if(confirm('Eliminare questo prodotto?')){
      API.del('/products/'+encodeURIComponent(id)).then(()=>{ renderAdminMain(); toast('Prodotto eliminato'); });
    }
    return;
  }
  const viewOrderEl = e.target.closest('[data-view-order]');
  if(viewOrderEl){ orderDetailModal(STATE.adminOrders.find(o=>o.id===viewOrderEl.getAttribute('data-view-order'))); return; }
  if(e.target.closest('#add-review-btn')){ reviewFormModal(); return; }
  const toggleRev = e.target.closest('[data-toggle-review]');
  if(toggleRev){
    API.patch('/reviews/'+encodeURIComponent(toggleRev.getAttribute('data-toggle-review'))+'/toggle').then(()=>{ renderAdminMain(); toast('Recensione aggiornata'); });
    return;
  }
  const delRev = e.target.closest('[data-delete-review]');
  if(delRev){
    if(confirm('Eliminare questa recensione?')){
      API.del('/reviews/'+encodeURIComponent(delRev.getAttribute('data-delete-review'))).then(()=>{ renderAdminMain(); toast('Recensione eliminata'); });
    }
    return;
  }
});

document.addEventListener('change', function(e){
  const statusSel = e.target.closest('[data-order-status]');
  if(statusSel){
    API.patch('/orders/'+encodeURIComponent(statusSel.getAttribute('data-order-status'))+'/status', {status: statusSel.value})
      .then(()=>toast('Stato ordine aggiornato'))
      .catch(()=>toast('Errore aggiornamento stato'));
  }
});

document.addEventListener('submit', function(e){
  if(e.target.id==='admin-login-form'){
    e.preventDefault();
    const fd = new FormData(e.target);
    API.post('/auth/login', { username: fd.get('username'), password: fd.get('password') })
      .then(()=>{ location.hash = '#admin'; })
      .catch((err)=>toast(err.status===401 ? 'Credenziali non valide' : 'Errore server: ' + (err.message || 'connessione non riuscita') + (err.status ? ' ('+err.status+')' : '')));
    return;
  }
  if(e.target.id==='product-form'){
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get('id');
    const data = {
      name: fd.get('name').trim(), category: fd.get('category'), price: parseFloat(fd.get('price'))||0,
      billing: fd.get('billing').trim(), icon: fd.get('icon').trim() || '✨', description: fd.get('description').trim(),
      color: fd.get('color'), active: fd.get('active')==='on'
    };
    const req = id ? API.put('/products/'+encodeURIComponent(id), data) : API.post('/products', data);
    req.then(async ()=>{
      STATE.products = await API.get('/products');
      closeModal(); renderAdminMain(); toast('Prodotto salvato');
    }).catch(()=>toast('Errore salvataggio prodotto'));
    return;
  }
  if(e.target.id==='review-form'){
    e.preventDefault();
    const fd = new FormData(e.target);
    API.post('/reviews', { productId: fd.get('productId'), name: fd.get('name').trim(), rating: parseInt(fd.get('rating'),10), text: fd.get('text').trim() })
      .then(async ()=>{ STATE.reviews = await API.get('/reviews'); closeModal(); renderAdminMain(); toast('Recensione pubblicata'); })
      .catch(()=>toast('Errore pubblicazione recensione'));
    return;
  }
  if(e.target.id==='settings-form'){
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      siteName: fd.get('siteName').trim(), supportEmail: fd.get('supportEmail').trim(), tagline: fd.get('tagline').trim(),
      heroSubtitle: fd.get('heroSubtitle').trim(), discordLink: fd.get('discordLink').trim(),
      primaryColor: fd.get('primaryColor'), secondaryColor: fd.get('secondaryColor'),
      payPaypal: fd.get('payPaypal')==='on', payCard: fd.get('payCard')==='on', payCrypto: fd.get('payCrypto')==='on'
    };
    API.put('/settings', data).then((s)=>{ STATE.settings = s; applyBranding(); toast('Impostazioni salvate'); })
      .catch(()=>toast('Errore salvataggio impostazioni'));
    return;
  }
  if(e.target.id==='password-form'){
    e.preventDefault();
    const fd = new FormData(e.target);
    API.post('/auth/change-password', { currentPassword: fd.get('currentPassword'), newPassword: fd.get('newPassword') })
      .then(()=>{ toast('Password aggiornata'); e.target.reset(); })
      .catch((err)=>toast(err.message || 'Errore cambio password'));
    return;
  }
  if(e.target.id==='checkout-form'){
    e.preventDefault();
    const fd = new FormData(e.target);
    const items = CART.map(i=>({id:i.id, qty:i.qty}));
    API.post('/orders', { name: fd.get('name').trim(), email: fd.get('email').trim(), notes: fd.get('notes').trim(), payment: fd.get('pay') || 'PayPal', items })
      .then((order)=>{
        CART = []; saveCart(); renderCartCount();
        location.hash = '#confirmation?order=' + order.id;
      })
      .catch((err)=>toast('Errore nella creazione dell\'ordine: ' + (err.message || 'connessione non riuscita') + (err.status ? ' ('+err.status+')' : '')));
    return;
  }
  if(e.target.id==='order-lookup-form'){
    e.preventDefault();
    const fd = new FormData(e.target);
    const box = document.getElementById('order-lookup-result');
    API.get('/orders/'+encodeURIComponent(fd.get('orderId').trim()))
      .then((o)=>{ box.innerHTML = orderRowPublic(o); })
      .catch(()=>{ box.innerHTML = '<div class="empty-state"><div class="es-icon">📦</div><p>Nessun ordine trovato con questo ID.</p></div>'; });
    return;
  }
});

/* ================= INIT ================= */
async function init(){
  route = parseHash();
  try {
    await loadPublicData();
  } catch (err) {
    console.error('Impossibile caricare i dati dal server:', err);
  }
  renderCartCount();
  renderApp();
}
init();

})();
