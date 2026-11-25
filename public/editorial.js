(() => {
  const c = window.PLUVIA_CONTENT;
  const slug=document.body.dataset.page;
  if (!c.pages[slug]) return;
  const main=document.getElementById('principal');
  // Mantener el DOM prerenderizado cuando ya coincide con la edición pública.
  const template = document.createElement('template');
  template.innerHTML = c.pages[slug]();
  if (main.innerHTML !== template.innerHTML) main.replaceChildren(template.content);
  const aliases={sistema:'funcionamiento',explorador:'producto',materiales:'producto',tecnica:'tecnologia',contacto:'contacto'};
  if(slug==='inicio' && aliases[location.hash.slice(1)]) location.replace('/'+aliases[location.hash.slice(1)]+'/'+location.hash);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  if(!reduce.matches && 'IntersectionObserver' in window){
    const obs=new IntersectionObserver(entries=>entries.filter(e=>e.isIntersecting).forEach(e=>{e.target.classList.add('in-frame');obs.unobserve(e.target);}));
    main.querySelectorAll('.fact,.feature-art,.project-figure,.member').forEach(el=>{el.classList.add('enter-frame');obs.observe(el);});
  }
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const counter = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        counter.unobserve(entry.target);
        const start = performance.now();
        const update = now => {
          const f = Math.min(1, (now - start) / 650);
          entry.target.textContent = String(Math.round(Number(entry.target.dataset.count) * f));
          if (f < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
      }
    });
    main.querySelectorAll('[data-count]').forEach(el => counter.observe(el));
    const image = main.querySelector('.feature-art img');
    if (image) {
      let queued = false;
      addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          const f = Math.max(-1, Math.min(1, image.parentElement.getBoundingClientRect().top / innerHeight));
          image.style.transform = 'scale(1.08) translateY(' + (f * 3) + '%)';
          queued = false;
        });
      }, { passive:true });
    }
  }
  if(slug==='simulacion'){
    const controls=['a','b'].map(id=>document.getElementById('sim-'+id));
    const refresh=()=>{
      const [a,b]=controls.map(el=>Number(el.value));
      controls.forEach((el,i)=>{const key=i?'b':'a';document.getElementById('val-'+key).textContent=el.value.replace('.',',')+' cm';document.getElementById('water-'+key).style.height=(Number(el.value)*10)+'%';});
      document.getElementById('sim-state').textContent=a>=8?'D1 supera el umbral de limpieza. El control exige nivel estable antes de accionar el motor.':Math.max(a,b)>=5?'Se alcanza el umbral de desvío hacia el filtro. La apertura depende de la reserva disponible.':'Ambos niveles están por debajo del umbral de desvío.';
    };
    controls.forEach(el=>el.addEventListener('input',refresh));refresh();
  }
})();
