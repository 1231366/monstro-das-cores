/* A Viagem do Monstro das Cores: jogo digital (solo, mesma sala, online por código). */
(function(){
'use strict';
var PAGE='https://claude.ai/artifact/BgpvWZCw8HxvwpQX1Zrt3W';
var NS='http://www.w3.org/2000/svg';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var KEYS=['y','b','r','k','g'];
var EM={y:{n:'Alegria',f:'a alegria',c:'amarelo'},b:{n:'Tristeza',f:'a tristeza',c:'azul'},r:{n:'Raiva',f:'a raiva',c:'vermelho'},k:{n:'Medo',f:'o medo',c:'preto'},g:{n:'Calma',f:'a calma',c:'verde'}};
var COL={y:'#f7c41c',b:'#2f7fe0',r:'#e53a2f',k:'#3a3a48',g:'#5fb236'};
var TXT={y:'#24264d',b:'#ffffff',r:'#ffffff',k:'#ffffff',g:'#24264d'};
var TEAMN=['Amarela','Azul','Vermelha','Preta','Verde'];
var AREAS=[
 {k:'plastica',n:'Expressão Plástica',c:'r'},
 {k:'musical',n:'Expressão Musical',c:'b'},
 {k:'dramatica',n:'Expressão Dramática',c:'y'},
 {k:'motora',n:'Expressão Motora',c:'g'}
];
/* ---------- Tabuleiro: casas lidas da imagem do tabuleiro ---------- */
var N={},ADJ={};
function add(id,x,y,type,emo){N[id]={id:id,x:x,y:y,type:type,emo:emo};ADJ[id]=[]}
function link(a,b){ADJ[a].push(b);ADJ[b].push(a)}
add('c',1200,1200,'c',null);
var RING='ybr*kgbrk*gyrkg*ybkgy*brgyb*rk';
var SP=['krb','gkr','ygk','byg','rby'];
(function(){
  var i,s,k,a;
  for(i=0;i<30;i++){a=(-90+12*i)*Math.PI/180;var ch=RING.charAt(i);
    add('r'+i,1200+960*Math.cos(a),1200+960*Math.sin(a),i%6===0?'p':(ch==='*'?'s':'n'),ch==='*'?null:ch)}
  for(i=0;i<30;i++)link('r'+i,'r'+((i+1)%30));
  for(s=0;s<5;s++){a=(-90+72*s)*Math.PI/180;
    [270,470,670].forEach(function(R,k2){add('s'+s+k2,1200+R*Math.cos(a),1200+R*Math.sin(a),'n',SP[s].charAt(k2))});
    link('c','s'+s+'0');link('s'+s+'0','s'+s+'1');link('s'+s+'1','s'+s+'2');link('s'+s+'2','r'+(6*s))}
})();
function reach(from,n){
  var cur=[[from,null]],k,o={};
  for(k=0;k<n;k++){var nx=[];cur.forEach(function(p){ADJ[p[0]].forEach(function(nb){if(nb!==p[1])nx.push([nb,p[0]])})});cur=nx}
  cur.forEach(function(p){if(p[0]!=='c')o[p[0]]=1});
  return Object.keys(o);
}
function tileLabel(id){var n=N[id];
  if(n.type==='s')return 'Casa especial';
  return (n.type==='p'?'Casa-pote ':'Casa ')+EM[n.emo].c;}

/* ---------- Estado ---------- */
var S=null,ME={mode:null,id:rid(),host:false,code:'',name:'',max:2},G=null,timers=[],lastRolls=-1,dlgKey='',winShown=false;
function rid(){return Math.random().toString(36).slice(2,10)}
function rnd(n){return Math.floor(Math.random()*n)}
function newTeam(ci,name,pid){return {name:name,ci:ci,pos:'c',balls:{y:0,b:0,r:0,k:0,g:0},pid:pid||null}}
function newGame(teams,code,max){return {v:1,code:code||'',max:max||teams.length,phase:'play',teams:teams,turn:0,step:'roll',dice:0,rolls:0,opts:[],emo:null,area:null,tile:null,bonus:false,landed:0,last:null,winner:-1}}
/* baralhos: cada emoção tem o seu, e só repete uma carta quando já saíram todas */
function draw(kind,e){
  var k=kind+e,L=CARDS[kind][e],d;S.dk=S.dk||{};d=S.dk[k];
  if(!d||!d.length){d=L.map(function(_,i){return i});for(var i=d.length-1;i>0;i--){var j=rnd(i+1),t=d[i];d[i]=d[j];d[j]=t}
    if(S.lastc&&S.lastc.k===k&&d[d.length-1]===S.lastc.i&&d.length>1){var q=d.pop();d.unshift(q)}}
  var c=d.pop();S.dk[k]=d;S.card=c;S.ck=kind;S.lastc={k:k,i:c};S.area=L[c][0]}
function allBalls(t){return KEYS.every(function(k){return t.balls[k]})}

function applyAct(a,who){
  if(!S||S.phase==='end')return false;
  var T=S.teams[S.turn];
  if(a.t==='start'){
    if(ME.mode!=='online'||!ME.host||S.phase!=='lobby'||S.teams.length<2)return false;
    S.phase='play';S.turn=0;S.step='roll';S.rolls=0;return true}
  if(S.phase!=='play')return false;
  if(ME.mode==='online'&&who!==T.pid)return false;
  if(a.t==='roll'&&S.step==='roll'){
    S.dice=1+rnd(6);S.rolls++;S.opts=reach(T.pos,S.dice);S.step='move';S.last=null;return true}
  if(a.t==='move'&&S.step==='move'&&S.opts.indexOf(a.to)>-1){
    T.pos=a.to;S.landed++;S.opts=[];var nd=N[a.to];S.tile=nd.type;
    if(nd.type==='s'){S.step='pick';S.emo=null}
    else{S.emo=nd.emo;draw(nd.type==='p'?'p':'n',nd.emo);S.step='card'}
    return true}
  if(a.t==='pick'&&S.step==='pick'&&EM[a.e]){S.emo=a.e;draw('n',a.e);S.step='card';return true}
  if(a.t==='fail'&&S.step==='card'&&S.tile==='p'&&!T.balls[S.emo]){
    S.last={t:'fail',team:S.turn,e:S.emo};nextTurn();return true}
  if(a.t==='done'&&S.step==='card'){
    var gain=false;
    if(S.tile==='p'&&!T.balls[S.emo]){T.balls[S.emo]=KEYS.filter(function(k){return T.balls[k]}).length+1;gain=true;
      if(allBalls(T)){S.winner=S.turn;S.phase='end';S.step='end';S.last={t:'win',team:S.turn,e:S.emo};return true}}
    if(gain){S.last={t:'gain',team:S.turn,e:S.emo};nextTurn()}
    else if(!S.bonus){S.bonus=true;S.last={t:'bonus',team:S.turn};S.step='roll';S.dice=0}
    else{S.last={t:'next',team:S.turn};nextTurn()}
    return true}
  return false;
}
function nextTurn(){S.turn=(S.turn+1)%S.teams.length;S.bonus=false;S.step='roll';S.dice=0;S.opts=[];S.emo=null}

/* ---------- DOM helpers ---------- */
function h(tag,attrs,kids){
  var e=document.createElement(tag),k;
  if(attrs)for(k in attrs){if(k==='class')e.className=attrs[k];else if(k==='text')e.textContent=attrs[k];else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),attrs[k]);else if(attrs[k]!==false&&attrs[k]!==null&&attrs[k]!==undefined)e.setAttribute(k,attrs[k]===true?'':attrs[k])}
  (kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==='string'?document.createTextNode(c):c)});
  return e}
function sv(tag,attrs){var e=document.createElementNS(NS,tag),k;for(k in attrs)e.setAttribute(k,attrs[k]);return e}
function img(src,w,hh){return h('img',{src:src,alt:'',width:w,height:hh})}
function sticker(ci,w,hh){return img('img/m_'+KEYS[ci]+'.webp',w||40,hh||44)}
/* peão da equipa: forma própria (não é um monstro), na cor da equipa e com o número */
function pawnG(ci,num){
  var c=COL[KEYS[ci]],tc=TXT[KEYS[ci]],g=sv('g',{'class':'pw'});
  g.appendChild(sv('ellipse',{cx:0,cy:-10,rx:62,ry:20,fill:c,stroke:'#24264d','stroke-width':9}));
  g.appendChild(sv('path',{d:'M-48,-14C-48,-62 -22,-78 -18,-112L18,-112C22,-78 48,-62 48,-14Z',fill:c,stroke:'#24264d','stroke-width':9,'stroke-linejoin':'round'}));
  g.appendChild(sv('ellipse',{cx:0,cy:-112,rx:30,ry:10,fill:c,stroke:'#24264d','stroke-width':9}));
  g.appendChild(sv('circle',{cx:0,cy:-152,r:38,fill:c,stroke:'#24264d','stroke-width':9}));
  g.appendChild(sv('path',{d:'M-22,-170C-14,-182 0,-184 10,-180',fill:'none',stroke:'#fff','stroke-width':8,'stroke-linecap':'round',opacity:.7}));
  var t=sv('text',{x:0,y:-136,'text-anchor':'middle','font-size':'54','font-weight':'700','font-family':'Fredoka,Nunito,sans-serif',fill:tc});t.textContent=String(num);g.appendChild(t);
  return g}
function pawnIcon(ci,w,hh,num){
  var e=sv('svg',{viewBox:'-72 -200 144 214',width:w,height:hh,'class':'pwi','aria-hidden':'true',focusable:'false'});
  e.appendChild(pawnG(ci,num));return e}
var X='<svg viewBox="0 0 24 24" fill="none" stroke="#24264d" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';

/* ---------- Pote ---------- */
var SLOT=[[17,54],[30,54],[43,54],[23.5,41],[36.5,41]];
function jarSvg(t,cls,fresh){
  var s=sv('svg',{viewBox:'0 0 60 70','class':'jar '+(cls||''),'aria-hidden':'true'});
  s.appendChild(sv('path',{d:'M12 12h36c3 0 5 2 5 5v42c0 5-4 9-9 9H16c-5 0-9-4-9-9V17c0-3 2-5 5-5z',fill:'#f5f6fc',stroke:'#24264d','stroke-width':3}));
  s.appendChild(sv('rect',{x:16,y:3,width:28,height:8,rx:3,fill:'#fff',stroke:'#24264d','stroke-width':3}));
  KEYS.forEach(function(k){var o=t.balls[k];if(!o)return;var p=SLOT[o-1]||SLOT[4];
    var g=sv('g',{'class':'bl'+(fresh===k?' new':''),transform:'translate('+p[0]+' '+p[1]+')'});
    g.appendChild(sv('circle',{r:6.4,fill:COL[k],stroke:'#24264d','stroke-width':2.2}));
    g.appendChild(sv('path',{d:'M-3.6 -1.6a4 4 0 0 1 3.6 -2.8',stroke:'#fff',opacity:.65,'stroke-width':1.6,'stroke-linecap':'round',fill:'none'}));
    s.appendChild(g)});
  return s}

/* ---------- Ecrã base ---------- */
var root,body,titleEl,chipEl,dlgCard,dlgPick,dlgWin,dlgLeave,lastFocus=null,onStatus=null;
function build(){
  if(root)return;
  root=h('div',{class:'gm',role:'dialog','aria-modal':'true','aria-label':'Jogo A Viagem do Monstro das Cores'});
  titleEl=h('h2',{text:'A Viagem do Monstro das Cores'});
  chipEl=h('span',{class:'gm-chip',hidden:true});
  var x=h('button',{class:'gm-x',type:'button','aria-label':'Sair do jogo',onclick:askLeave});x.innerHTML=X;
  body=h('div',{class:'gm-body'});
  root.appendChild(h('div',{class:'gm-top'},[titleEl,chipEl,x]));
  root.appendChild(body);
  document.body.appendChild(root);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&root.classList.contains('open')){e.preventDefault();askLeave()}});
}
function openGm(){build();lastFocus=document.activeElement;root.classList.add('open');document.documentElement.classList.add('gm-lock')}
function closeGm(){
  clearTimers();
  if(G){try{G.leave&&G.leave()}catch(e){}G=null}
  S=null;ME.mode=null;ME.host=false;ME.code='';dlgKey='';winShown=false;lastRolls=-1;
  if(root){root.classList.remove('open');body.innerHTML=''}
  document.documentElement.classList.remove('gm-lock');
  if(location.hash.indexOf('#sala-')===0)try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}
}
function clearTimers(){timers.forEach(function(t){clearInterval(t);clearTimeout(t)});timers=[]}
function setScreen(cls){body.innerHTML='';body.className='gm-body '+(cls||'');delete body.dataset.sc}
function setChip(t){chipEl.hidden=!t;chipEl.textContent=t||''}
function focusFirst(el){var f=el.querySelector('button,input');if(f)try{f.focus()}catch(e){}}

function askLeave(){
  if(!S||S.phase==='end'||(!S&&!ME.mode)){closeGm();return}
  if(!dlgLeave){dlgLeave=h('div',{class:'dlg'});root.appendChild(dlgLeave)}
  dlgLeave.innerHTML='';
  var bx=h('div',{class:'bx',tabindex:'-1',role:'alertdialog','aria-label':'Sair do jogo'},[
    h('h3',{text:'Sair do jogo?'}),
    h('p',{text:ME.mode==='online'&&ME.host?'Se saíres, a sala fecha para todos.':'Perdes o progresso desta partida.'}),
    h('div',{class:'row'},[h('button',{class:'gbtn alt',type:'button',text:'Continuar a jogar',onclick:function(){dlgLeave.classList.remove('open')}}),
      h('button',{class:'gbtn',type:'button',text:'Sair',onclick:function(){dlgLeave.classList.remove('open');closeGm()}})])]);
  dlgLeave.appendChild(bx);dlgLeave.classList.add('open');focusFirst(bx);
}

/* ---------- Menus ---------- */
function start(mode){
  build();ME.mode=mode;ME.host=false;S=null;openGm();
  if(mode==='solo')screenSetup(1);
  else if(mode==='local')screenSetup(2);
  else screenOnline();
}
function seg(vals,cur,onpick,label){
  var wrap=h('div',{class:'seg',role:'group','aria-label':label,style:'--n:'+vals.length});
  vals.forEach(function(v){var b=h('button',{type:'button','aria-pressed':String(v===cur),text:String(v)});
    b.addEventListener('click',function(){onpick(v)});wrap.appendChild(b)});
  return wrap}

function screenSetup(n){
  setScreen('center');setChip('');titleEl.textContent=ME.mode==='solo'?'Jogar sozinho':'Jogar na mesma sala';
  var sc=h('div',{class:'sc'});
  sc.appendChild(h('h3',{text:ME.mode==='solo'?'Uma equipa, cinco emoções':'Quantas equipas vão jogar?'}));
  if(ME.mode==='solo')sc.appendChild(h('p',{text:'Percorre o tabuleiro e enche o pote com uma bola de cada cor. Vê em quantas casas consegues.'}));
  else{
    var f=h('div',{class:'fld'},[h('span',{class:'lbl',text:'Número de equipas'})]);
    f.appendChild(seg([2,3,4,5],n,function(v){screenSetup(v)},'Número de equipas'));sc.appendChild(f);
    sc.appendChild(h('p',{text:'Jogam à vez no mesmo ecrã. Cada equipa tem o seu peão e o seu pote.'}));
  }
  var names=h('div',{style:'display:grid;gap:10px'});
  for(var i=0;i<n;i++){
    var id='tn'+i;
    names.appendChild(h('div',{class:'teamrow'},[pawnIcon(i,40,60,i+1),h('div',{class:'fld'},[
      h('label',{for:id,class:'lbl',text:ME.mode==='solo'?'Nome da equipa':'Equipa '+TEAMN[i].toLowerCase()}),
      h('input',{id:id,type:'text',maxlength:'16',autocomplete:'off',value:ME.mode==='solo'?'A minha equipa':'Equipa '+TEAMN[i]})])]));
  }
  sc.appendChild(names);
  sc.appendChild(h('button',{class:'gbtn gold',type:'button',text:'Começar a jogar',onclick:function(){
    var ts=[];for(var i=0;i<n;i++){var v=(document.getElementById('tn'+i).value||'').trim().slice(0,16)||'Equipa '+TEAMN[i];ts.push(newTeam(i,v))}
    S=newGame(ts,'',n);screenGame()}}));
  body.appendChild(sc);focusFirst(sc);
}

var IN_CLAUDE=(typeof claude!=='undefined'&&!!claude&&!!claude.use);
function roomAvail(){return IN_CLAUDE?claude.use('room'):Promise.resolve({ws:true})}
function wsConnect(code,host){
  return new Promise(function(res,rej){
    var proto=location.protocol==='https:'?'wss:':'ws:',base=window.MVC_WS||(proto+'//'+location.host+'/ws'),ws,hs={},done=false;
    try{ws=new WebSocket(base+'?room='+code+'&role='+(host?'host':'guest'))}catch(e){rej(new Error('ws'));return}
    var g={on:function(t,fn){(hs[t]=hs[t]||[]).push(fn)},emit:function(t,d){if(ws.readyState===1)ws.send(JSON.stringify({t:t,d:d}))},leave:function(){try{ws.close()}catch(e){}}};
    var to=setTimeout(function(){if(!done){done=true;try{ws.close()}catch(e){}rej(new Error('timeout'))}},8000);
    ws.onmessage=function(m){var d;try{d=JSON.parse(m.data)}catch(e){return}
      if(!done){done=true;clearTimeout(to);if(d.t==='ok')res(g);else rej(new Error(String(d.d||'err')));return}
      (hs[d.t]||[]).forEach(function(fn){fn(d.d)})};
    ws.onerror=function(){if(!done){done=true;clearTimeout(to);rej(new Error('ws'))}};
    ws.onclose=function(){if(!done){done=true;clearTimeout(to);rej(new Error('ws'))}else(hs.close||[]).forEach(function(fn){fn()})};
  })}
function screenOnline(){
  setScreen('center');setChip('');titleEl.textContent='Jogar online';
  var sc=h('div',{class:'sc'});
  sc.appendChild(h('h3',{text:'Joga com convite'}));
  sc.appendChild(h('p',{text:'Uma pessoa cria a sala e partilha o código. Cada pessoa joga no seu dispositivo, com a sua equipa.'}));
  var st=h('div',{class:'info',text:'A verificar a ligação…'});sc.appendChild(st);
  var row=h('div',{class:'row'},[
    h('button',{class:'gbtn gold',type:'button',text:'Criar sala',disabled:true,onclick:screenCreate}),
    h('button',{class:'gbtn alt',type:'button',text:'Entrar com código',disabled:true,onclick:function(){screenJoin('')}})]);
  sc.appendChild(row);body.appendChild(sc);
  roomAvail().then(function(r){
    if(!root.classList.contains('open'))return;
    if(r){G0=r;st.textContent=IN_CLAUDE?'Ligação disponível. Quem entra precisa de abrir esta página no Claude, com sessão iniciada.':'Ligação disponível. Quem entra só precisa do link ou do código da sala.';[].forEach.call(row.children,function(b){b.disabled=false});
      if(pendingJoin){var c=pendingJoin;pendingJoin='';screenJoin(c)}}
    else{st.className='err';st.textContent='O modo online não está disponível neste momento. Abre a página no Claude com sessão iniciada, ou joga na mesma sala.'}
  });
}
var G0=null,pendingJoin='';
function screenCreate(){
  setScreen('center');
  var max=3,sc=h('div',{class:'sc'}),name='';
  sc.appendChild(h('h3',{text:'Criar sala'}));
  var f=h('div',{class:'fld'},[h('span',{class:'lbl',text:'Quantas pessoas podem jogar?'})]);
  var holder=h('div');f.appendChild(holder);
  function drawSeg(){holder.innerHTML='';holder.appendChild(seg([2,3,4,5],max,function(v){max=v;drawSeg()},'Máximo de jogadores'))}drawSeg();
  sc.appendChild(f);
  sc.appendChild(h('div',{class:'fld'},[h('label',{for:'nm',class:'lbl',text:'O teu nome'}),h('input',{id:'nm',type:'text',maxlength:'16',autocomplete:'nickname',value:'Anfitrião'})]));
  sc.appendChild(h('div',{class:'row'},[
    h('button',{class:'gbtn alt',type:'button',text:'Voltar',onclick:screenOnline}),
    h('button',{class:'gbtn gold',type:'button',text:'Criar sala',onclick:function(){
      name=(document.getElementById('nm').value||'').trim().slice(0,16)||'Anfitrião';createRoom(max,name)}})]));
  body.appendChild(sc);focusFirst(sc);
}
function genCode(){var A='ABCDEFGHJKLMNPQRSTUVWXYZ',c='';for(var i=0;i<4;i++)c+=A.charAt(rnd(A.length));return c}
function connect(code,host){
  if(!IN_CLAUDE)return wsConnect(code,host);
  return Promise.resolve(G0||roomAvail()).then(function(r){
    if(!r)throw new Error('sem sala');
    var j=r.join?r.join('mvc-'+code):r;
    return Promise.resolve(j).then(function(g){return g||r})
  })}
function norm(d,key){if(d&&d[key]!==undefined)return d;if(d&&d.data&&d.data[key]!==undefined)return d.data;return null}
function createRoom(max,name,tries){
  var code=genCode();tries=tries||0;ME.mode='online';ME.host=true;ME.code=code;ME.name=name;ME.max=max;
  setScreen('center');body.appendChild(h('div',{class:'sc'},[h('div',{class:'spin','aria-hidden':'true'}),h('p',{text:'A criar a sala…',style:'text-align:center'})]));
  connect(code,true).then(function(g){
    G=g;
    S=newGame([newTeam(0,name,ME.id)],code,max);S.phase='lobby';S.step='lobby';
    G.on('hi',function(d){var p=norm(d,'name');if(!p||p.code!==code||!S||S.phase!=='lobby')return;
      if(S.teams.some(function(t){return t.pid===p.id})){bcast();return}
      if(S.teams.length>=S.max)return;
      var nm=String(p.name||'Jogador').slice(0,16);S.teams.push(newTeam(S.teams.length,nm,String(p.id).slice(0,12)));bcast();render()});
    G.on('act',function(d){var p=norm(d,'a');if(!p||p.code!==code)return;if(applyAct(p.a,String(p.id))){bcast();render()}});
    timers.push(setInterval(bcast,3500));
    G.on('close',function(){if(root.classList.contains('open')&&ME.host){clearTimers();screenError('Perdeste a ligação ao servidor. A sala fechou.')}});
    render();bcast();
  }).catch(function(e){if(e&&e.message==='exists'&&tries<5)return createRoom(max,name,tries+1);screenError(e&&e.message==='busy'?'O servidor está cheio. Tenta daqui a pouco.':'Não consegui criar a sala. Tenta outra vez.')});
}
function bcast(){if(G&&ME.host&&S){try{G.emit('st',{code:ME.code,hostId:ME.id,S:S})}catch(e){}}}
function screenError(msg){
  setScreen('center');
  body.appendChild(h('div',{class:'sc'},[h('h3',{text:'Ups'}),h('div',{class:'err',role:'alert',text:msg}),h('button',{class:'gbtn alt',type:'button',text:'Voltar',onclick:screenOnline})]));
}
function screenJoin(pre){
  setScreen('center');
  var sc=h('div',{class:'sc'});
  sc.appendChild(h('h3',{text:'Entrar numa sala'}));
  sc.appendChild(h('div',{class:'fld'},[h('label',{for:'cd',class:'lbl',text:'Código da sala (4 letras)'}),h('input',{id:'cd',class:'code',type:'text',maxlength:'4',autocomplete:'off',autocapitalize:'characters',value:pre||''})]));
  sc.appendChild(h('div',{class:'fld'},[h('label',{for:'nm',class:'lbl',text:'O teu nome'}),h('input',{id:'nm',type:'text',maxlength:'16',autocomplete:'nickname',value:''})]));
  sc.appendChild(h('div',{class:'row'},[
    h('button',{class:'gbtn alt',type:'button',text:'Voltar',onclick:screenOnline}),
    h('button',{class:'gbtn gold',type:'button',text:'Entrar',onclick:function(){
      var c=(document.getElementById('cd').value||'').toUpperCase().replace(/[^A-Z]/g,'');
      var n=(document.getElementById('nm').value||'').trim().slice(0,16);
      if(c.length!==4||!n){var er=sc.querySelector('.err');if(!er){er=h('div',{class:'err',role:'alert'});sc.insertBefore(er,sc.lastChild)}er.textContent=c.length!==4?'O código tem 4 letras.':'Escreve o teu nome.';return}
      joinRoom(c,n)}})]));
  body.appendChild(sc);focusFirst(sc);
}
function joinRoom(code,name){
  ME.mode='online';ME.host=false;ME.code=code;ME.name=name;S=null;
  setScreen('center');
  var msg=h('p',{text:'A ligar à sala '+code+'…',style:'text-align:center',role:'status'});
  body.appendChild(h('div',{class:'sc'},[h('div',{class:'spin','aria-hidden':'true'}),msg]));
  connect(code,false).then(function(g){
    G=g;var lastHost=Date.now();
    G.on('hostleft',function(){clearTimers();screenError('O anfitrião saiu e a sala fechou.')});
    G.on('close',function(){if(S&&S.phase!=='end'){clearTimers();screenError('Perdeste a ligação à sala.')}});
    G.on('st',function(d){var p=norm(d,'S');if(!p||p.code!==code||p.hostId===ME.id)return;
      lastHost=Date.now();S=p.S;
      if(!S.teams.some(function(t){return t.pid===ME.id})){screenError('A sala está cheia ou o jogo já começou.');clearTimers();return}
      render()});
    var tries=0;
    function hi(){tries++;try{G.emit('hi',{code:code,id:ME.id,name:name})}catch(e){}}
    hi();
    timers.push(setInterval(function(){if(!S){if(tries<8)hi();else{clearTimers();screenError('Não encontrei a sala '+code+'. Confirma o código, ou pede ao anfitrião para partilhar a página contigo com permissão para jogar.')}}},1800));
    timers.push(setInterval(function(){if(S&&Date.now()-lastHost>15000){clearTimers();screenError('Perdeste a ligação ao anfitrião.')}},3000));
  }).catch(function(e){var m=e&&e.message;screenError(m==='noroom'?'Não encontrei a sala '+code+'. Confirma o código com o anfitrião.':m==='full'?'A sala está cheia.':'Não consegui ligar. Tenta outra vez.')});
}

/* ---------- Sala de espera ---------- */
function renderLobby(){
  if(body.dataset.sc!=='lobby'){setScreen('center');body.dataset.sc='lobby';
    titleEl.textContent='Sala de espera';
    body.appendChild(h('div',{class:'sc',id:'lb'}));}
  setChip('SALA '+S.code);
  var lb=document.getElementById('lb');lb.innerHTML='';
  lb.appendChild(h('h3',{text:ME.host?'Chama os teus colegas':'À espera de começar'}));
  lb.appendChild(h('div',{class:'big',text:S.code,'aria-label':'Código da sala: '+S.code.split('').join(' ')}));
  if(ME.host){
    var base=IN_CLAUDE?PAGE:(location.origin+location.pathname),inv='Joga A Viagem do Monstro das Cores comigo! Abre '+base+'#sala-'+S.code+' e entra com o código '+S.code+'.';
    var out=h('div',{class:'info',hidden:true,role:'status'});
    lb.appendChild(h('button',{class:'gbtn alt',type:'button',text:'Copiar convite',onclick:function(){
      var ok=false;try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(inv).then(function(){out.hidden=false;out.textContent='Convite copiado.'},function(){out.hidden=false;out.textContent=inv});ok=true}}catch(e){}
      if(!ok){out.hidden=false;out.textContent=inv}}}));
    lb.appendChild(out);
  }
  var ul=h('ul',{class:'slots','aria-label':'Jogadores'});
  for(var i=0;i<S.max;i++){var t=S.teams[i];
    if(t){var li=h('li',{style:'background:'+COL[KEYS[t.ci]]+'22;border-color:'+COL[KEYS[t.ci]]},[pawnIcon(t.ci,30,45,i+1),h('span',{text:t.name})]);
      if(t.pid===ME.id)li.appendChild(h('span',{class:'tag',text:'Tu'}));ul.appendChild(li)}
    else ul.appendChild(h('li',{class:'empty'},[h('span',{text:'À espera de jogador…'})]));}
  lb.appendChild(ul);
  if(ME.host){
    lb.appendChild(h('button',{class:'gbtn gold',type:'button',text:S.teams.length<2?'Precisas de 2 jogadores':'Começar o jogo ('+S.teams.length+')',disabled:S.teams.length<2,onclick:function(){send({t:'start'})}}));
  }else lb.appendChild(h('p',{text:'O anfitrião vai começar o jogo quando todos tiverem entrado.',role:'status'}));
}

/* ---------- Jogo ---------- */
var UI={};
function screenGame(){
  setScreen('game');body.dataset.sc='game';titleEl.textContent='A Viagem do Monstro das Cores';
  setChip(S.code?'SALA '+S.code:'');
  var gx=h('div',{class:'gx'});
  var bd=h('div',{class:'bd'});
  var im=img('img/tabuleiro.webp',1300,1300);im.alt='Tabuleiro do jogo';bd.appendChild(im);
  var svg=sv('svg',{'class':'bs',viewBox:'0 0 2400 2400','aria-label':'Casas do tabuleiro'});
  UI.hl=sv('g',{});UI.tk=sv('g',{});svg.appendChild(UI.hl);svg.appendChild(UI.tk);bd.appendChild(svg);
  UI.tokens=S.teams.map(function(t,i){
    var g=sv('g',{'class':'tk'});
    var w=sv('g',{transform:'scale(1.25)'});w.appendChild(pawnG(t.ci,i+1));
    g.appendChild(w);UI.tk.appendChild(g);return g});
  var pn=h('div',{class:'pn'});
  UI.turn=h('div',{class:'turn'});UI.say=h('p',{class:'say',role:'status','aria-live':'polite'});
  UI.die=h('button',{class:'die2',type:'button','aria-label':'Dado'});for(var i=0;i<9;i++)UI.die.appendChild(h('i'));
  UI.die.addEventListener('click',function(){if(S.step==='roll'&&canAct())send({t:'roll'})});
  UI.btn=h('button',{class:'gbtn gold',type:'button'});
  UI.btn.addEventListener('click',function(){if(S.step==='roll'&&canAct())send({t:'roll'})});
  UI.act=h('div',{class:'act'},[UI.die,UI.btn]);
  UI.pots=h('ul',{class:'pots','aria-label':'Potes das equipas'});
  UI.leg=h('div',{class:'leg','aria-hidden':'true'},KEYS.map(function(k){return h('span',null,[h('i',{style:'background:'+COL[k]}),EM[k].n])}));
  pn.appendChild(UI.turn);pn.appendChild(UI.say);pn.appendChild(UI.pots);pn.appendChild(UI.leg);pn.appendChild(UI.act);
  gx.appendChild(bd);gx.appendChild(pn);body.appendChild(gx);
  dlgCard=h('div',{class:'dlg'});dlgPick=h('div',{class:'dlg'});dlgWin=h('div',{class:'dlg'});
  root.appendChild(dlgCard);root.appendChild(dlgPick);root.appendChild(dlgWin);
  lastRolls=-1;dlgKey='';winShown=false;seen={};
  render();
}
function canAct(){if(!S||S.phase!=='play')return false;if(ME.mode!=='online')return true;return S.teams[S.turn].pid===ME.id}
function send(a){
  if(ME.mode==='online'&&!ME.host){try{G.emit('act',{code:ME.code,id:ME.id,a:a})}catch(e){}return}
  if(applyAct(a,ME.id)){if(ME.mode==='online')bcast();render()}
}
var FACES={0:[],1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function showDie(n){[].forEach.call(UI.die.children,function(d,k){d.className=FACES[n].indexOf(k)>-1?'on':''})}
var seen={},FR=null;
function freshFor(i){return FR&&FR.team===i?FR.e:null}
function nm(i){return S.teams[i].name}

function render(){
  if(!S||!root||!root.classList.contains('open'))return;
  if(S.phase==='lobby'){renderLobby();return}
  if(body.dataset.sc!=='game'){
    if(ME.mode==='online'&&!ME.host&&S.phase!=='lobby'){screenGame();return}
    if(body.dataset.sc==='lobby'){screenGame();return}
  }
  if(!UI.turn||!document.body.contains(UI.turn))return;
  var T=S.teams[S.turn],c=COL[KEYS[T.ci]];
  FR=null;var ls=S.last;if(ls&&(ls.t==='gain'||ls.t==='win')){var sk=S.landed+'-'+ls.team;if(!seen[sk]){FR={team:ls.team,e:ls.e};seen[sk]=1}}
  /* vez */
  UI.turn.style.setProperty('--c',c);UI.turn.style.setProperty('--tc',TXT[KEYS[T.ci]]);
  UI.turn.innerHTML='';UI.turn.appendChild(pawnIcon(T.ci,34,50,S.turn+1));
  var tt=h('div',{style:'min-width:0;flex:1'});tt.appendChild(h('small',{text:ME.mode==='online'?(T.pid===ME.id?'É a tua vez':'Vez de'):'Vez de'}));tt.appendChild(h('b',{text:T.name}));UI.turn.appendChild(tt);
  UI.turn.appendChild(jarSvg(T,'xl',freshFor(S.turn)));UI.turn.appendChild(h('span',{class:'cnt',text:KEYS.filter(function(k){return T.balls[k]}).length+'/5','aria-label':KEYS.filter(function(k){return T.balls[k]}).length+' de 5 bolas'}));
  /* mensagem */
  var m='',me=canAct();
  if(S.phase==='end'){m=nm(S.winner)+' encheu o pote!'}
  else if(S.step==='roll'){
    var lc=S.last;
    var pre=lc&&lc.t==='bonus'?'Casa normal: lança o dado outra vez. ':lc&&lc.t==='gain'?nm(lc.team)+' ganhou a bola '+EM[lc.e].c+'. ':lc&&lc.t==='fail'?nm(lc.team)+' não ganhou a bola '+EM[lc.e].c+' desta vez. ':'';
    m=pre+(me?(ME.mode==='online'?'Lança o dado.':T.name+', lança o dado.'):'A aguardar que '+T.name+' lance o dado.')}
  else if(S.step==='move')m='Saiu '+S.dice+'. '+(me?'Toca numa das casas a brilhar no tabuleiro.':'A aguardar que '+T.name+' escolha a casa.');
  else if(S.step==='pick')m='Casa especial! '+(me?'Escolhe a emoção que queres jogar.':T.name+' está a escolher a emoção.');
  else if(S.step==='card')m=me?'Leiam a carta e façam o desafio.':T.name+' está a fazer o desafio.';
  UI.say.textContent=m;
  /* dado + botão */
  var rollable=S.step==='roll'&&me;
  UI.die.disabled=!rollable;UI.die.setAttribute('aria-label',rollable?'Lançar o dado':'Dado: '+(S.dice||'por lançar'));
  showDie(S.dice);
  if(S.rolls!==lastRolls){if(S.dice&&!reduce){UI.die.classList.remove('roll');void UI.die.offsetWidth;UI.die.classList.add('roll')}lastRolls=S.rolls}
  UI.btn.textContent=rollable?'Lançar o dado':S.step==='move'?(me?'Escolhe uma casa':'A aguardar…'):me?'À espera…':'A aguardar '+T.name;
  UI.btn.disabled=!rollable;
  /* potes */
  UI.pots.innerHTML='';
  S.teams.forEach(function(t,i){
    var li=h('li',{class:i===S.turn?'on':''});
    li.appendChild(pawnIcon(t.ci,22,32,i+1));
    li.appendChild(h('span',{class:'nm',text:t.name+(ME.mode==='online'&&t.pid===ME.id?' (tu)':'')}));
    li.setAttribute('aria-label',t.name+': '+(KEYS.filter(function(k){return t.balls[k]}).map(function(k){return EM[k].n}).join(', ')||'pote vazio'));
    li.appendChild(jarSvg(t,'mini',freshFor(i)));
    li.appendChild(h('span',{class:'cnt',text:KEYS.filter(function(k){return t.balls[k]}).length+'/5'}));
    UI.pots.appendChild(li)});
  /* casas a brilhar */
  UI.hl.innerHTML='';
  if(S.step==='move'&&me){
    S.opts.forEach(function(id){var n=N[id];
      UI.hl.appendChild(sv('circle',{'class':'ring',cx:n.x,cy:n.y,r:n.type==='p'?150:120}));
      var hit=sv('circle',{'class':'hit',cx:n.x,cy:n.y,r:190,tabindex:'0',role:'button','aria-label':tileLabel(id)});
      hit.addEventListener('click',function(){send({t:'move',to:id})});
      hit.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();send({t:'move',to:id})}});
      UI.hl.appendChild(hit)});
    var first=UI.hl.querySelector('.hit');if(first&&!UI.focusedMove){try{first.focus({preventScroll:true})}catch(e){}UI.focusedMove=true}
  }else UI.focusedMove=false;
  if(S.step==='move'&&!me)S.opts.forEach(function(id){var n=N[id];UI.hl.appendChild(sv('circle',{'class':'ring',cx:n.x,cy:n.y,r:n.type==='p'?150:120,opacity:.55}))});
  /* peões */
  var by={};S.teams.forEach(function(t,i){(by[t.pos]=by[t.pos]||[]).push(i)});
  S.teams.forEach(function(t,i){
    var grp=by[t.pos],k=grp.indexOf(i),n=grp.length,n0=N[t.pos],ox=0,oy=0;
    if(n>1){var a=2*Math.PI*k/n-Math.PI/2;ox=Math.cos(a)*62;oy=Math.sin(a)*40}
    UI.tokens[i].style.transform='translate('+(n0.x+ox)+'px,'+(n0.y+oy)+'px)';
    UI.tokens[i].setAttribute('class','tk'+(i===S.turn&&S.phase==='play'?' me':''));
  });
  /* diálogos */
  var key=S.phase+'|'+S.step+'|'+S.turn+'|'+S.landed+'|'+S.emo;
  if(key!==dlgKey){dlgKey=key;
    dlgCard.classList.remove('open');dlgPick.classList.remove('open');
    if(S.phase==='play'&&S.step==='card')openCard(me);
    else if(S.phase==='play'&&S.step==='pick')openPick(me);
  }
  if(S.phase==='end'&&!winShown){winShown=true;dlgCard.classList.remove('open');dlgPick.classList.remove('open');openWin()}
}
function openCard(me){
  var T=S.teams[S.turn];
  if(!me){
    /* as outras equipas não veem a carta nem a expressão: só sabem que a equipa está a jogar */
    dlgCard.innerHTML='';
    var wx=h('div',{class:'bx',tabindex:'-1',role:'dialog','aria-label':'A equipa está a fazer o desafio'},[
      h('div',{class:'spin','aria-hidden':'true'}),
      h('h3',{text:T.name}),
      h('p',{class:'q',text:'está a fazer o desafio…'})]);
    dlgCard.appendChild(wx);dlgCard.classList.add('open');try{wx.focus()}catch(x){}
    return}
  var ar=AREAS.filter(function(a){return a.k===S.area})[0],e=S.emo,cd=CARDS[S.ck||'n'][e][S.card]||CARDS.n[e][0],pot=S.ck==='p',can=pot&&!T.balls[e];
  dlgCard.innerHTML='';
  var cardImg=h('img',{class:'cardimg',src:'img/c_'+({y:'alegria',b:'tristeza',r:'raiva',k:'medo',g:'calma'})[e]+'.webp',alt:'Carta '+EM[e].n,width:760,height:482});
  var chip=h('span',{class:'ar',text:ar.n,style:'background:'+COL[ar.c]+';color:'+TXT[ar.c]});
  var btns=!me?h('p',{class:'q',text:'A aguardar que '+T.name+' cumpra o desafio…'}):
    can?h('div',{class:'row'},[
      h('button',{class:'gbtn gold',type:'button',text:'Ganhámos a bola',onclick:function(){send({t:'done'})}}),
      h('button',{class:'gbtn alt',type:'button',text:'Não conseguimos',onclick:function(){send({t:'fail'})}})]):
    h('button',{class:'gbtn gold',type:'button',text:'Cumprimos o desafio',onclick:function(){send({t:'done'})}});
  var bx=h('div',{class:'bx',tabindex:'-1',role:'dialog','aria-label':'Desafio de '+EM[e].n},[
    cardImg,chip,
    h('h3',{text:cd[1]}),
    h('p',{text:cd[2]}),
    pot?h('p',{class:'cnd',text:'Para ganhar a bola '+({y:'amarela',b:'azul',r:'vermelha',k:'preta',g:'verde'})[e]+': '+cd[3]}):null,
    btns]);
  dlgCard.appendChild(bx);dlgCard.classList.add('open');
  var b=bx.querySelector('button');try{(b||bx).focus()}catch(x){}
}
function openPick(me){
  var T=S.teams[S.turn];dlgPick.innerHTML='';
  var bx=h('div',{class:'bx',tabindex:'-1',role:'dialog','aria-label':'Casa especial'},[
    h('h3',{text:'Casa especial'}),
    h('p',{text:me?'Reúne todas as emoções. Escolhe a que queres jogar.':T.name+' está a escolher a emoção.'})]);
  if(me){var g=h('div',{class:'picks2'});
    KEYS.forEach(function(k){var b=h('button',{type:'button',style:'--c:'+COL[k]+';--tc:'+TXT[k],'aria-label':EM[k].n,onclick:function(){send({t:'pick',e:k})}},[img('img/m_'+k+'.webp',40,44),h('span',{text:EM[k].n})]);g.appendChild(b)});
    bx.appendChild(g)}
  dlgPick.appendChild(bx);dlgPick.classList.add('open');
  var b=bx.querySelector('button');try{(b||bx).focus()}catch(x){}
}
function openWin(){
  var W=S.teams[S.winner];dlgWin.innerHTML='';
  var solo=ME.mode==='solo';
  var bx=h('div',{class:'bx win2',tabindex:'-1',role:'dialog','aria-label':'Fim do jogo'},[
    sticker(W.ci,110,120),
    jarSvg(W,'xl fin'),
    h('h3',{text:solo?'Arrumaste todas as emoções!':W.name+' ajudou o Monstro!'}),
    h('p',{text:solo?'Conseguiste em '+S.landed+' casas.':'Foi a primeira equipa a arrumar as cinco emoções no pote.'}),
    h('div',{class:'row',style:'width:100%'},[
      ME.mode==='online'?null:h('button',{class:'gbtn gold',type:'button',text:'Jogar outra vez',onclick:function(){
        var ts=S.teams.map(function(t){return newTeam(t.ci,t.name)});S=newGame(ts,'',ts.length);UI={};screenGame()}}),
      h('button',{class:'gbtn alt',type:'button',text:'Sair',onclick:closeGm})])]);
  dlgWin.appendChild(bx);dlgWin.classList.add('open');
  try{bx.querySelector('button').focus()}catch(x){}
  if(!reduce){var cf=h('div',{class:'gconf','aria-hidden':'true'});
    for(var i=0;i<70;i++){var p=h('i');p.style.left=Math.random()*100+'%';p.style.background=COL[KEYS[i%5]];p.style.animationDelay=Math.random()*.8+'s';p.style.animationDuration=1.8+Math.random()*1.4+'s';cf.appendChild(p)}
    root.appendChild(cf);setTimeout(function(){cf.remove()},4200)}
}

/* ---------- Ligações com a página ---------- */
function hook(){
  if(!IN_CLAUDE){var mn=document.querySelector('.mnote');if(mn)mn.textContent='Para jogar online, cada pessoa abre esta página no seu dispositivo e entra com o código da sala.'}
  [].forEach.call(document.querySelectorAll('[data-mode]'),function(b){b.addEventListener('click',function(){start(b.dataset.mode)})});
  function hashJoin(){var m=/^#sala-([A-Za-z]{4})$/.exec(location.hash);if(m){pendingJoin=m[1].toUpperCase();start('online')}}
  addEventListener('hashchange',hashJoin);hashJoin();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();
