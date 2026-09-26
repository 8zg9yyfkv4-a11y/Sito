// helpers.js — utility condivise: formattazione, escaping, toast, modal, icone.
const ICONS = {
  overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  products:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  orders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v4H4z"/><path d="M4 8v12h16V8"/><path d="M9 12h6"/></svg>',
  reviews:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8z"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
  logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'
};
const CATS = {
  digital:{label:'Prodotto Digitale', badgeClass:'badge-digital'},
  license:{label:'Licenza Software', badgeClass:'badge-license'},
  subscription:{label:'Abbonamento', badgeClass:'badge-subscription'}
};

function euro(n){ return '€' + Number(n).toFixed(2).replace(/\.00$/,''); }
function esc(s){ const d=document.createElement('div'); d.textContent = (s==null?'':String(s)); return d.innerHTML; }
function starRow(rating){ const r = Math.round(rating); return '★★★★★☆☆☆☆☆'.slice(5-r,10-r); }
function colorVar(name){ return name==='magenta' ? 'var(--magenta)' : name==='success' ? 'var(--success)' : 'var(--cyan)'; }
function mediaStyle(color){ const c = colorVar(color); return 'background:linear-gradient(135deg, color-mix(in srgb,'+c+' 22%, var(--bg-3)), var(--bg-3)); color:'+c+';'; }
function statusLabel(s){ return {pending:'In attesa', paid:'Pagato', completed:'Completato', cancelled:'Annullato'}[s] || s; }

function toast(msg){
  const slot = document.getElementById('toast-slot');
  const el = document.createElement('div');
  el.className='toast';
  el.innerHTML = '<span class="t-dot"></span><span>'+esc(msg)+'</span>';
  slot.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 2400);
}
function closeModal(){ document.getElementById('modal-slot').innerHTML=''; }
function openModal(html, wide){
  document.getElementById('modal-slot').innerHTML =
    '<div class="modal-overlay" id="active-modal-overlay"><div class="modal-box'+(wide?' modal-wide':'')+'">'+
    '<button class="icon-btn modal-close" data-close-modal>'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'+
    html+'</div></div>';
  document.getElementById('active-modal-overlay').addEventListener('click', function(e){
    if(e.target.id==='active-modal-overlay') closeModal();
  });
}
document.addEventListener('click', function(e){
  if(e.target.closest('[data-close-modal]')) closeModal();
});
