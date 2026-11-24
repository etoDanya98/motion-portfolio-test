const portfolio=document.querySelector('.portfolio');
const detail=document.querySelector('#project-detail');
const detailTitle=document.querySelector('#detail-title');
const caseNotes={form:'An independent study in shape, rhythm, and dimensional motion. Concept, design, and animation / 2026.',type:'An independent exploration of expressive type and playful timing. Concept, design, and animation / 2026.',character:'A character study built from simple shapes and a little personality. Concept, design, and animation / 2026.'};
let renderedProject=null;
let homeScroll=0;
let projectTransition=null;
let pendingProjectRoute;
let projectRouteGeneration=0;
history.scrollRestoration='manual';
function projectFromURL(){const match=location.hash.match(/^#project\/(form|type|character)$/);return match?match[1]:null}
function finishPreviewTransition(){preview.getAnimations({subtree:true}).forEach(animation=>{if(animation.effect.target.classList.contains('preview-layer'))animation.finish()})}
function populateProject(key){
 detailTitle.textContent=works[key].title;
 detail.querySelectorAll('.case-card').forEach(card=>card.replaceChildren(artwork(key)));
 detail.dataset.work=key;
 document.querySelector('#detail-note').textContent=caseNotes[key];
 const next=Object.keys(works)[(Object.keys(works).indexOf(key)+1)%Object.keys(works).length];
 document.querySelector('.next-project').innerHTML='Next: '+works[next].title+' <span aria-hidden="true">↗</span>';
 document.querySelector('.next-project').dataset.next=next;
}
function syncProjectRoute(animate=true){
 const key=projectFromURL();
 if(key===pendingProjectRoute||(key===renderedProject&&detail.hidden===!key))return;
 const previous=renderedProject;
 const routeGeneration=++projectRouteGeneration;
 pendingProjectRoute=key;
 const closing=!!previous&&!key;
 document.documentElement.dataset.pageTransition=closing?'close':'open';
 // The reference returns the case study to its first panel before folding it away.
 if(closing)window.scrollTo({top:0,behavior:'instant'});
 if(key){selectWork(key);finishPreviewTransition();cancelAnimationFrame(highlightSpring.frame);highlightSpring.frame=0;highlightSpring.y=highlightSpring.target;highlightSpring.velocity=0;paintHighlight()}
 const commit=()=>{
  if(routeGeneration!==projectRouteGeneration)return;
  if(key)populateProject(key);
  if(!key)portfolio.classList.add('restoring');
  portfolio.hidden=!!key;detail.hidden=!key;
  if(!key){
   // Recalculate the destination after unhiding the list, before the new snapshot.
   moveHighlight();cancelAnimationFrame(highlightSpring.frame);highlightSpring.frame=0;
   highlightSpring.y=highlightSpring.target;highlightSpring.velocity=0;paintHighlight();
   finishPreviewTransition();
  }
  document.body.classList.toggle('project-open',!!key);
  if(key){detail.classList.remove('opening');void detail.offsetWidth;detail.classList.add('opening')}
  document.title=key?works[key].title+' — Motion folio':'Motion folio — Selected motion';
  window.scrollTo({top:key?0:homeScroll,behavior:'instant'});
  renderedProject=key;pendingProjectRoute=undefined;
 };
 const focusDestination=()=>{if(key)detailTitle.focus({preventScroll:true});else if(previous)document.querySelector('[data-work="'+previous+'"]').focus({preventScroll:true})};
 if(projectTransition)projectTransition.skipTransition();
 if(animate&&!reduced.matches&&document.startViewTransition){
  projectTransition=document.startViewTransition(commit);
  const transition=projectTransition;
  const settle=()=>{if(projectTransition===transition){projectTransition=null;focusDestination()}};
  transition.finished.then(settle,settle);
 }else{commit();focusDestination()}
}
function openProject(key){
 if(!works[key]||projectFromURL()===key)return;
 const fromPortfolio=!projectFromURL();
 if(fromPortfolio)homeScroll=window.scrollY;
 history.pushState({fromPortfolio},'',location.href.split('#')[0]+'#project/'+key);
 syncProjectRoute();
}
function backToProjects(){
 if(!projectFromURL())return;
 if(history.state&&history.state.fromPortfolio)history.back();
 else{history.pushState(null,'',location.href.split('#')[0]);syncProjectRoute()}
}
monitor.addEventListener('click',()=>openProject(current));
document.querySelector('.preview-caption .expand').addEventListener('click',()=>openProject(current));
document.querySelector('.detail-back').addEventListener('click',backToProjects);
document.querySelector('.detail-replay').addEventListener('click',()=>{const key=projectFromURL();if(key)detail.querySelectorAll('.case-card').forEach(card=>card.replaceChildren(artwork(key)))});
document.querySelector('.next-project').addEventListener('click',event=>openProject(event.currentTarget.dataset.next));
window.addEventListener('popstate',()=>syncProjectRoute());
window.addEventListener('hashchange',()=>syncProjectRoute());
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&projectFromURL()){event.preventDefault();backToProjects()}});
function projectSpringTiming(stiffness,damping,mass,duration){
 const decay=damping/(2*mass),frequency=Math.sqrt(stiffness/mass-decay*decay);
 const values=Array.from({length:91},(_,index)=>{const t=index/90*duration;const progress=index===90?1:1-Math.exp(-decay*t)*(Math.cos(frequency*t)+decay/frequency*Math.sin(frequency*t));return Math.round(progress*100000)/100000});
 return 'linear('+values.join(',')+')';
}
if(CSS.supports('animation-timing-function','linear(0,1)')){
 document.documentElement.style.setProperty('--project-image-spring',projectSpringTiming(280,33,1.5,.9));
 document.documentElement.style.setProperty('--project-surface-spring',projectSpringTiming(300,34,1.5,.9));
}
syncProjectRoute(false);
