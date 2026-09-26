// state.js — cache in memoria dei dati caricati dal server per la sessione corrente.
// A differenza della vecchia versione, prodotti/recensioni/impostazioni/ordini
// arrivano dal backend (Postgres), non da localStorage: qui restano solo come cache di rendering.
const STATE = {
  products: [],
  reviews: [],
  settings: { siteName:'NEXORA', tagline:'', heroSubtitle:'', primaryColor:'#2FD9E8', secondaryColor:'#E64FD9', discordLink:'', supportEmail:'', payPaypal:true, payCard:true, payCrypto:true },
  stats: { activeProducts:0, totalOrders:0, avgRating:null },
  adminOrders: [],
  adminProducts: [],
  adminReviews: [],
  adminUsername: null,
};

async function loadPublicData(){
  const [products, reviews, settings, stats] = await Promise.all([
    API.get('/products'), API.get('/reviews'), API.get('/settings'), API.get('/stats')
  ]);
  STATE.products = products;
  STATE.reviews = reviews;
  STATE.settings = settings;
  STATE.stats = stats;
}

function avgRating(productId){
  const revs = STATE.reviews.filter(r=>r.product_id===productId);
  if(!revs.length) return null;
  return revs.reduce((a,r)=>a+r.rating,0)/revs.length;
}

function applyBranding(){
  const s = STATE.settings;
  document.documentElement.style.setProperty('--cyan', s.primaryColor);
  document.documentElement.style.setProperty('--magenta', s.secondaryColor);
  ['brand-name','brand-name-2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent = s.siteName; });
  ['brand-mark','brand-mark-2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent = s.siteName.charAt(0).toUpperCase(); });
  const tagEl = document.getElementById('brand-tagline-foot'); if(tagEl) tagEl.textContent = s.tagline;
  const discordEl = document.getElementById('foot-discord'); if(discordEl) discordEl.href = s.discordLink || '#';
  const yearEl = document.getElementById('foot-year'); if(yearEl) yearEl.textContent = new Date().getFullYear();
  document.title = s.siteName + ' — Digital Store';
}
