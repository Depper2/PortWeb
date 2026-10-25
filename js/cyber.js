/* =====================================================
   CYBER PAGE SCRIPT: intro, digital rain, power-on reveal, decode text, music
   ===================================================== */
(function(){
  var reduce=false;
  var root=document.documentElement;

  /*  1. DIGITAL RAIN (background canvas)  */
  var cv=document.getElementById('rain');
  if(cv){
    if(reduce){cv.hidden=true;}
    else{
      var cx=cv.getContext('2d'), size=16, w=0, h=0, cols=0, drops=[], last=0, timer=null;
      var glyphs='アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789<>/\\{}[]#$%';
      var resize=function(){
        var dpr=Math.min(window.devicePixelRatio||1,2);
        w=window.innerWidth; h=window.innerHeight;
        cv.width=w*dpr; cv.height=h*dpr; cx.setTransform(dpr,0,0,dpr,0,0);
        cols=Math.ceil(w/size); drops=[];
        for(var i=0;i<cols;i++)drops.push(-Math.random()*h/size);
        cx.fillStyle='#05050A'; cx.fillRect(0,0,w,h);
      };
      var frame=function(t){
        requestAnimationFrame(frame);
        if(document.hidden||t-last<60)return;   /* about 16 frames per second */
        last=t;
        cx.fillStyle='rgba(5,5,10,.14)'; cx.fillRect(0,0,w,h);   /* fades old letters into a trail */
        cx.font=size+'px "Share Tech Mono",monospace';
        for(var i=0;i<cols;i++){
          var y=drops[i]*size;
          cx.fillStyle=i%5===0?'rgba(255,31,61,.6)':'rgba(0,240,255,.45)';
          cx.fillText(glyphs.charAt(Math.floor(Math.random()*glyphs.length)),i*size,y);
          if(y>h&&Math.random()>.975)drops[i]=0; else drops[i]+=1;
        }
      };
      resize();
      window.addEventListener('resize',function(){clearTimeout(timer);timer=setTimeout(resize,200)});
      requestAnimationFrame(frame);
    }
  }

  /*  2. CHIP GLOW ORDER  */
  [].forEach.call(document.querySelectorAll('.chips li'),function(li,i){li.style.setProperty('--c',i%6)});

  /*  3. DECODE TEXT (heading scrambles into place)  */
  function scramble(el){
    var txt=el.textContent, n=0, pool='!<>-_\\/[]{}=+*^?#01';
    var t=setInterval(function(){
      var out='';
      for(var i=0;i<txt.length;i++)out+=(i<n||txt.charAt(i)===' ')?txt.charAt(i):pool.charAt(Math.floor(Math.random()*pool.length));
      el.textContent=out; n+=.6;
      if(n>=txt.length){clearInterval(t);el.textContent=txt;}
    },40);
  }

  /*  4. POWER-ON REVEAL (starts while the intro opens)  */
  var items=[].slice.call(document.querySelectorAll('.reveal'));
  function show(el){
    el.classList.add('in');
    var h=el.querySelector('h3');
    if(h&&!reduce)setTimeout(function(){scramble(h)},(items.indexOf(el)%3)*120);
  }
  function startReveal(){
    if(reduce||!('IntersectionObserver' in window)){items.forEach(function(el){el.classList.add('in')});return;}
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target);}});
    },{threshold:.2});
    items.forEach(function(el,i){el.style.animationDelay=(i%3)*0.12+'s';io.observe(el);});
  }

  /*  5. INTRO BOOT SCREEN (type lines, then diagonal split opens, about 5 seconds)  */
  var bs=document.getElementById('bs');
  var revealed=false;
  function beginReveal(){if(revealed)return; revealed=true; startReveal();}
  function endIntro(){
    root.classList.remove('booting');
    if(bs&&bs.parentNode)bs.parentNode.removeChild(bs);
    beginReveal();
  }
  if(!bs||reduce){endIntro();}
  else{
    var text=document.getElementById('bsText'), fill=document.getElementById('bsFill');
    var lines=['> initializing neural link...','> loading skill.dat ..... ok','> loading interest.dat . ok','> ACCESS GRANTED'];
    var li=0, ci=0, done=false, tm=null;
    var finish=function(){
      if(done)return; done=true; clearTimeout(tm);
      text.textContent=lines.join('\n'); fill.style.width='100%';   /* bar fills to 100% */
      setTimeout(function(){
        bs.classList.add('open');            /* the diagonal opens once the bar is full */
        setTimeout(beginReveal,1000);        /* panels power on while the gap widens */
        setTimeout(endIntro,3000);           /* remove the screen after the slide ends */
      },450);
    };
    var type=function(){
      if(done)return;
      if(li>=lines.length){tm=setTimeout(finish,300);return;}
      var line=lines[li];
      text.textContent=lines.slice(0,li).join('\n')+(li?'\n':'')+line.slice(0,ci);
      if(ci<line.length){ci++; tm=setTimeout(type,22);}
      else{li++; ci=0; fill.style.width=(li/lines.length*100)+'%'; tm=setTimeout(type,150);}
    };
    bs.addEventListener('click',finish);   /* click to skip the typing */
    tm=setTimeout(type,250);               /* start typing */
  }

  /*  6. MUSIC (plays muted if blocked, first click unmutes)  */
  var audio=document.getElementById('bgm'), btn=document.getElementById('snd');
  if(audio&&btn){
    var label=btn.querySelector('.snd-t');
    var noTrack=function(){
      label.textContent='No track'; btn.disabled=true; btn.classList.add('muted');
      console.warn('Audio failed to load. src='+audio.currentSrc+' error code='+(audio.error?audio.error.code:'none')+' (4 = file not found or unsupported)');
    };
    var paint=function(){
      var on=!audio.paused&&!audio.muted;
      btn.classList.toggle('muted',!on);
      btn.setAttribute('aria-pressed',String(on));
      label.textContent=on?'Sound on':'Sound off';
    };
    var evs=['pointerdown','keydown','touchend','click'], armed=false;
    var disarm=function(){evs.forEach(function(n){document.removeEventListener(n,unlock,true)}); armed=false};
    var armGesture=function(){
      if(armed)return; armed=true;
      evs.forEach(function(n){document.addEventListener(n,unlock,true)});
    };
    /* try with sound; if the browser blocks it, play silently and wait for a click */
    var start=function(){
      var p=audio.play();
      if(p&&p.catch)p.catch(function(){
        audio.muted=true;
        var q=audio.play(); if(q&&q.catch)q.catch(function(){});
        armGesture(); paint();
      });
    };
    var unlock=function(e){
      if(btn.contains(e.target))return;   /* the button has its own handler */
      disarm(); audio.muted=false; start();
    };
    audio.volume=.10; audio.muted=false;
    ['play','pause','volumechange'].forEach(function(n){audio.addEventListener(n,paint)});
    btn.addEventListener('click',function(){
      disarm();
      if(audio.paused){audio.muted=false; start();}
      else audio.muted=!audio.muted;
      paint();
    });
    audio.addEventListener('error',noTrack);
    if(audio.error){noTrack();}
    else{paint(); start();}
  }
})();