/* Shared tutor workspace chrome: injects base styles + the sidebar on every
   tutor page. Include AFTER guard.js:
     <script src="../nav.js" data-base="../" data-cur="calendar/"></script>
   data-base is the path back to /tutor/ from the current page ("" for the
   Command Centre index, "../" for a sub-page). data-cur marks the active item. */
(function(){
  'use strict';
  var sc=document.currentScript;
  var base=sc.getAttribute('data-base')||'';
  var cur=sc.getAttribute('data-cur')||'';
  var css=''+
  ':root{--navy-950:#060B18;--gold-300:#A9CFF2;--gold-400:#5FA8E0;--gold-500:#3D8FD1;--good:#5CBB7B;--warn:#c98500;--crit:#e66767;--ink:#EDF1F8;--ink-2:#AAB6CC;--ink-3:#8795AE;--line:rgba(77,157,224,.14);--serif:Georgia,serif;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}'+
  '*{margin:0;padding:0;box-sizing:border-box}body{background:radial-gradient(1100px 600px at 82% -12%,rgba(77,157,224,.13),transparent 60%),var(--navy-950);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55}'+
  '.shell{display:flex;min-height:100vh;max-width:1440px;margin:0 auto}'+
  'aside{width:224px;flex:none;border-right:1px solid var(--line);padding:22px 14px 30px;position:sticky;top:0;align-self:flex-start;max-height:100vh;overflow-y:auto}'+
  '.slogo{font-family:var(--serif);font-size:19px;color:var(--ink);text-decoration:none;display:block;padding:4px 10px 6px}.slogo b{color:#4FA6E0;font-weight:600}'+
  'aside .role{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);padding:0 10px 14px}'+
  'aside nav a{display:block;font-size:13px;color:var(--ink-2);text-decoration:none;padding:8px 10px;border-radius:8px;margin:1px 0}aside nav a:hover{color:var(--gold-300);background:rgba(77,157,224,.08)}aside nav a.on{color:var(--gold-300);background:rgba(77,157,224,.12)}'+
  'main{flex:1;padding:30px 30px 90px;min-width:0;max-width:1080px}'+
  '@media(max-width:960px){.shell{flex-direction:column}aside{width:100%;position:sticky;top:0;z-index:60;max-height:46vh;overflow-y:auto;background:#060B18;border-right:none;border-bottom:1px solid var(--line)}aside nav{display:flex;flex-wrap:wrap;gap:2px}main{padding:22px 18px 70px}}'+
  'a{color:inherit}h1{font-family:var(--serif);font-weight:500;font-size:28px}p.lede{color:var(--ink-2);font-weight:300;margin-top:6px;max-width:80ch}'+
  '.k{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gold-400)}'+
  '.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;margin-top:16px}.c3{grid-column:span 3}.c4{grid-column:span 4}.c6{grid-column:span 6}.c8{grid-column:span 8}.c12{grid-column:span 12}@media(max-width:960px){.grid>*{grid-column:span 6}}@media(max-width:600px){.grid>*{grid-column:span 12}}'+
  '.card{border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,rgba(16,27,51,.6),rgba(11,18,32,.9));padding:18px 20px}.card h3{font-family:var(--serif);font-weight:500;font-size:16px}.card .sub{font-size:12px;color:var(--ink-3);margin:4px 0 10px}'+
  '.stat .v{font-family:var(--serif);font-size:28px;color:var(--gold-300);line-height:1}.stat .k{font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-3);margin-top:6px}'+
  'label.f{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:12px 0 5px}'+
  'input,select,textarea{width:100%;background:rgba(6,11,24,.7);border:1px solid rgba(170,182,204,.22);border-radius:9px;color:var(--ink);font:400 14px var(--sans);padding:10px 12px;outline:none}input:focus,select:focus,textarea:focus{border-color:var(--gold-500)}select option{background:#101B33}'+
  '.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}@media(max-width:640px){.two,.three{grid-template-columns:1fr}}'+
  '.btn{appearance:none;border:1px solid var(--gold-500);background:rgba(77,157,224,.12);color:var(--gold-300);font:600 12px var(--sans);border-radius:9px;padding:9px 15px;cursor:pointer;text-decoration:none;display:inline-block}.btn.solid{border:none;background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff}.btn.sm{padding:6px 11px;font-size:11.5px}.btn.ghost{border-color:rgba(170,182,204,.3);background:transparent;color:var(--ink-2)}'+
  '.badge{font-size:10px;letter-spacing:.05em;border-radius:20px;padding:3px 9px;border:1px solid rgba(170,182,204,.25);color:var(--ink-2)}.badge.good{border-color:rgba(92,187,123,.45);color:var(--good)}.badge.warn{border-color:rgba(201,133,0,.45);color:#e0b566}.badge.info{border-color:rgba(77,157,224,.4);color:var(--gold-300)}'+
  '.row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(170,182,204,.08);font-size:13px}.row b{color:var(--ink)}'+
  '.empty{color:var(--ink-3);font-style:italic;padding:14px 0}.note{font-size:11.5px;color:var(--ink-3);margin-top:8px}'+
  '.bar{height:9px;border-radius:5px;background:rgba(170,182,204,.12);overflow:hidden}.bar i{display:block;height:100%}'+
  '#toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:#101B33;border:1px solid var(--gold-500);border-radius:10px;padding:10px 18px;font-size:13px;color:var(--gold-300);opacity:0;transition:opacity .2s;pointer-events:none;z-index:99}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var items=[
    ['','Command Centre'],['calendar/','Calendar'],['pipeline/','Student pipeline'],
    ['classroom/','Classroom'],['earnings/','Earnings'],['register/','Authority profile'],
    ['plans/','Top up ACUs'],['assistant/','AI Teaching Assistant'],['register/#marketplace','My marketplace listing']
  ];
  var nav=items.map(function(it){
    var href=base+it[0];if(it[0]===''){href=base||'./'}
    var on=(it[0]===cur)?' class="on"':'';
    return '<a href="'+href+'"'+on+'>'+it[1]+'</a>';
  }).join('');
  var aside=document.createElement('aside');
  aside.innerHTML='<a class="slogo" href="'+base+'../">⌂ <b class="wm">StudYear</b></a><div class="role">Private tutor</div><nav>'+nav+'<a href="#" id="__signout">Sign out</a></nav>';
  var shell=document.querySelector('.shell');
  if(shell)shell.insertBefore(aside,shell.firstChild);
  var so=document.getElementById('__signout');
  if(so)so.onclick=function(e){e.preventDefault();if(window.SY)window.SY.signOut()};
  if(!document.getElementById('toast')){var t=document.createElement('div');t.id='toast';document.body.appendChild(t)}
})();
