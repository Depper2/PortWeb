(function(){
  var CFG={
    sfx:'audio/blink.mp3',
    sfxVolume:.6,
    sfxMaxSeconds:.9,
    onlyOncePerSession:false 
  };

  var root=document.documentElement;
  try{if(CFG.onlyOncePerSession&&sessionStorage.getItem('introSeen'))return;}catch(e){}
  root.classList.add('intro-wait');

  var ui=null,heart=null,started=false,done=false;

  function playSound(){
    try{
      var a=new Audio(CFG.sfx);
      a.loop=false;
      a.volume=CFG.sfxVolume;
      var p=a.play();
      if(p&&p.catch)p.catch(function(){});
      setTimeout(function(){try{a.pause();}catch(e){}},CFG.sfxMaxSeconds*1000);
    }catch(e){}
  }

  var HEART=['.##..##.','########','########','########','.######.','..####..','...##...'];
  function heartSVG(){
    var d='';
    HEART.forEach(function(r,y){for(var x=0;x<r.length;x++)if(r.charAt(x)==='#')d+='M'+x+' '+y+'h1v1h-1z';});
    return '<svg viewBox="0 0 8 7" shape-rendering="crispEdges" aria-hidden="true"><path d="'+d+'" fill="#FF0000"/></svg>';
  }
  function build(){
    ui=document.createElement('div'); ui.className='intro-ui'; ui.setAttribute('aria-hidden','true');
    ui.innerHTML='<div class="intro-start go"><span class="intro-heart">'+heartSVG()+'</span></div>';
    document.body.appendChild(ui);
    heart=ui.querySelector('.intro-heart');
    start();
  }

  function start(){
    if(started)return; started=true;
    playSound();
    heart.classList.add('off');
    [0,260,520].forEach(function(t){
      setTimeout(function(){heart.classList.remove('off')},t);
      setTimeout(function(){heart.classList.add('off')},t+130);
    });
    setTimeout(function(){heart.classList.remove('off')},800);
    setTimeout(function(){
      heart.style.transform='translate('+(-(window.innerWidth/2-36))+'px,'+(-(window.innerHeight/2-36))+'px) scale(.3)';
      ui.classList.add('out');
    },1000);
    setTimeout(finish,1750);
  }
  function finish(){
    if(done)return; done=true;
    if(ui)ui.remove();
    root.classList.remove('intro-wait');
    try{sessionStorage.setItem('introSeen','1');}catch(e){}
  }

  function safeBuild(){try{build();}catch(e){finish();}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',safeBuild); else safeBuild();
})();