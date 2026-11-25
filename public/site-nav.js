(() => {
  const c = window.PLUVIA_CONTENT;
  const path = location.pathname.replace(/\/index\.html$/, '/').split('/')[1];
  const here = c.routes.find(r => r.slug === path) || c.routes[0];
  const href = r => r.slug ? '/' + r.slug + '/' : '/';
  const anchor = r => `<a href="${href(r)}"${r === here ? ' aria-current="page"' : ''}>${r.title}</a>`;
  const brand = '<a class="pl-brand" href="/"><img src="/brand.svg" alt="" width="32" height="32">Pluvia</a>';
  const header = document.getElementById('site-header');
  if (!header) return;
  header.classList.add('pl-header');
  header.innerHTML = `<div class="pl-bar">${brand}<nav class="pl-quick" aria-label="Accesos destacados">${['proyecto','producto','simulacion'].map(k=>anchor(c.routes.find(r=>r.slug===k))).join('')}</nav><div class="pl-actions"><a class="pl-live" href="/monitoreo/"><span></span>${c.labels.monitor}</a><button class="pl-menu" aria-expanded="false" aria-controls="pl-menu-list">${c.labels.menu} <b aria-hidden="true">☰</b></button></div></div><nav id="pl-menu-list" aria-label="Todas las secciones" hidden>${c.routes.map(anchor).join('')}</nav>`;
  const button=header.querySelector('button'), menu=header.querySelector('#pl-menu-list');
  function open(on){menu.hidden=!on;button.setAttribute('aria-expanded',String(on));}
  button.onclick=()=>open(menu.hidden);
  document.addEventListener('click',e=>{if(!header.contains(e.target))open(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){open(false);button.focus();}});
  const footer = document.getElementById('site-footer');
  if (footer) footer.innerHTML = `<div class="pl-footer">${brand}<span>${c.labels.footer}</span><a href="/contacto/">Contacto ↗</a></div>`;
})();
