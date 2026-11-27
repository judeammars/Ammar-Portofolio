(() => {
  'use strict';
  const artworks = [
    {id:'moth',title:'Nocturne',category:'illustration',categoryLabel:'ILLUSTRATION',year:'2026',material:'DIGITAL / CHARACTER STUDY',description:'An exploration of fragile wings, sleepy colors, and the kind of creatures that only appear when everyone else has gone to bed.',note:'A tiny tribute to the beautifully strange.'},
    {id:'orbit',title:'The Blue Hour',category:'poster',categoryLabel:'POSTER',year:'2026',material:'DIGITAL / POSTER STUDY',description:'Somewhere between night and morning, a planet forgets the direction it was supposed to turn.',note:'A composition study using orbital movement and contrasting colors.'},
    {id:'bloom',title:'Paper Garden',category:'illustration',categoryLabel:'ILLUSTRATION',year:'2026',material:'DIGITAL / BOTANICAL',description:'A flower that will never need watering. Made of patient shapes and colors borrowed from old book covers.',note:'Part of an imagined botanical collection.'},
    {id:'window',title:'Still Here',category:'study',categoryLabel:'STUDY',year:'2026',material:'DIGITAL / COLOR STUDY',description:'An afternoon landscape viewed through a window that may or may not exist in a real house.',note:'An experiment in atmosphere, silhouettes, and memory.'},
    {id:'portrait',title:'Someone Else',category:'study',categoryLabel:'STUDY',year:'2026',material:'DIGITAL / PORTRAIT STUDY',description:'A little portrait exercise concerned more with color and warmth than anyone in particular.',note:'A placeholder artwork created for this site prototype.'},
    {id:'city',title:'After the Rain',category:'poster',categoryLabel:'POSTER',year:'2026',material:'DIGITAL / ENVIRONMENT STUDY',description:'Streetlights, windows, and a city arranging its thoughts after a long day.',note:'An imaginary city, neatly filed under ordinary magic.'}
  ];
  const projects = [
    {id:'pantheia',name:'PANTHEIA',number:'001',kind:'MYTHOLOGY / COMMUNITY',icon:'✷',tagline:'A digital sanctuary for modern mythology lovers.',description:'A mythology-inspired community website centered on devotion, identity, and the expressive worlds of the Greek gods.',details:'Creative direction, editorial UI, interactive profile concepts, deity-specific visual identity, and a living archive of community activities.',tags:['WEB DESIGN','INTERACTIVE UI','COMMUNITY'],palette:'#6b567c',status:'PROJECT SHOWCASE'},
    {id:'athenaeum',name:'ATHENAEUM',number:'002',kind:'WRITING / ART PLATFORM',icon:'✿',tagline:'Where illustrated worlds and written words meet.',description:'An editorial home for writers and illustrators to publish their work together, explore archives, and discover one another.',details:'Book-inspired reading experience, contributor profiles, collaborative artwork collections, carousel highlights, and publishing tools.',tags:['EDITORIAL','WEB DEVELOPMENT','CREATIVE PLATFORM'],palette:'#647a68',status:'PROJECT SHOWCASE'},
    {id:'nakula',name:'NAKULA PHONE',number:'003',kind:'INTERACTIVE / STORYTELLING',icon:'▣',tagline:'A fictional phone full of things left unsaid.',description:'An immersive interactive story told through the apps, messages, and files found inside one fictional phone.',details:'Choice-driven narrative progression, in-world messaging, visual clues, branching routes, and phone-inspired micro-interactions.',tags:['STORY GAME','INTERACTION','FRONTEND'],palette:'#a8664a',status:'PROJECT SHOWCASE'}
  ];
  const writings = [
    {id:'01',title:'A Letter to the Things I Never Finished',kind:'PROSE',date:'VOL. 01 / ENTRY 001',excerpt:'Somewhere in my room, a hundred unfinished beginnings are learning how to forgive me.',body:['Dear unfinished things,','I hope you are not angry with me for leaving you halfway to becoming. There are drawings without faces, letters without endings, and stories whose characters still wait at the door of the first chapter.','I have learned that not everything abandoned is unloved. Some things are simply waiting for the right season to be held again.','Until then, remain where I can find you. I will leave the light on.']},
    {id:'02',title:'The Museum of Almosts',kind:'POETRY',date:'VOL. 01 / ENTRY 002',excerpt:'I collected every almost, then wondered why the shelves began to bend.',body:['I built a museum out of almosts.','An almost-kiss beneath the staircase. An almost-home across the sea. An almost-sentence I kept folding into smaller and smaller pieces.','Nobody came to see the exhibition, but every evening I dusted the glass and changed the flowers.','Somewhere between the third room and the exit, I learned that the door had been open all along.']},
    {id:'03',title:'Instructions for Keeping a Small Universe',kind:'MICROFICTION',date:'VOL. 01 / ENTRY 003',excerpt:'First, find a jar large enough to hold a star and all of its unanswered questions.',body:['Instructions for Keeping a Small Universe','One: Choose a jar with a lid that closes tightly. The stars are excellent at escaping.','Two: Never shake the jar to make the planets move faster. They will find their own way around.','Three: Feed the universe three stories every morning. One true, one invented, and one you have not yet learned to tell.','Four: When the universe gets too big for the jar, do not be sad. Open the window.']}
  ];
  const oddities = [
    {title:'C.O.R.E.',kicker:'WORLD FILE / 01',description:'A fictional supernatural agency, anomalous field reports, and the agents tasked with making sense of the impossible.',body:'Agency lore, aptitude systems, field operations, and unusual incidents. Think of this as a collection of worldbuilding notes, rather than a finished publication.',tags:['WORLD BUILDING','SUPERNATURAL','CHARACTERS']},
    {title:'SHADOW ECONOMY',kicker:'WORLD FILE / 02',description:'A sprawling fictional network of family, power, loyalty, and all the unlikely people tangled inside it.',body:'Character relations, places, organizations, and fragments from a larger ongoing fictional universe.',tags:['FICTION','CHARACTER STUDY','LORE']},
    {title:'THE UNWRITTEN',kicker:'WORLD FILE / 03',description:'An unapologetic drawer for stray characters, unused concepts, sketches, and very ambitious what-ifs.',body:'Every creative practice needs a space where ideas can remain unfinished without needing to apologize.',tags:['EXPERIMENTS','SCRAPS','IN PROGRESS']}
  ];
  const pages = ['home','collections','art','digital','writing','oddities','about','contact'];
  const byId = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let previousFocus = null;
  let toastHandle;

  function drawArt(filter='all') {
    const items = artworks.filter(a => filter==='all' || a.category===filter);
    byId('art-grid').innerHTML = items.map((a,index)=>`<button class="art-item" data-art="${a.id}" aria-label="Open artwork ${esc(a.title)}"><div class="art-artwork"><img loading="lazy" src="assets/${a.id}.svg" alt="${esc(a.title)} original sample artwork"/><span class="art-number">NO. ${String(artworks.indexOf(a)+1).padStart(3,'0')}</span></div><div class="art-label"><strong>${esc(a.title)}</strong><span>VIEW PIECE ↗</span></div><div class="art-piece-meta">${esc(a.categoryLabel)} / ${a.year}</div></button>`).join('');
  }
  function drawProjects() {
    byId('project-list').innerHTML = projects.map(p=>`<button class="project-card" data-project="${p.id}" aria-label="Open ${esc(p.name)} project dossier"><div class="project-visual"><div class="project-monitor"><div class="project-monitor-bar"><span></span><span></span><span></span></div><div class="project-monitor-body"><span class="screen-icon">${p.icon}</span><strong>${esc(p.name)}</strong><small>${esc(p.kind)}</small></div></div><div class="project-sticker">FILE ${p.number} / OPEN ↗</div></div><div class="project-info"><div class="project-index"><span>CASE FILE / ${p.number}</span><span>↗</span></div><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p><div class="project-tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="project-bottom"><span>READ PROJECT DOSSIER</span><b>↗</b></div></div></button>`).join('');
  }
  function drawWritings() {
    byId('writing-list').innerHTML = writings.map(w=>`<button class="writing-card" data-writing="${w.id}" aria-label="Read ${esc(w.title)}"><span class="writing-tag">${esc(w.kind)} / ${w.date}</span><h3>${esc(w.title)}</h3><p>“${esc(w.excerpt)}”</p><div class="writing-card-bottom"><span>READ ENTRY</span><span>↗</span></div></button>`).join('');
  }
  function route() {
    const slug = (location.hash.replace(/^#\/?/,'') || 'home').split('/')[0];
    const current = pages.includes(slug) ? slug : 'home';
    pages.forEach(id => { const el=byId('page-'+id); el.classList.toggle('active',id===current); el.setAttribute('aria-hidden',id===current?'false':'true'); });
    document.querySelectorAll('[data-route]').forEach(link=>link.classList.toggle('active',link.dataset.route===current));
    byId('site-header').style.backgroundColor = current==='collections'?'#795144':current==='art'?'#e7d8cb':current==='digital'?'#27272e':current==='writing'?'#e9dfc9':current==='oddities'?'#36342b':current==='about'?'#a37a64':current==='contact'?'#e6d2b5':'transparent';
    const light = ['art','writing','about','contact'].includes(current);
    byId('site-header').classList.toggle('light-header',light);
    document.title = current==='home'?'UNFILED. — a personal creative archive':`${current.toUpperCase()} — UNFILED.`;
    closeMobile();
    closeModal();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function navigate(name) {location.hash='#/'+name; if ((location.hash.replace('#/',''))===name) route();}
  function closeMobile(){byId('mobile-menu').hidden=true;byId('menu-toggle').setAttribute('aria-expanded','false');}
  function toggleMobile(){const menu=byId('mobile-menu');const opened=!menu.hidden;menu.hidden=opened;byId('menu-toggle').setAttribute('aria-expanded',String(!opened));}
  function openModal(markup){previousFocus=document.activeElement;byId('modal-content').innerHTML=markup;byId('modal-backdrop').hidden=false;document.body.style.overflow='hidden';byId('modal-close').focus();}
  function closeModal(){if(byId('modal-backdrop').hidden)return;byId('modal-backdrop').hidden=true;document.body.style.overflow='';byId('modal-content').innerHTML='';if(previousFocus && document.contains(previousFocus))previousFocus.focus();}
  function showToast(msg){clearTimeout(toastHandle);const el=byId('toast');el.textContent=msg;el.classList.add('visible');toastHandle=setTimeout(()=>el.classList.remove('visible'),3500);}
  function openArtwork(id) {
    const a=artworks.find(x=>x.id===id);if(!a)return;
    openModal(`<div class="modal-art"><div class="modal-art-visual"><img src="assets/${a.id}.svg" alt="${esc(a.title)} artwork" /></div><div class="modal-copy"><span class="modal-kicker">ARTWORK / FILE ${String(artworks.indexOf(a)+1).padStart(3,'0')}</span><h3 id="modal-title">${esc(a.title)}</h3><p>${esc(a.description)}</p><p>${esc(a.note)}</p><div class="modal-tags"><span>${esc(a.categoryLabel)}</span><span>${a.year}</span><span>${esc(a.material)}</span></div><footer>ORIGINAL SAMPLE ARTWORK / UNFILED. PROTOTYPE</footer></div></div>`);
  }
  function openProject(id){const p=projects.find(x=>x.id===id);if(!p)return;openModal(`<div class="modal-project"><div class="modal-project-visual" style="background:${p.palette}"><span>${p.icon}</span><strong>${esc(p.name)}</strong></div><div class="modal-copy"><span class="modal-kicker">PROJECT DOSSIER / NO. ${p.number}</span><h3 id="modal-title">${esc(p.name)}</h3><p><strong>${esc(p.tagline)}</strong></p><p>${esc(p.description)}</p><p>${esc(p.details)}</p><div class="modal-tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><footer>PROTOTYPE SHOWCASE / FINAL SCREENSHOTS & LIVE LINKS TO BE ADDED</footer></div></div>`);}
  function openWriting(id){const w=writings.find(x=>x.id===id);if(!w)return;openModal(`<article class="modal-writing"><span class="modal-kicker">${esc(w.kind)} / ${esc(w.date)}</span><h3 id="modal-title">${esc(w.title)}</h3><div class="reading-body">${w.body.map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="reading-meta">EXCERPT / SAMPLE WRITING FOR PROTOTYPE &nbsp; · &nbsp; END OF FILE ✳</div></article>`);}
  function openOddity(idx){const o=oddities[idx];if(!o)return;openModal(`<div class="modal-writing" style="background:#ded9be"><span class="modal-kicker">${esc(o.kicker)} / ARCHIVE ENTRY</span><h3 id="modal-title">${esc(o.title)}</h3><p style="font:25px/1.3 var(--serif)">${esc(o.description)}</p><p style="font:14px/1.9 var(--sans);max-width:520px">${esc(o.body)}</p><div class="modal-tags">${o.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="reading-meta" style="margin-top:50px">UNCLASSIFIED NOTES / FILE STILL OPEN</div></div>`);}
  function previewPostcard(e){e.preventDefault();const form=byId('postcard-form');if(!form.reportValidity())return;const name=byId('sender').value.trim(),email=byId('sender-email').value.trim(),message=byId('message').value.trim();if(!name||!email||!message){showToast('Please complete your postcard first.');return;}const copyText=`From: ${name} (${email})\n\n${message}`;openModal(`<div class="modal-postcard"><span class="modal-kicker">POSTCARD PREVIEW / OUTGOING MAIL</span><h3 id="modal-title">A note from ${esc(name)}</h3><p>${esc(message)}</p><div class="reading-meta">REPLY TO: ${esc(email)}<br>THIS IS A PREVIEW ONLY. NO MESSAGE HAS BEEN SENT.</div><button class="modal-action" id="copy-postcard">COPY MESSAGE TO CLIPBOARD ↗</button></div>`);const btn=byId('copy-postcard');btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(copyText);showToast('Copied! Your postcard is yours to send.');}catch{showToast('Clipboard unavailable. Please select and copy your note.');}});}
  document.addEventListener('click',e=>{
    const go=e.target.closest('[data-go]');if(go){navigate(go.dataset.go);return;}
    const art=e.target.closest('[data-art]');if(art){openArtwork(art.dataset.art);return;}
    const project=e.target.closest('[data-project]');if(project){openProject(project.dataset.project);return;}
    const writing=e.target.closest('[data-writing]');if(writing){openWriting(writing.dataset.writing);return;}
    const odd=e.target.closest('[data-odd]');if(odd){openOddity(Number(odd.dataset.odd));return;}
    const filter=e.target.closest('[data-filter]');if(filter){document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===filter));drawArt(filter.dataset.filter);return;}
  });
  byId('menu-toggle').addEventListener('click',toggleMobile);
  document.querySelectorAll('#mobile-menu a').forEach(a=>a.addEventListener('click',closeMobile));
  byId('modal-close').addEventListener('click',closeModal);
  byId('modal-backdrop').addEventListener('click',e=>{if(e.target===byId('modal-backdrop'))closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeMobile();}});
  byId('id-badge').addEventListener('click',()=>byId('id-badge').classList.toggle('flipped'));
  byId('postcard-form').addEventListener('submit',previewPostcard);
  byId('back-to-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('hashchange',route);
  drawArt();drawProjects();drawWritings();route();
})();
