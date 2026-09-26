// cart.js — carrello lato client (localStorage è corretto qui: non è dato sensibile
// né stato admin, solo la selezione dell'utente prima di inviare l'ordine al server).
const CART_KEY = 'nx_cart';
let CART = loadCart();

function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; } }
function saveCart(){ try{ localStorage.setItem(CART_KEY, JSON.stringify(CART)); }catch(e){} }

function cartCount(){ return CART.reduce((a,i)=>a+i.qty,0); }
function cartTotal(){ return CART.reduce((a,i)=>{ const p=STATE.products.find(x=>x.id===i.id); return a + (p?Number(p.price)*i.qty:0); },0); }
function addToCart(id){
  const existing = CART.find(i=>i.id===id);
  if(existing) existing.qty++; else CART.push({id, qty:1});
  saveCart(); renderCartCount(); toast('Aggiunto al carrello');
}
function updateQty(id, delta){
  const item = CART.find(i=>i.id===id); if(!item) return;
  item.qty += delta;
  if(item.qty<=0) CART = CART.filter(i=>i.id!==id);
  saveCart(); renderCartCount(); renderCartDrawer();
}
function removeFromCart(id){ CART = CART.filter(i=>i.id!==id); saveCart(); renderCartCount(); renderCartDrawer(); }
function renderCartCount(){
  const el = document.getElementById('cart-count'); if(!el) return;
  const c = cartCount(); el.textContent = c; el.classList.toggle('hidden', c===0);
}
function renderCartDrawer(){
  const body = document.getElementById('cart-body'); const foot = document.getElementById('cart-foot');
  if(!body || !foot) return;
  if(!CART.length){
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🛒</div><p>Il carrello è vuoto.<br>Aggiungi qualcosa dal catalogo.</p></div>';
    foot.innerHTML = '<button class="btn btn-soft btn-block" data-nav="catalog" data-close-cart>Sfoglia i prodotti</button>';
    return;
  }
  body.innerHTML = CART.map(item=>{
    const p = STATE.products.find(x=>x.id===item.id); if(!p) return '';
    return '<div class="cart-line">'+
      '<div class="cl-media" style="'+mediaStyle(p.color)+'">'+p.icon+'</div>'+
      '<div class="cl-info"><h4>'+esc(p.name)+'</h4><span>'+euro(p.price)+' cad.</span>'+
      '<div class="qty-ctrl"><button data-qty-dec="'+p.id+'">−</button><span>'+item.qty+'</span><button data-qty-inc="'+p.id+'">+</button></div>'+
      '<a href="javascript:void(0)" class="cl-remove" data-remove-cart="'+p.id+'">Rimuovi</a>'+
      '</div></div>';
  }).join('');
  foot.innerHTML = '<div class="row-between" style="margin-bottom:16px;"><span style="color:var(--text-dim);font-size:.9rem;">Subtotale</span><span class="price">'+euro(cartTotal())+'</span></div>'+
    '<button class="btn btn-primary btn-block" data-nav="checkout" data-close-cart>Vai al checkout</button>';
}
function openCart(){ document.getElementById('cart-overlay').classList.remove('hidden'); document.getElementById('cart-drawer').classList.remove('hidden'); renderCartDrawer(); }
function closeCart(){ document.getElementById('cart-overlay').classList.add('hidden'); document.getElementById('cart-drawer').classList.add('hidden'); }
