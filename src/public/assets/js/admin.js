// admin.js — pannello amministratore. Login e ogni azione passano dal backend
// (sessione firmata lato server), non più da sessionStorage/localStorage bypassabili.

function viewAdminLogin(){
  return `<div id="admin-login-view"><div class="login-card">
    <div class="lc-icon">🔒</div>
    <h2 style="margin-bottom:8px;">Accesso amministratore</h2>
    <p style="color:var(--text-faint);font-size:.88rem;margin-bottom:22px;">Inserisci le credenziali per gestire il sito.</p>
    <form id="admin-login-form">
      <div class="field"><label>Username</label><input name="username" required placeholder="admin" autofocus></div>
      <div class="field"><label>Password</label><input type="password" name="password" required placeholder="••••••••"></div>
      <button class="btn btn-primary btn-block" type="submit">Accedi</button>
    </form>
    <a href="#home" data-nav="home" style="display:block;text-align:center;margin-top:18px;font-size:.85rem;color:var(--text-faint);">← Torna al sito</a>
  </div></div>`;
}

const ADMIN_TABS = [
  ['overview','Panoramica','overview'], ['products','Prodotti','products'],
  ['orders','Ordini','orders'], ['reviews','Recensioni','reviews'], ['settings','Impostazioni','settings']
];
let adminTab = 'overview';

function viewAdmin(){
  return `<div id="admin-shell">
    <div class="mobile-admin-bar"><button class="icon-btn" id="admin-burger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      <b style="font-family:var(--font-display);">${esc(STATE.settings.siteName)} Admin</b>
      <a href="#home" data-nav="home" class="icon-btn">${ICONS.back}</a></div>
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-brand"><span class="brand-mark">${esc(STATE.settings.siteName.charAt(0))}</span> ${esc(STATE.settings.siteName)}</div>
      <nav>${ADMIN_TABS.map(([key,label,icon])=>`<a href="javascript:void(0)" class="admin-nav-item ${adminTab===key?'active':''}" data-admin-tab="${key}">${ICONS[icon]}${label}</a>`).join('')}</nav>
      <div class="admin-sidebar-foot">
        <a href="#home" data-nav="home" class="admin-nav-item">${ICONS.back}Torna al sito</a>
        <a href="javascript:void(0)" class="admin-nav-item" id="admin-logout">${ICONS.logout}Esci</a>
      </div>
    </aside>
    <div class="admin-main" id="admin-main"></div>
  </div>`;
}

async function renderAdminMain(){
  const main = document.getElementById('admin-main'); if(!main) return;
  if(adminTab==='overview') main.innerHTML = await adminOverview();
  if(adminTab==='products') main.innerHTML = await adminProducts();
  if(adminTab==='orders') main.innerHTML = await adminOrders();
  if(adminTab==='reviews') main.innerHTML = await adminReviews();
  if(adminTab==='settings') main.innerHTML = adminSettings();
}

async function adminOverview(){
  const orders = await API.get('/orders');
  STATE.adminOrders = orders;
  const revenue = orders.filter(o=>o.status==='paid'||o.status==='completed').reduce((a,o)=>a+Number(o.total),0);
  const recent = orders.slice().sort((a,b)=>b.created_at-a.created_at).slice(0,5);
  return `
  <div class="admin-topbar"><div><h1>Panoramica</h1><div class="sub">Andamento generale del tuo negozio</div></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="sc-label">Ricavi totali</div><div class="sc-value">${euro(revenue)}</div></div>
    <div class="stat-card"><div class="sc-label">Ordini totali</div><div class="sc-value">${orders.length}</div></div>
    <div class="stat-card"><div class="sc-label">Prodotti attivi</div><div class="sc-value">${STATE.stats.activeProducts}</div></div>
    <div class="stat-card"><div class="sc-label">Valutazione media</div><div class="sc-value">${STATE.stats.avgRating ?? '—'}</div></div>
  </div>
  <div class="panel"><div class="panel-head"><h3>Ordini recenti</h3><a href="javascript:void(0)" data-admin-tab="orders" class="btn btn-soft btn-sm">Vedi tutti</a></div>
    ${recent.length? `<div class="scroll-x"><table class="data-table"><thead><tr><th>Ordine</th><th>Cliente</th><th>Totale</th><th>Stato</th></tr></thead><tbody>
      ${recent.map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.name)}</td><td>${euro(o.total)}</td><td><span class="status-pill status-${o.status}">${statusLabel(o.status)}</span></td></tr>`).join('')}
    </tbody></table></div>` : '<p style="color:var(--text-faint);">Ancora nessun ordine.</p>'}
  </div>`;
}

async function adminProducts(){
  const products = await API.get('/products/all');
  STATE.adminProducts = products;
  return `
  <div class="admin-topbar"><div><h1>Prodotti</h1><div class="sub">Gestisci il catalogo del tuo negozio</div></div>
    <button class="btn btn-primary" id="add-product-btn">${ICONS.plus}Nuovo prodotto</button></div>
  <div class="panel"><div class="scroll-x"><table class="data-table"><thead><tr><th>Prodotto</th><th>Categoria</th><th>Prezzo</th><th>Stato</th><th></th></tr></thead><tbody>
    ${products.map(p=>`<tr>
      <td><div class="table-name-cell"><div class="mini-media" style="${mediaStyle(p.color)}">${p.icon}</div>${esc(p.name)}</div></td>
      <td><span class="badge ${CATS[p.category].badgeClass}">${CATS[p.category].label}</span></td>
      <td>${euro(p.price)}${p.billing?' / '+esc(p.billing):''}</td>
      <td>${p.active? '<span class="status-pill status-completed">Attivo</span>' : '<span class="status-pill status-cancelled">Nascosto</span>'}</td>
      <td><div class="row-actions">
        <button class="icon-btn btn-sm" style="width:34px;height:34px;" data-edit-product="${p.id}">${ICONS.edit}</button>
        <button class="icon-btn btn-sm" style="width:34px;height:34px;" data-delete-product="${p.id}">${ICONS.trash}</button>
      </div></td></tr>`).join('') || '<tr><td colspan="5" style="color:var(--text-faint);">Nessun prodotto ancora.</td></tr>'}
  </tbody></table></div></div>`;
}
function productFormModal(product){
  const p = product || {id:null,name:'',category:'digital',price:'',billing:'',icon:'✨',color:'cyan',description:'',active:true};
  openModal(`
    <h2 style="margin-bottom:20px;">${product?'Modifica prodotto':'Nuovo prodotto'}</h2>
    <form id="product-form">
      <div class="field"><label>Nome prodotto</label><input required name="name" value="${esc(p.name)}"></div>
      <div class="field-row">
        <div class="field"><label>Categoria</label><select name="category">
          <option value="digital" ${p.category==='digital'?'selected':''}>Prodotto Digitale</option>
          <option value="license" ${p.category==='license'?'selected':''}>Licenza Software</option>
          <option value="subscription" ${p.category==='subscription'?'selected':''}>Abbonamento</option>
        </select></div>
        <div class="field"><label>Prezzo (€)</label><input required type="number" step="0.01" min="0" name="price" value="${esc(p.price)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Durata / periodo (opzionale)</label><input name="billing" placeholder="es. mensile, 1 anno, a vita" value="${esc(p.billing||'')}"></div>
        <div class="field"><label>Emoji icona</label><input name="icon" value="${esc(p.icon)}" maxlength="4"></div>
      </div>
      <div class="field"><label>Descrizione</label><textarea name="description" required>${esc(p.description)}</textarea></div>
      <div class="field"><label>Colore accento</label><select name="color">
        <option value="cyan" ${p.color==='cyan'?'selected':''}>Ciano</option>
        <option value="magenta" ${p.color==='magenta'?'selected':''}>Magenta</option>
        <option value="success" ${p.color==='success'?'selected':''}>Verde</option>
      </select></div>
      <label class="checkbox-row" style="margin-bottom:20px;"><input type="checkbox" name="active" ${p.active?'checked':''}> Prodotto visibile nel negozio</label>
      <input type="hidden" name="id" value="${p.id||''}">
      <button class="btn btn-primary btn-block" type="submit">${product?'Salva modifiche':'Crea prodotto'}</button>
    </form>`);
}

async function adminOrders(){
  const orders = await API.get('/orders');
  STATE.adminOrders = orders;
  const sorted = orders.slice().sort((a,b)=>b.created_at-a.created_at);
  return `
  <div class="admin-topbar"><div><h1>Ordini</h1><div class="sub">${orders.length} ordini ricevuti</div></div></div>
  <div class="panel"><div class="scroll-x"><table class="data-table"><thead><tr><th>Ordine</th><th>Cliente</th><th>Articoli</th><th>Totale</th><th>Stato</th><th></th></tr></thead><tbody>
    ${sorted.map(o=>`<tr>
      <td>${esc(o.id)}</td><td>${esc(o.name)}<br><span style="color:var(--text-faint);font-size:.78rem;">${esc(o.email)}</span></td>
      <td>${o.items.length}</td><td>${euro(o.total)}</td>
      <td><select class="status-select" data-order-status="${o.id}">
        ${['pending','paid','completed','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}
      </select></td>
      <td><button class="icon-btn btn-sm" style="width:34px;height:34px;" data-view-order="${o.id}">${ICONS.eye}</button></td>
    </tr>`).join('') || '<tr><td colspan="6" style="color:var(--text-faint);">Nessun ordine ancora.</td></tr>'}
  </tbody></table></div></div>`;
}
function orderDetailModal(o){
  openModal(`
    <h2 style="margin-bottom:6px;">Ordine ${esc(o.id)}</h2>
    <p style="color:var(--text-faint);font-size:.85rem;margin-bottom:20px;">${new Date(Number(o.created_at)).toLocaleString('it-IT')}</p>
    <div class="panel" style="margin-bottom:16px;padding:16px;">
      <div style="font-size:.85rem;color:var(--text-dim);margin-bottom:4px;"><b>Cliente:</b> ${esc(o.name)}</div>
      <div style="font-size:.85rem;color:var(--text-dim);margin-bottom:4px;"><b>Email:</b> ${esc(o.email)}</div>
      <div style="font-size:.85rem;color:var(--text-dim);margin-bottom:4px;"><b>Pagamento:</b> ${esc(o.payment)}</div>
      ${o.notes?'<div style="font-size:.85rem;color:var(--text-dim);"><b>Note:</b> '+esc(o.notes)+'</div>':''}
    </div>
    ${o.items.map(i=>`<div class="summary-line"><span>${esc(i.name)} × ${i.qty}</span><span>${euro(i.price*i.qty)}</span></div>`).join('')}
    <div class="summary-total"><span>Totale</span><span>${euro(o.total)}</span></div>`);
}

async function adminReviews(){
  const revs = await API.get('/reviews/all');
  STATE.adminReviews = revs;
  const sorted = revs.slice().sort((a,b)=>b.created_at-a.created_at);
  return `
  <div class="admin-topbar"><div><h1>Recensioni</h1><div class="sub">Modera le recensioni visibili nel negozio</div></div>
    <button class="btn btn-primary" id="add-review-btn">${ICONS.plus}Nuova recensione</button></div>
  <div class="panel"><div class="scroll-x"><table class="data-table"><thead><tr><th>Prodotto</th><th>Autore</th><th>Voto</th><th>Testo</th><th>Stato</th><th></th></tr></thead><tbody>
    ${sorted.map(r=>{
      const p = STATE.products.find(x=>x.id===r.product_id);
      return `<tr><td>${p?esc(p.name):'—'}</td><td>${esc(r.name)}</td><td><span class="stars">${starRow(r.rating)}</span></td>
        <td style="max-width:220px;">${esc(r.text.slice(0,60))}${r.text.length>60?'…':''}</td>
        <td>${r.approved?'<span class="status-pill status-completed">Visibile</span>':'<span class="status-pill status-pending">Nascosta</span>'}</td>
        <td><div class="row-actions">
          <button class="icon-btn btn-sm" style="width:34px;height:34px;" data-toggle-review="${r.id}">${ICONS.eye}</button>
          <button class="icon-btn btn-sm" style="width:34px;height:34px;" data-delete-review="${r.id}">${ICONS.trash}</button>
        </div></td></tr>`;
    }).join('') || '<tr><td colspan="6" style="color:var(--text-faint);">Nessuna recensione ancora.</td></tr>'}
  </tbody></table></div></div>`;
}
function reviewFormModal(){
  const opts = STATE.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  openModal(`
    <h2 style="margin-bottom:20px;">Nuova recensione</h2>
    <form id="review-form">
      <div class="field"><label>Prodotto</label><select name="productId">${opts}</select></div>
      <div class="field"><label>Nome autore</label><input required name="name" placeholder="Nome Cognome"></div>
      <div class="field"><label>Voto</label><select name="rating"><option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option></select></div>
      <div class="field"><label>Testo recensione</label><textarea required name="text"></textarea></div>
      <button class="btn btn-primary btn-block" type="submit">Pubblica recensione</button>
    </form>`);
}

function adminSettings(){
  const s = STATE.settings;
  return `
  <div class="admin-topbar"><div><h1>Impostazioni</h1><div class="sub">Personalizza il tuo negozio</div></div></div>
  <form id="settings-form">
    <div class="panel"><div class="panel-head"><h3>Generali</h3></div>
      <div class="field-row">
        <div class="field"><label>Nome del sito</label><input name="siteName" value="${esc(s.siteName)}"></div>
        <div class="field"><label>Email di supporto</label><input type="email" name="supportEmail" value="${esc(s.supportEmail)}"></div>
      </div>
      <div class="field"><label>Tagline (footer)</label><input name="tagline" value="${esc(s.tagline)}"></div>
      <div class="field"><label>Sottotitolo hero (homepage)</label><textarea name="heroSubtitle">${esc(s.heroSubtitle)}</textarea></div>
      <div class="field"><label>Link Discord</label><input name="discordLink" value="${esc(s.discordLink)}"></div>
    </div>
    <div class="panel"><div class="panel-head"><h3>Aspetto</h3></div>
      <div class="field-row">
        <div class="field"><label>Colore primario</label><div class="field-color"><input type="color" name="primaryColor" value="${s.primaryColor}"><span style="font-size:.85rem;color:var(--text-faint);">Bottoni, link, accenti</span></div></div>
        <div class="field"><label>Colore secondario</label><div class="field-color"><input type="color" name="secondaryColor" value="${s.secondaryColor}"><span style="font-size:.85rem;color:var(--text-faint);">Gradiente e dettagli</span></div></div>
      </div>
    </div>
    <div class="panel"><div class="panel-head"><h3>Metodi di pagamento visualizzati</h3></div>
      <label class="checkbox-row" style="margin-bottom:12px;"><input type="checkbox" name="payPaypal" ${s.payPaypal?'checked':''}> PayPal</label><br>
      <label class="checkbox-row" style="margin-bottom:12px;"><input type="checkbox" name="payCard" ${s.payCard?'checked':''}> Carta di credito</label><br>
      <label class="checkbox-row"><input type="checkbox" name="payCrypto" ${s.payCrypto?'checked':''}> Criptovalute</label>
      <p style="font-size:.78rem;color:var(--text-faint);margin-top:14px;">Questi metodi sono mostrati come opzioni nel checkout ma non sono collegati a un gateway di pagamento reale.</p>
    </div>
    <button class="btn btn-primary" type="submit">Salva impostazioni</button>
  </form>
  <div class="panel" style="margin-top:24px;"><div class="panel-head"><h3>Sicurezza</h3></div>
    <form id="password-form">
      <div class="field"><label>Password attuale</label><input type="password" name="currentPassword" required></div>
      <div class="field"><label>Nuova password</label><input type="password" name="newPassword" required minlength="6"></div>
      <button class="btn btn-soft" type="submit">Cambia password</button>
    </form>
  </div>`;
}
