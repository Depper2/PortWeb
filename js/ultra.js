(function(){
  var $=function(s){return document.querySelector(s)};
  var stage=$('#stage'), ring=$('#ring'), robot=$('#robot'), rail=$('#rail'), track=$('#track'), counter=$('#counter');
  var cards=[].slice.call(document.querySelectorAll('.card')), N=cards.length;
  var dlg=$('#dlg'), dName=$('#dName'), dTags=$('#dTags'), dDesc=$('#dDesc'), dGo=$('#dGo'), dGo2=$('#dGo2'), dClose=$('#dClose');
  var shot=$('#shot'), shotImg=$('#shotImg'), shotPrev=$('#shotPrev'), shotNext=$('#shotNext'), shotCount=$('#shotCount');
  var lb=$('#lb'), lbImg=$('#lbImg'), lbCount=$('#lbCount'), lbClose=$('#lbClose'), lbPrev=$('#lbPrev'), lbNext=$('#lbNext'), lbOn=false;
  var win=dlg.querySelector('.win');
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var CW=260, step=360/N, angle=0, idx=-1, down=false, lastX=0, lastT=0, vel=0, moved=0, downCard=null;
  var moveTimer=null, typeTimer=null, openCard=null, slides=[], si=0, scrubbing=false;

  /*1. SET UP THE RING (radius from number of cards) + SLIDER PARTS*/
  ring.style.setProperty('--step',step+'deg');
  ring.style.setProperty('--r',((CW/2)/Math.tan(Math.PI/N)+14)+'px');
  cards.forEach(function(c,i){c.style.setProperty('--i',i)});
  var fill=document.createElement('div');
  fill.className='fill'; rail.appendChild(fill);
  var ticks=cards.map(function(c,i){
    var t=document.createElement('span'); t.className='tick';
    t.style.left=((i+.5)/N*100)+'%'; rail.appendChild(t); return t;
  });
  track.setAttribute('aria-valuemax',N);

  /* 2. DRAW: rotate ring, mark front card, move robot*/
  function front(){return ((Math.round(-angle/step)%N)+N)%N}
  function pos(i){return ((i+.5)/N*100)+'%'}
  function setRobot(p){robot.style.left=p; fill.style.width=Math.max(0,parseFloat(p))+'%'}
  function moveRobot(f){
    var dir=f>=idx?1:-1, first=idx<0;
    idx=f;
    robot.classList.toggle('left',dir<0);
    if(!scrubbing)setRobot(pos(f));
    if(first||reduce||scrubbing)return;
    robot.classList.add('moving');
    clearTimeout(moveTimer);
    moveTimer=setTimeout(function(){robot.classList.remove('moving')},800);
  }
  function render(){
    ring.style.transform='rotateY('+angle+'deg)';
    var f=front();
    cards.forEach(function(c,i){c.classList.toggle('front',i===f)});
    ticks.forEach(function(t,i){t.classList.toggle('on',i===f)});
    counter.textContent='Project '+String(f+1).padStart(2,'0')+' / '+String(N).padStart(2,'0');
    track.setAttribute('aria-valuenow',f+1);
    if(f!==idx)moveRobot(f);
  }
  function goTo(i){
    var cur=Math.round(-angle/step), d=(i-cur)%N;
    if(d>N/2)d-=N; if(d<-N/2)d+=N;
    angle=-(cur+d)*step;
    ring.classList.remove('intro'); ring.classList.add('snap'); render();
  }

  /*3. DRAG / CLICK / BUTTONS / KEYS*/
  stage.addEventListener('pointerdown',function(e){
    if(e.button>0)return;
    down=true; moved=0; vel=0; lastX=e.clientX; lastT=performance.now();
    downCard=e.target.closest('.card');
    ring.classList.remove('snap','intro'); stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',function(e){
    if(!down)return;
    var dx=e.clientX-lastX, now=performance.now();
    moved+=Math.abs(dx); vel=dx/Math.max(now-lastT,1); lastX=e.clientX; lastT=now;
    angle+=dx*0.35; render();
  });
  function release(){
    if(!down)return; down=false; stage.classList.remove('dragging');
    if(moved<6){
      if(downCard){var i=cards.indexOf(downCard); if(i===front())openDetail(downCard); else goTo(i);}
      else goTo(front());
      return;
    }
    var push=Math.max(-step*2,Math.min(step*2,vel*0.35*200));
    angle=Math.round((angle+push)/step)*step;
    ring.classList.add('snap'); render();
  }
  stage.addEventListener('pointerup',release);
  stage.addEventListener('pointercancel',release);

  $('#prev').addEventListener('click',function(){goTo((front()+N-1)%N)});
  $('#next').addEventListener('click',function(){goTo((front()+1)%N)});
  cards.forEach(function(c,i){c.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault(); if(i===front())openDetail(c); else goTo(i);}
  })});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){if(lbOn)closeLb();else closeDetail();return;}
    if(lbOn){
      if(e.key==='ArrowRight'&&slides.length>1)lbShow(si+1);
      if(e.key==='ArrowLeft'&&slides.length>1)lbShow(si-1);
      return;
    }
    if(openCard)return;
    if(e.key==='ArrowRight')goTo((front()+1)%N);
    if(e.key==='ArrowLeft')goTo((front()+N-1)%N);
  });

  /*3b. ROBOT SLIDER (drag the robot or click the rail to jump)*/
  function scrubTo(e){
    var r=rail.getBoundingClientRect();
    var p=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    var i=Math.min(N-1,Math.floor(p*N));
    if(i!==front())goTo(i);
    setRobot((p*100)+'%');
  }
  function endScrub(){
    if(!scrubbing)return;
    scrubbing=false; track.classList.remove('scrub'); setRobot(pos(front()));
  }
  track.addEventListener('pointerdown',function(e){
    if(e.button>0)return;
    scrubbing=true; track.classList.add('scrub'); track.setPointerCapture(e.pointerId); scrubTo(e);
  });
  track.addEventListener('pointermove',function(e){if(scrubbing)scrubTo(e)});
  track.addEventListener('pointerup',endScrub);
  track.addEventListener('pointercancel',endScrub);

  /*4. DETAIL WINDOW (name, tags, screenshot slider, typed description, links)*/
  function showShot(i){
    if(!slides.length)return;
    si=(i+slides.length)%slides.length;
    shotImg.src=slides[si];
    shotImg.alt=dName.textContent+' screenshot '+(si+1)+' of '+slides.length;
    shotCount.textContent=(si+1)+' / '+slides.length;
    var pre=new Image(); pre.src=slides[(si+1)%slides.length];   /* preload the next one */
  }
  function setupShots(card){
    var d=card.dataset, from=parseInt(d.galleryFrom,10)||1, to=parseInt(d.galleryTo,10)||0;
    slides=[];
    if(d.gallery){for(var n=from;n<=to;n++)slides.push(d.gallery.replace('{n}',n));}
    shot.hidden=!slides.length;
    shotPrev.hidden=shotNext.hidden=slides.length<2;
    if(slides.length)showShot(0); else{shotImg.removeAttribute('src');shotCount.textContent='';}
  }
  function openDetail(card){
    openCard=card;
    win.classList.toggle('portrait',card.dataset.layout==='portrait');
    win.scrollTop=0;
    dName.textContent=card.dataset.name; dTags.textContent=card.dataset.tags||'';
    var link=card.dataset.link; dGo.hidden=!link; if(link)dGo.href=link;
    var link2=card.dataset.link2; dGo2.hidden=!link2;
    if(link2){dGo2.href=link2; dGo2.textContent=card.dataset.link2Label||'More';}
    setupShots(card);
    dlg.classList.add('open'); dClose.focus({preventScroll:true});
    var text=card.dataset.desc||'', i=0;
    clearInterval(typeTimer);
    if(reduce){dDesc.textContent=text;}
    else{
      dDesc.textContent='';
      typeTimer=setInterval(function(){i++;dDesc.textContent=text.slice(0,i);if(i>=text.length)clearInterval(typeTimer)},14);
      robot.classList.add('cheer'); setTimeout(function(){robot.classList.remove('cheer')},1100);
    }
  }
  function closeDetail(){
    closeLb();
    if(!openCard)return;
    clearInterval(typeTimer); dlg.classList.remove('open');
    var c=openCard; openCard=null; c.focus({preventScroll:true});
  }
  dClose.addEventListener('click',closeDetail);
  dlg.addEventListener('click',function(e){if(e.target===dlg)closeDetail()});
  shotPrev.addEventListener('click',function(){showShot(si-1)});
  shotNext.addEventListener('click',function(){showShot(si+1)});
  var sx=null;
  shot.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
  shot.addEventListener('touchend',function(e){
    if(sx===null)return;
    var dx=e.changedTouches[0].clientX-sx; sx=null;
    if(Math.abs(dx)>40)showShot(dx<0?si+1:si-1);
  },{passive:true});
  dlg.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'&&slides.length>1){e.preventDefault();showShot(si+1);}
    else if(e.key==='ArrowLeft'&&slides.length>1){e.preventDefault();showShot(si-1);}
    else if(e.key==='Tab'){
      e.preventDefault();
      var f=[].slice.call(dlg.querySelectorAll('button,a[href]')).filter(function(el){return !el.hidden});
      if(!f.length)return;
      var i=f.indexOf(document.activeElement);
      f[e.shiftKey?(i<=0?f.length-1:i-1):(i===f.length-1?0:i+1)].focus();
    }
  });

  /*4b. ZOOMED IMAGE VIEWER (picture only, synced with the detail slider)*/
  function lbShow(i){
    showShot(i);
    lbImg.src=slides[si]; lbImg.alt=shotImg.alt;
    lbCount.textContent=(si+1)+' / '+slides.length;
  }
  function openLb(){
    if(!slides.length)return;
    lbOn=true; lbPrev.hidden=lbNext.hidden=slides.length<2;
    lbShow(si); lb.classList.add('open'); lbClose.focus({preventScroll:true});
  }
  function closeLb(){
    if(!lbOn)return;
    lbOn=false; lb.classList.remove('open'); dClose.focus({preventScroll:true});
  }
  shotImg.addEventListener('click',openLb);
  lbClose.addEventListener('click',closeLb);
  lbPrev.addEventListener('click',function(){lbShow(si-1)});
  lbNext.addEventListener('click',function(){lbShow(si+1)});
  lbImg.addEventListener('click',function(){if(slides.length>1)lbShow(si+1)});
  lb.addEventListener('click',function(e){if(e.target===lb)closeLb()});
  var lx=null;
  lb.addEventListener('touchstart',function(e){lx=e.touches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){
    if(lx===null)return;
    var dx=e.changedTouches[0].clientX-lx; lx=null;
    if(Math.abs(dx)>40&&slides.length>1)lbShow(dx<0?si+1:si-1);
  },{passive:true});
  lb.addEventListener('keydown',function(e){
    if(e.key==='Tab'){
      e.preventDefault();
      var f=[].slice.call(lb.querySelectorAll('button')).filter(function(el){return !el.hidden});
      var i=f.indexOf(document.activeElement);
      f[e.shiftKey?(i<=0?f.length-1:i-1):(i===f.length-1?0:i+1)].focus();
    }
  });

  /*5. FIT THE RING TO THE SCREEN (width and leftover height)*/
  function fit(){
    var k=Math.min(1,window.innerWidth/620,stage.clientHeight/430);
    document.documentElement.style.setProperty('--k',Math.max(.45,k));
  }
  window.addEventListener('resize',fit);
  window.addEventListener('load',fit);
  fit();

  /*6. INTRO: ring spins in, robot slides in from the left*/
  if(reduce){render();}
  else{
    angle=-step*3; render();
    idx=-1; setRobot('-12%');
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      ring.classList.add('intro'); angle=0; render();
      robot.classList.add('moving'); setTimeout(function(){robot.classList.remove('moving')},900);
    })});
  }
})();