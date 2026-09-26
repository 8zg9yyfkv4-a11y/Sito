// router.js — routing lato client basato su hash (#home, #catalog, #admin...).
let route = {view:'home', params:{}};
function parseHash(){
  const raw = location.hash.replace('#','') || 'home';
  const [view, qs] = raw.split('?');
  const params = {};
  if(qs) qs.split('&').forEach(pair=>{ const [k,v]=pair.split('='); params[k]=decodeURIComponent(v||''); });
  return {view: view||'home', params};
}
function renderHeaderActive(){
  document.querySelectorAll('nav.main-nav a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('data-nav')===route.view);
  });
  const isAdmin = route.view==='admin' || route.view==='admin-login';
  document.getElementById('site-header').classList.toggle('hidden', isAdmin);
  document.getElementById('site-footer').classList.toggle('hidden', isAdmin);
}

async function renderApp(){
  applyBranding();
  renderHeaderActive();
  const app = document.getElementById('app');

  if(route.view==='admin-login'){ app.innerHTML = viewAdminLogin(); return; }

  if(route.view==='admin'){
    const me = await API.get('/auth/me');
    if(!me.authenticated){ location.hash = '#admin-login'; return; }
    STATE.adminUsername = me.username;
    app.innerHTML = viewAdmin();
    await renderAdminMain();
    return;
  }

  if(route.view==='catalog'){ app.innerHTML = viewCatalog(); return; }
  if(route.view==='checkout'){ app.innerHTML = viewCheckout(); return; }
  if(route.view==='confirmation'){ app.innerHTML = await viewConfirmation(route.params.order); return; }
  if(route.view==='account'){ app.innerHTML = viewAccount(); return; }
  app.innerHTML = viewHome();
}

window.addEventListener('hashchange', ()=>{ route = parseHash(); renderApp(); window.scrollTo({top:0}); });
