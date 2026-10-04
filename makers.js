/* StudYear Resource Makers (window.SYMakers) — the student "Create your own"
 * suite, made mountable so school teachers and private tutors get the SAME
 * makers, adapted to their role. One call, SYMakers.mount(el, opts), renders a
 * tabbed set of AI makers (flashcards, quiz, revision notes, mind map, topic
 * summariser, essay plan, labelled diagram, worksheet); each generates real
 * content with the live model, previews it, saves it to the account's library
 * and exports to Word/PDF. Adapts by opts.context:
 *   student → "for yourself" · teacher → "for your class" · tutor → "for your student"
 * Metering, branding and level/subject catalogues come from opts (as SYExam). */
(function () {
  'use strict';
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  var MAKERS = [
    { key:'flashcards', name:'Flashcards', icon:'🃏', topic:true,
      sys:function(a){return 'Write revision flashcards '+a.forWhom+'. Output ONLY lines "front :: back" — a precise question/term, then an accurate concise answer. No numbering, no preamble.';},
      user:function(v){return 'Make 10 flashcards on: '+v.topic+' ('+v.subj+', '+v.level+').';},
      render:function(txt){var rows=txt.split('\n').filter(function(l){return l.indexOf('::')>0;}).map(function(l){var p=l.split('::');return '<tr><td style="padding:6px 10px;border:1px solid #ddd"><b>'+esc(p[0].trim())+'</b></td><td style="padding:6px 10px;border:1px solid #ddd">'+esc((p[1]||'').trim())+'</td></tr>';}).join('');return '<table style="border-collapse:collapse;width:100%">'+rows+'</table>';} },
    { key:'quiz', name:'Quiz', icon:'❓', topic:true,
      sys:function(a){return 'Write a multiple-choice quiz '+a.forWhom+'. Output ONLY lines "question :: correct :: wrong :: wrong :: wrong" (correct answer FIRST). No numbering.';},
      user:function(v){return '8 multiple-choice questions on: '+v.topic+' ('+v.subj+', '+v.level+').';},
      render:function(txt){return txt.split('\n').filter(function(l){return (l.match(/::/g)||[]).length>=2;}).map(function(l,i){var p=l.split('::');return '<div style="margin:8px 0"><b>'+(i+1)+'. '+esc(p[0].trim())+'</b><br>'+p.slice(1).map(function(o,j){return '<span style="color:'+(j===0?'#0a7f34':'#444')+'">'+String.fromCharCode(65+j)+') '+esc(o.trim())+(j===0?' ✓':'')+'</span>';}).join(' &nbsp; ')+'</div>';}).join('');} },
    { key:'notes', name:'Revision notes', icon:'📝', topic:true,
      sys:function(a){return 'Write clear, accurate revision notes '+a.forWhom+'. Use markdown: a short intro, key points as bullets, key terms defined, and 3 exam tips. Pitch to the level.';},
      user:function(v){return 'Revision notes on: '+v.topic+' ('+v.subj+', '+v.level+').';} },
    { key:'mindmap', name:'Mind map', icon:'🧠', topic:true,
      sys:function(a){return 'Produce a mind-map outline '+a.forWhom+' as nested markdown bullets: the central topic, 4–6 main branches, each with 2–4 sub-points. Concise labels only.';},
      user:function(v){return 'Mind map for: '+v.topic+' ('+v.subj+', '+v.level+').';} },
    { key:'summary', name:'Topic summariser', icon:'📄', topic:true, text:true,
      sys:function(a){return 'Summarise the supplied text '+a.forWhom+': a 3–4 sentence summary, then 4–6 key bullet points, then a one-line "Key terms". Markdown.';},
      user:function(v){return 'Topic: '+v.topic+' ('+v.subj+', '+v.level+').\n\nTEXT:\n'+v.textIn;} },
    { key:'essay', name:'Essay plan', icon:'✍️', topic:true,
      sys:function(a){return 'Produce an essay plan '+a.forWhom+': a clear thesis, an introduction, 3 body paragraphs (each Point/Evidence/Explain with a concrete example), a counter-argument, and a conclusion. Markdown headings.';},
      user:function(v){return 'Essay question: '+v.topic+' ('+v.subj+', '+v.level+').';} },
    { key:'diagram', name:'Labelled diagram', icon:'🖼️', topic:true,
      sys:function(a){return 'Describe a LABELLED DIAGRAM as structured text '+a.forWhom+' (no image): a one-line overview, then a numbered list of every labelled part with its position and function, then 2–3 exam tips. Markdown.';},
      user:function(v){return 'Labelled diagram of: '+v.topic+' ('+v.subj+', '+v.level+').';} },
    { key:'worksheet', name:'Worksheet', icon:'📋', topic:true,
      sys:function(a){return 'Create a printable worksheet '+a.forWhom+': a short instruction line, then 8–12 questions rising in difficulty (recall → apply → stretch), then a separate ANSWERS section. Markdown; leave space implied by numbering.';},
      user:function(v){return 'Worksheet on: '+v.topic+' ('+v.subj+', '+v.level+').';} }
  ];

  function mount(el, opts){
    opts = opts || {};
    var ctx = opts.context || 'student';
    var brand = opts.brand || { name:'StudYear', line:'AI Academic Operating System' };
    var levels = opts.levels || ['Reception','KS1','KS2','11+','KS3','GCSE','IGCSE','AS','A-level','BTEC','University'];
    var subjects = opts.subjects || ['Mathematics','English','Science','Biology','Chemistry','Physics','History','Geography','Computer Science','Business','Psychology'];
    var d = opts.defaults || {};
    var audience = { student:{ forWhom:'for a student to revise from', save:'your library', badge:'Mine' },
                     teacher:{ forWhom:'for a class of students to use', save:'your class library', badge:'Class' },
                     tutor:{ forWhom:'for your tutee to work through', save:'your student library', badge:'Tutee' } }[ctx] || {};
    var COST = opts.cost || 5;

    function $(id){ return el.querySelector('#'+id); }
    el.innerHTML =
      '<div class="mk-tabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+
        MAKERS.map(function(m,i){return '<button class="btn ghost sm mk-t'+(i===0?' on':'')+'" data-mk="'+m.key+'">'+m.icon+' '+esc(m.name)+'</button>';}).join('')+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'+
        '<div><label class="f">Subject</label><select id="mk-subj">'+subjects.map(function(s){return '<option'+(s===d.subject?' selected':'')+'>'+esc(s)+'</option>';}).join('')+'</select></div>'+
        '<div><label class="f">Level</label><select id="mk-level">'+levels.map(function(l){return '<option'+(l===d.level?' selected':'')+'>'+esc(l)+'</option>';}).join('')+'</select></div>'+
        '<div><label class="f">Topic</label><input type="text" id="mk-topic" placeholder="e.g. Photosynthesis, Quadratics, WW1 causes"></div>'+
      '</div>'+
      '<div id="mk-textwrap" style="margin-top:10px;display:none"><label class="f">Paste the text to summarise</label><textarea id="mk-text" rows="5" placeholder="Paste an article or notes…"></textarea></div>'+
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
        '<button class="btn" id="mk-go">✨ Generate</button>'+
        '<span class="note" id="mk-status" style="margin:0">'+esc(opts.note||'')+'</span></div>'+
      '<div id="mk-outwrap" style="display:none;margin-top:14px">'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+
          '<button class="btn sm" id="mk-save">💾 Save to '+esc(audience.save||'library')+'</button>'+
          '<button class="btn ghost sm" id="mk-export">⬇ Export</button>'+
          '<button class="btn ghost sm" id="mk-copy">📋 Copy</button></div>'+
        '<div id="mk-out" style="background:#fff;color:#111;border-radius:8px;padding:16px 18px;max-height:460px;overflow:auto;font-family:Georgia,serif;line-height:1.5"></div></div>';

    var cur = MAKERS[0], state = null;
    function pick(m){ cur = m;
      el.querySelectorAll('.mk-t').forEach(function(b){ b.classList.toggle('on', b.dataset.mk===m.key); });
      $('mk-textwrap').style.display = m.text ? 'block' : 'none';
      $('mk-topic').placeholder = m.key==='essay' ? "e.g. 'To what extent…?'" : 'e.g. Photosynthesis, Quadratics, WW1 causes';
    }
    el.querySelectorAll('.mk-t').forEach(function(b){ b.onclick=function(){ pick(MAKERS.filter(function(m){return m.key===b.dataset.mk;})[0]); }; });

    $('mk-go').onclick = async function(){
      var subj=$('mk-subj').value, level=$('mk-level').value, topic=($('mk-topic').value||'').trim();
      var textIn = cur.text ? ($('mk-text').value||'').trim() : '';
      if(!topic){ $('mk-status').textContent='Add a topic first.'; return; }
      if(cur.text && !textIn){ $('mk-status').textContent='Paste some text to summarise.'; return; }
      if(!(window.SYAI && SYAI.ready())){ $('mk-status').textContent='Live AI is warming up — try again in a moment.'; return; }
      if(window.SYAI.canAfford && !window.SYAI.canAfford(COST)){ $('mk-status').textContent='Not enough ACUs — top up to generate ('+COST+' needed).'; return; }
      $('mk-go').disabled=true; $('mk-status').textContent='Writing your '+cur.name.toLowerCase()+' with '+SYAI.provider()+'…';
      try{
        var a = { forWhom: audience.forWhom || 'for a student' };
        var sys = cur.sys(a) + ((window.SY&&SY.stageStyle)?SY.stageStyle(level):'');
        var user = cur.user({ subj:subj, level:level, topic:topic, textIn:textIn });
        var txt = await SYAI.ask(sys, user, { maxTokens: 1100, acus: COST, label: cur.name+': '+topic });
        var html = cur.render ? cur.render(txt) : SYAI.render(txt);
        state = { type:cur.name, title:cur.name+' · '+topic, subj:subj, level:level, body:txt, html:html };
        $('mk-out').innerHTML = html;
        $('mk-outwrap').style.display='block';
        $('mk-status').textContent='Done — save it to '+(audience.save||'your library')+', export or copy.';
      }catch(e){ $('mk-status').textContent='Live AI unreachable — try again shortly.'; }
      $('mk-go').disabled=false;
    };

    $('mk-save') && ($('mk-save').onclick = function(){
      if(!state) return;
      try{
        if(opts.save){ opts.save(state); }
        else if(window.SY){
          var mine = SY.get('mine', []);
          mine.push({ id:'u'+(mine.length+1)+'m', mine:true, type:state.type, title:state.title, subj:state.subj, level:state.level, body:state.body });
          SY.set('mine', mine);
        }
        if(window.SY&&SY.log) SY.log('create', state.type+' created: '+state.title, (state.subj?state.subj+' · ':'')+state.level+' — saved to '+(audience.save||'your library')+'.');
        $('mk-status').textContent='Saved to '+(audience.save||'your library')+' ✓';
      }catch(e){ $('mk-status').textContent='Saved locally.'; }
    });
    $('mk-copy') && ($('mk-copy').onclick = function(){
      if(!state) return;
      (navigator.clipboard?navigator.clipboard.writeText(state.body):Promise.reject()).then(
        function(){ $('mk-status').textContent='Copied to clipboard ✓'; },
        function(){ $('mk-status').textContent='Copy failed — select the text manually.'; });
    });
    $('mk-export') && ($('mk-export').onclick = function(){
      if(!state) return;
      if(window.SYExport && SYExport.menu){
        SYExport.menu(this, {
          word:function(){ SYExport.word(state.title, { title:state.title, blocks:[{p:state.body}] }); },
          pdf:function(){ SYExport.pdf(state.title, '<h2>'+esc(state.title)+'</h2>'+state.html); }
        });
      } else if(window.SYExport && SYExport.pdf){ SYExport.pdf(state.title, '<h2>'+esc(state.title)+'</h2>'+state.html); }
      else { $('mk-copy').click(); }
    });

    pick(MAKERS[0]);
  }

  window.SYMakers = { mount: mount };
})();
