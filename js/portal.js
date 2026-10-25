
(function(){
  /*  1. LINES  */
  var NAME='GLaDOS';
  var greetings=[
    'Hello. You made it into the lobby. Congratulations on clearing a very low bar.',
    'Oh, a visitor. Please wipe your feet. Or do not. The floor has seen worse.',
    'Welcome. These are the certificates. I was told to be supportive. This is me trying.',
    'Greetings, human. Please keep your hands inside the exhibit at all times.',
    'Hello again. Or for the first time. I cannot tell humans apart. It is fine.',
    'Oh good, company. I was starting to talk to the walls. They do not answer either.'
  ];
  var hovers=[
    'Wanna learn more? Click it. I will pretend I am not excited.',
    'That one? Interesting choice. Click it and I will explain.',
    'Go on, click. Nothing bad happens. Probably.',
    'Ah, a curious one. Click, and I will tell you all about it.',
    'Scientifically speaking, you should click that.',
    'Hover all you like. The good part only happens when you click.'
  ];
  var idles=[
    'Still here? The certificates are not going anywhere. Unlike some visitors.',
    'Take your time. I am not timing you. Mostly.',
    'Nine certificates. Not a bad result for a test subject.',
    'Fun fact: hovering does not make things click themselves.',
    'I am monitoring your cursor. For science.'
  ];
  var intros=['Pulling up the file for','Here is what I have on','Ah, the one called'];
  var outros=['Done already? Fine. Back to the chamber.','Closing the file. Try not to miss it.','Done looking? Pick another. I will be here. I am always here.'];

  /*  2. ELEMENTS + STATE  */
  var $=function(s){return document.querySelector(s)};
  var glados=$('#glados'), typed=$('#typed'), ghost=$('#ghost'), sr=$('#sr');
  var modal=$('#modal'), zimg=$('#zimg'), closeBtn=$('#close');
  var cards=[].slice.call(document.querySelectorAll('.cert'));
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var timer=null, current=null, lastSpoke=0, hoverAt=0;
  $('#who').textContent=NAME;

  function picker(a){var last=-1;return function(){var i;do{i=Math.floor(Math.random()*a.length)}while(a.length>1&&i===last);last=i;return a[i]}}
  var greet=picker(greetings), hover=picker(hovers), idle=picker(idles), intro=picker(intros), outro=picker(outros);

  /*  3. SPEAK (typewriter)  */
  function say(text,fast){
    clearInterval(timer);
    lastSpoke=Date.now();
    ghost.textContent=text; sr.textContent=text; typed.textContent='';
    if(reduce){typed.textContent=text;glados.classList.remove('speaking');return;}
    glados.classList.add('speaking');
    var i=0;
    timer=setInterval(function(){
      i++; typed.textContent=text.slice(0,i);
      if(i>=text.length){clearInterval(timer);glados.classList.remove('speaking');}
    },fast?16:26);
  }

  /*  4. HOVER REACTIONS  */
  cards.forEach(function(c){
    function react(){
      if(current||Date.now()-hoverAt<1800)return;
      hoverAt=Date.now(); say(hover(),true);
    }
    c.addEventListener('mouseenter',react);
    c.addEventListener('focus',react);
    c.addEventListener('click',function(){openCert(c)});
  });

  /*  5. ZOOM IN (certificate grows from its card)  */
  function flip(from,to){return [
    {transformOrigin:'top left',transform:'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+(from.width/to.width)+','+(from.height/to.height)+')'},
    {transformOrigin:'top left',transform:'none'}];}
  function openCert(card){
    var img=card.querySelector('img'), from=img.getBoundingClientRect();
    current=card;
    zimg.src=img.currentSrc||img.src; zimg.alt=card.dataset.title+' certificate';
    modal.classList.add('open'); glados.classList.add('big');
    document.body.style.overflow='hidden';
    img.style.visibility='hidden';
    say(intro()+' '+card.dataset.title+'. '+card.dataset.desc);
    closeBtn.focus({preventScroll:true});
    (zimg.decode?zimg.decode():Promise.resolve()).catch(function(){}).then(function(){
      var to=zimg.getBoundingClientRect();
      if(reduce||!zimg.animate||!to.width)return;
      zimg.animate(flip(from,to),{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});
    });
  }

  /*  6. ZOOM OUT (shrinks back into its card)  */
  function closeCert(){
    if(!current)return;
    var card=current, img=card.querySelector('img');
    var from=zimg.getBoundingClientRect(), to=img.getBoundingClientRect();
    current=null;
    modal.classList.remove('open'); glados.classList.remove('big');
    document.body.style.overflow='';
    say(outro(),true);
    function done(){img.style.visibility='';card.focus({preventScroll:true});}
    if(reduce||!zimg.animate||!from.width){done();return;}
    var a=zimg.animate(flip(to,from).reverse(),{duration:380,easing:'ease-in',fill:'forwards'});
    a.onfinish=function(){done();a.cancel();};
  }
  closeBtn.addEventListener('click',closeCert);
  modal.addEventListener('click',function(e){if(e.target===modal||e.target.classList.contains('zoom'))closeCert()});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')closeCert();
    if(e.key==='Tab'&&current){e.preventDefault();closeBtn.focus();}
  });

  /*  7. START: greeting + occasional idle line  */
  setTimeout(function(){say(greet())},700);
  if(!reduce){
    setInterval(function(){
      if(current||document.hidden||Date.now()-lastSpoke<12000)return;
      say(idle(),true);
    },4000);
  }
})();