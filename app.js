const works={form:{title:'Form study'},type:{title:'Type in motion'},character:{title:'A little character'}};
let current=null;
const preview=document.querySelector('#preview');
const monitor=document.querySelector('.monitor');

const projects=document.querySelector('.projects');
const highlight=document.querySelector('.project-highlight');
// Full motion is explicitly enabled for this portfolio; Pause disables it site-wide.
const reduced={get matches(){return document.documentElement.dataset.motion==='off'}};
const easing='cubic-bezier(.22,1,.36,1)';
function artwork(key){return document.querySelector('#work-'+key).content.cloneNode(true)}
// Reference spring, slowed by 1.7x while preserving its damping ratio.
const highlightSpring={y:0,velocity:0,target:0,frame:0,time:0,initialized:false};
function paintHighlight(){highlight.style.transform='translateY('+highlightSpring.y+'px)'}
function stepHighlight(time){
 const state=highlightSpring;
 const dt=Math.max(0,Math.min((time-state.time)/1000,.064));state.time=time;
 const displacement=state.y-state.target,velocity=state.velocity;
 const timeScale=1.7,damping=15/timeScale,frequency=Math.sqrt(95)/timeScale,omegaSquared=320/(timeScale*timeScale);
 const decay=Math.exp(-damping*dt),cos=Math.cos(frequency*dt),sin=Math.sin(frequency*dt);
 state.y=state.target+decay*(displacement*cos+(velocity+damping*displacement)/frequency*sin);
 state.velocity=decay*(velocity*cos-(damping*velocity+omegaSquared*displacement)/frequency*sin);
 if(Math.abs(state.y-state.target)<.01&&Math.abs(state.velocity)<.05){state.y=state.target;state.velocity=0;state.frame=0;paintHighlight();return}
 paintHighlight();state.frame=requestAnimationFrame(stepHighlight);
}
function moveHighlight(){
 const button=projects.querySelector('.active');if(!button)return;
 const inset=matchMedia('(max-width:1023px)').matches?2:4;
 highlight.style.top=inset+'px';highlight.style.height=(button.offsetHeight-inset*2)+'px';
 const state=highlightSpring;state.target=button.offsetTop;
 if(!state.initialized||reduced.matches){cancelAnimationFrame(state.frame);state.y=state.target;state.velocity=0;state.frame=0;state.initialized=true;paintHighlight();return}
 if(!state.frame){state.time=performance.now();state.frame=requestAnimationFrame(stepHighlight)}
}
function selectWork(key){
 if(!works[key]||key===current)return;
 const previous=preview.querySelector('.preview-layer:not(.leaving)');
 preview.querySelectorAll('.leaving').forEach(layer=>layer.remove());
 const next=document.createElement('div');next.className='preview-layer';next.append(artwork(key));preview.append(next);

 if(previous){previous.classList.add('leaving');if(reduced.matches)previous.remove();else{const exit=previous.animate([{opacity:getComputedStyle(previous).opacity,filter:getComputedStyle(previous).filter},{opacity:0,filter:'blur(2px)'}],{duration:250,easing:'ease-in-out',fill:'forwards'});exit.finished.then(()=>previous.remove()).catch(()=>previous.remove())}}
 if(current!==null&&!reduced.matches)next.animate([{opacity:0,filter:'blur(2px)'},{opacity:1,filter:'blur(0px)'}],{duration:250,easing:'ease-in-out'});
 current=key;
 const title=document.querySelector('#preview-title');title.textContent=works[key].title;
 if(!reduced.matches)title.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing});
 monitor.setAttribute('aria-label','Open '+works[key].title+' project');
 document.querySelectorAll('.project').forEach(button=>{const active=button.dataset.work===key;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});moveHighlight();
}
document.querySelectorAll('.project').forEach(button=>{button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')selectWork(button.dataset.work)});button.addEventListener('focus',()=>selectWork(button.dataset.work));button.addEventListener('click',()=>{selectWork(button.dataset.work);openProject(button.dataset.work)})});
let bioAnimation;
document.querySelector('.more').addEventListener('click',event=>{
 const button=event.currentTarget,bio=document.querySelector('#bio'),expanded=button.getAttribute('aria-expanded')!=='true';
 const from=bio.hidden?0:bio.getBoundingClientRect().height;
 if(bioAnimation)bioAnimation.cancel();
 button.setAttribute('aria-expanded',String(expanded));bio.hidden=false;bio.inert=!expanded;bio.style.height='auto';const target=expanded?bio.getBoundingClientRect().height:0;
 if(reduced.matches){bio.hidden=!expanded;bio.style.height='';return}
 bio.style.height=from+'px';bioAnimation=bio.animate([{height:from+'px',opacity:expanded?0:1},{height:target+'px',opacity:expanded?1:0}],{duration:460,easing,fill:'both'});
 bioAnimation.finished.then(()=>{bio.hidden=!expanded;bio.style.height='';bioAnimation.cancel();bioAnimation=null}).catch(()=>{});
});
document.querySelector('.pause').addEventListener('click',event=>{const paused=document.body.classList.toggle('paused');document.documentElement.dataset.motion=paused?'off':'full';if(paused){cancelAnimationFrame(highlightSpring.frame);highlightSpring.frame=0;highlightSpring.y=highlightSpring.target;highlightSpring.velocity=0;paintHighlight();document.getAnimations().forEach(animation=>{if(animation.effect&&animation.effect.getTiming().iterations!==Infinity)animation.finish()})}event.currentTarget.setAttribute('aria-pressed',String(paused));event.currentTarget.setAttribute('aria-label',paused?'Resume animations':'Pause animations');event.currentTarget.innerHTML=paused?'<span class="pause-icon" aria-hidden="true">▷</span> Resume':'<span class="pause-icon" aria-hidden="true">Ⅱ</span> Pause'});
const subtitle=document.querySelector('h2');subtitle.innerHTML=subtitle.textContent.trim().split(/\s+/).map((word,index)=>'<span style="--word:'+index+'">'+word+'</span>').join(' ');
selectWork('form');
requestAnimationFrame(()=>{moveHighlight();requestAnimationFrame(()=>projects.classList.add('ready'))});
new ResizeObserver(moveHighlight).observe(projects);
document.fonts.ready.then(moveHighlight);
