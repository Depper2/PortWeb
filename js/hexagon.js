(function(){
  var stage=document.getElementById('stage'), prism=document.getElementById('prism');
  var faces=[].slice.call(prism.querySelectorAll('.face'));
  var btns=[].slice.call(document.querySelectorAll('#nav button'));
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var angle=0, down=false, lastX=0, lastT=0, vel=0, moved=0, downFace=null;

  /* D-0. Remember the selected side (survives reload and coming back from another page) */
  var KEY='hexFace';
  function saved(){try{var n=parseInt(localStorage.getItem(KEY),10);return n>=0&&n<6?n:0}catch(e){return 0}}
  function save(){try{localStorage.setItem(KEY,frontIndex())}catch(e){}}

  /* D-1. Draw the rotation and mark the side facing the viewer */
  function frontIndex(){return ((Math.round(-angle/60)%6)+6)%6}
  function render(){
    prism.style.transform='rotateY('+angle+'deg)';
    var f=frontIndex();
    faces.forEach(function(el,i){el.classList.toggle('front',i===f)});
    btns.forEach(function(b,i){b.setAttribute('aria-current',i===f?'true':'false')});
  }

  /* D-2. Turn to a side by the shortest way around */
  function goTo(i){
    var cur=Math.round(-angle/60), d=(i-cur)%6;
    if(d>3)d-=6; if(d<-3)d+=6;
    angle=-(cur+d)*60;
    prism.classList.remove('intro'); prism.classList.add('snap');
    render(); save();
  }

  /* D-2b. Open the page linked to a face */
  function openPage(href){ window.location.href=href; }

  /* D-3. Drag with the mouse or finger, then snap to the nearest side */
  stage.addEventListener('pointerdown',function(e){
    down=true; moved=0; vel=0; lastX=e.clientX; lastT=performance.now();
    downFace=e.target.closest('.face');
    prism.classList.remove('snap','intro');
    stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',function(e){
    if(!down)return;
    var dx=e.clientX-lastX, now=performance.now(), dt=Math.max(now-lastT,1);
    moved+=Math.abs(dx); vel=dx/dt; lastX=e.clientX; lastT=now;
    angle+=dx*0.4; render();
  });
  function release(){
    if(!down)return; down=false; stage.classList.remove('dragging');
    if(moved<6){
      /* D-3a. Tap: front face with a link opens its page, any other face turns to the front */
      if(downFace && +downFace.dataset.i===frontIndex() && downFace.dataset.href){ openPage(downFace.dataset.href); return; }
      if(downFace) goTo(+downFace.dataset.i); else goTo(frontIndex());
      return;
    }
    var push=Math.max(-120,Math.min(120,vel*0.4*200));
    angle=Math.round((angle+push)/60)*60;
    prism.classList.add('snap'); render(); save();
  }
  stage.addEventListener('pointerup',release);
  stage.addEventListener('pointercancel',release);

  /* D-4. Buttons and keyboard arrows */
  btns.forEach(function(b){b.addEventListener('click',function(){goTo(+b.dataset.i)})});
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight')goTo((frontIndex()+1)%6);
    if(e.key==='ArrowLeft')goTo((frontIndex()+5)%6);
    /* Enter opens the front face's page (ignored when a button has focus) */
    if(e.key==='Enter' && e.target.tagName!=='BUTTON'){
      var h=faces[frontIndex()].dataset.href; if(h) openPage(h);
    }
  });

  /* D-5. Scale the hexagon to fit its column (or fill the width on phones) */
  function fit(){
    var stacked=window.innerWidth<860, w=stage.clientWidth, h=stage.clientHeight;
    var hMax=(h-40)/(420*1.25);   /* 1.25 = room for perspective + tilt */
    var k=stacked?Math.min(1.25,(window.innerWidth-24)/330):Math.min(1,(w-16)/640);
    document.documentElement.style.setProperty('--k',Math.max(.45,Math.min(k,hMax,1.25)));
  }
  window.addEventListener('resize',fit); fit();

  /* D-6. Opening: curtain splits (0.5s), welcome text pops (1.2s+), hexagon pops and spins in (1.7s) */
  var root=document.documentElement, curtain=document.getElementById('curtain');
  var cr=curtain.querySelector('.half.r');
  cr.addEventListener('animationend',function(){curtain.remove()});
  document.getElementById('replay').addEventListener('click',function(){location.reload()});
  var target=-saved()*60;   /* angle of the side that was open last time (Home on the first visit) */
  if(reduce){angle=target; render(); requestAnimationFrame(function(){root.classList.add('go')});}
  else{
    angle=target-300; render();
    requestAnimationFrame(function(){root.classList.add('go')});
    setTimeout(function(){prism.classList.add('intro'); angle=target; render();},1700);
  }
})();