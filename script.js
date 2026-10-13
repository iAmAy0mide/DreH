const IMG = {
  p1d: "images/portrait-1.png",        /* drawing 1 */
  p1r: "images/portrait-1-photo.png",  /* reference photo for drawing 1 */
  p2d: "images/portrait-2.png"         /* drawing 2 */
};
const $ = function(s,r){ return (r||document).querySelector(s); };
const $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function src(k){ return IMG[k]; }
function money(n){ return '$' + n; }

var state = {
  mode:'open', slot:2, booked:null, photoUrl:null, photoStatus:'ok',
  total:150, deposit:45, name:'Amara', ppl:1, sizeName:'A4', slug:'amara-x7k2', weeks:3, paid:false, stage:0
};

/* notes toggle */
$('#notes').addEventListener('change', function(e){ document.body.classList.toggle('no-notes', !e.target.checked); });

/* ---------- slot board + modes ---------- */
function takenCount(){ var n = 0; for (var i=0;i<6;i++){ if (isTaken(i)) n++; } return n; }
function isTaken(i){ return state.mode === 'sold' || i < 2 || (state.booked && state.booked.slot === i); }
function renderBoard(){
  var board = $('#board'); board.innerHTML = '';
  var imgs = ['p1d','p2d','p1d','p2d','p1d','p2d'], pos = ['50% 0%','50% 0%','50% 100%','30% 100%','50% 55%','70% 20%'];
  for (var i=0;i<6;i++){
    var b = document.createElement('button'); b.type = 'button';
    b.style.setProperty('--r', (((i % 3) - 1) * 1.7) + 'deg');
    if (isTaken(i)){
      var mine = state.booked && state.booked.slot === i;
      b.className = 'slot taken'; b.disabled = true;
      b.setAttribute('aria-label', 'Slot ' + (i+1) + (mine ? ', yours' : ', taken'));
      b.innerHTML = '<span class="tape"></span><img alt="" style="object-position:' + (mine ? '50% 50%' : pos[i]) + '" src="' + (mine && state.booked.thumb ? state.booked.thumb : src(imgs[i])) + '"><span class="stamp">' + (mine ? 'yours' : 'taken') + '</span>';
    } else {
      var sel = state.slot === i;
      b.className = 'slot free' + (sel ? ' mine' : '');
      b.setAttribute('aria-label', 'Slot ' + (i+1) + ', open' + (sel ? ', selected' : ''));
      b.setAttribute('aria-pressed', sel ? 'true' : 'false');
      b.innerHTML = '<span class="num">' + (i+1) + '</span><span class="cta">' + (sel ? 'Your slot' : 'Hold this slot') + '</span>';
      (function(idx){ b.addEventListener('click', function(){
        state.slot = idx; renderBoard(); updateSlotLabels();
        document.getElementById('reserve').scrollIntoView();
      }); })(i);
    }
    board.appendChild(b);
  }
  var free = 6 - takenCount();
  if (state.mode === 'open'){
    $('#hh').textContent = free === 0 ? 'All slots are taken.' : (free === 1 ? '1 portrait slot is open.' : free + ' portrait slots are open.');
    $('#legend').textContent = free === 0 ? 'Every slot is taken. Join the waitlist for the next round.' : 'Click a free slot to hold it.';
  }
}
function updateSlotLabels(){
  var n = state.slot + 1;
  $('#slotlabel').textContent = 'Slot ' + n + ' selected';
  $('#pay-slot').textContent = n;
}
function nextRound(){
  var d = new Date(), t = new Date(d.getFullYear(), d.getMonth() + 1, 1, 10, 0, 0);
  return t;
}
function setMode(m){
  state.mode = m;
  var sold = m === 'sold';
  $('#act-open').hidden = sold; $('#act-sold').hidden = !sold;
  $('#flow').hidden = sold; $('#soldnote').hidden = !sold;
  if (sold){
    var t = nextRound();
    var mon = t.toLocaleDateString('en',{month:'long'});
    $('#hs').textContent = 'DreH only takes a few portraits per round, so each one gets his full attention. Join the waitlist and you get the first 24 hours of booking, before anyone else.';
    $('#legend').textContent = 'Next round opens on ' + t.toLocaleDateString('en',{day:'numeric',month:'long'}) + '.';
    $('#hh').textContent = 'Fully booked until ' + mon + '.';
    tick();
  } else {
    $('#hs').textContent = 'DreH draws a few portraits at a time, so each one gets his full attention. Hold a slot with a deposit, then follow your portrait on your own page.';
  }
  renderBoard();
}
$$('input[name="mode"]').forEach(function(r){ r.addEventListener('change', function(){ setMode(r.value); }); });

function pad(n){ return (n < 10 ? '0' : '') + n; }
function tick(){
  var ms = Math.max(0, nextRound() - new Date()), s = Math.floor(ms/1000);
  $('#cd').textContent = Math.floor(s/86400);
  $('#ch').textContent = pad(Math.floor(s%86400/3600));
  $('#cm').textContent = pad(Math.floor(s%3600/60));
  $('#cs').textContent = pad(s%60);
}
setInterval(function(){ if (state.mode === 'sold') tick(); }, 1000);

$('#waitform').addEventListener('submit', function(e){
  e.preventDefault();
  var v = $('#waitemail').value.trim(), err = $('#waiterr');
  if (!/^\S+@\S+\.\S+$/.test(v)){ err.textContent = 'Enter a valid email address, like name@example.com.'; return; }
  err.textContent = '';
  var pos = 9 + (v.length * 7) % 31;
  var ok = $('#waitok'); ok.hidden = false;
  ok.textContent = "You're number " + pos + " on the waitlist. You'll get a message the moment the next round opens, 24 hours before everyone else. (Sample position for this mockup.)";
});

/* ---------- stepper ---------- */
function go(n){
  $$('.panel').forEach(function(p){ p.classList.toggle('on', +p.dataset.p === n); });
  $$('#stepper li').forEach(function(li,i){ li.classList.toggle('on', i === n-1); li.classList.toggle('done', i < n-1); });
  var f = document.getElementById('flow');
  if (f.getBoundingClientRect().top < 0) f.scrollIntoView();
}
$$('[data-back]').forEach(function(b){ b.addEventListener('click', function(){ go(+b.dataset.back); }); });

/* ---------- photo analysis ---------- */
function setChecks(items, verdict){
  var ul = $('#checks'); ul.innerHTML = '';
  items.forEach(function(it){
    var li = document.createElement('li'); li.className = it.s;
    var ic = it.s === 'good' ? '✓' : it.s === 'warn' ? '!' : '✕';
    li.innerHTML = '<span class="ic" aria-hidden="true">' + ic + '</span><div><b>' + it.t + '</b><small>' + it.d + '</small></div>';
    ul.appendChild(li);
  });
  var v = $('#verdict'); v.hidden = false; v.className = 'verdict ' + verdict.s; v.textContent = verdict.t;
}
function showThumb(url){
  var img = document.createElement('img'); img.alt = 'Your selected photo'; img.src = url;
  $('#thumb').innerHTML = ''; $('#thumb').appendChild(img);
  state.photoUrl = url;
  $('#filebtn').textContent = 'Choose a different photo';
  $('#to2').disabled = false;
}
function analyze(file){
  var url = URL.createObjectURL(file), im = new Image();
  im.onload = function(){
    var w = im.naturalWidth, h = im.naturalHeight, sc = Math.min(1, 256/Math.max(w,h));
    var cw = Math.max(8, Math.round(w*sc)), ch = Math.max(8, Math.round(h*sc));
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var x = c.getContext('2d', {willReadFrequently:true}); x.drawImage(im, 0, 0, cw, ch);
    var d = x.getImageData(0, 0, cw, ch).data, g = new Float32Array(cw*ch), sum = 0, i;
    for (i=0;i<cw*ch;i++){ g[i] = 0.299*d[i*4] + 0.587*d[i*4+1] + 0.114*d[i*4+2]; sum += g[i]; }
    var mean = sum/(cw*ch), s1 = 0, s2 = 0, n = 0;
    for (var yy=1; yy<ch-1; yy++){ for (var xx=1; xx<cw-1; xx++){
      var l = g[(yy-1)*cw+xx] + g[(yy+1)*cw+xx] + g[yy*cw+xx-1] + g[yy*cw+xx+1] - 4*g[yy*cw+xx];
      s1 += l; s2 += l*l; n++;
    } }
    var lap = n ? (s2/n - (s1/n)*(s1/n)) : 0, m = Math.min(w,h);
    var items = [], worst = 'good';
    function rank(s){ if (s === 'bad') worst = 'bad'; else if (s === 'warn' && worst !== 'bad') worst = 'warn'; }
    var rs = m >= 1000 ? 'good' : m >= 600 ? 'warn' : 'bad'; rank(rs);
    items.push({s:rs, t:'Resolution: ' + w + ' × ' + h, d: rs === 'good' ? 'Plenty of detail to draw from.' : rs === 'warn' ? 'A bit small. A larger original would help.' : 'Too small to capture fine detail. Please send the original file.'});
    var ls = (mean >= 55 && mean <= 205) ? 'good' : 'warn'; rank(ls);
    items.push({s:ls, t:'Lighting', d: ls === 'good' ? 'Balanced, with visible shadows and highlights.' : (mean < 55 ? 'Very dark. Details in the shadows may be lost.' : 'Very bright. Details in the highlights may be lost.')});
    var ss = lap >= 60 ? 'good' : lap >= 25 ? 'warn' : 'bad'; rank(ss);
    items.push({s:ss, t:'Sharpness', d: ss === 'good' ? 'Looks sharp.' : ss === 'warn' ? 'A little soft around the edges.' : 'Looks blurry. Eyes and edges need to be clear.'});
    var msg = worst === 'good' ? 'This photo looks great. DreH can start as soon as your slot is confirmed.'
            : worst === 'warn' ? 'This photo will work, but a sharper or larger one would give a better portrait. DreH may ask for a replacement.'
            : 'This photo is likely too small or blurry. Please upload a better one, or continue and DreH will review it.';
    state.photoStatus = worst === 'good' ? 'ok' : 'review';
    showThumb(url);
    setChecks(items, {s:worst, t:msg});
  };
  im.onerror = function(){ setChecks([{s:'bad', t:'Could not read this file', d:'Try a JPG or PNG photo.'}], {s:'bad', t:'Please choose a different file.'}); };
  im.src = url;
}
$('#file').addEventListener('change', function(){ var f = this.files[0]; if (f && /^image\//.test(f.type)) analyze(f); });
var drop = $('#drop');
['dragenter','dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
drop.addEventListener('drop', function(e){ var f = e.dataTransfer.files[0]; if (f && /^image\//.test(f.type)) analyze(f); });
$('#file').addEventListener('focus', function(){ $('#filebtn').style.outline = '3px solid #1F3FA8'; });
$('#file').addEventListener('blur', function(){ $('#filebtn').style.outline = ''; });
$('#sample').addEventListener('click', function(){
  state.photoStatus = 'ok'; showThumb(src('p1r'));
  setChecks([
    {s:'good', t:'Resolution', d:'Plenty of detail to draw from.'},
    {s:'good', t:'Lighting', d:'Balanced, with visible shadows and highlights.'},
    {s:'good', t:'Sharpness', d:'Looks sharp.'}
  ], {s:'good', t:'Sample photo. These results are simulated for the demo.'});
});
$('#to2').addEventListener('click', function(){ go(2); });

/* ---------- quote ---------- */
var mult = {1:1, 2:1.7, 3:2.4}, sizeNames = {90:'A5', 150:'A4', 240:'A3'};
function val(n){ return document.querySelector('input[name="' + n + '"]:checked'); }
function calc(){
  var s = val('size'), p = val('ppl'), base = +s.value, n = +p.value;
  var total = Math.round(base * mult[n] / 5) * 5, dep = Math.round(total * 0.3);
  state.total = total; state.deposit = dep; state.ppl = n; state.sizeName = sizeNames[base]; state.weeks = +s.dataset.w + (n-1);
  $('#price').textContent = money(total);
  $('#q-dep').textContent = money(dep); $('#q-bal').textContent = money(total - dep);
  $('#q-eta').textContent = 'about ' + state.weeks + ' weeks';
  $('#dep2').textContent = money(dep); $('#pay-total').textContent = money(total); $('#pay-bal').textContent = money(total - dep);
  $('#pay-what').textContent = state.sizeName + ', ' + n + (n === 1 ? ' person' : ' people');
  $('#pay').textContent = 'Pay ' + money(dep) + ' deposit';
}
$$('input[name="size"],input[name="ppl"]').forEach(function(i){ i.addEventListener('change', calc); });
$('#to3').addEventListener('click', function(){ go(3); });

/* ---------- pay deposit ---------- */
function slugify(s){ return (s || 'client').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'client'; }
$('#pay').addEventListener('click', function(){
  var name = $('#cname').value.trim(), em = $('#cemail').value.trim(), err = $('#payerr');
  if (!name){ err.textContent = 'Enter your name so DreH knows who the portrait is for.'; $('#cname').focus(); return; }
  if (!/^\S+@\S+\.\S+$/.test(em)){ err.textContent = 'Enter a valid email address, like name@example.com.'; $('#cemail').focus(); return; }
  if (!$('#agree').checked){ err.textContent = 'Tick the box to confirm you understand the deposit terms.'; $('#agree').focus(); return; }
  err.textContent = '';
  var btn = this; btn.disabled = true; btn.textContent = 'Processing…';
  setTimeout(function(){
    state.name = name; state.slug = slugify(name) + '-' + Math.random().toString(36).slice(2,6);
    state.booked = {slot:state.slot, thumb:state.photoUrl}; state.paid = false;
    var n = state.slot + 1;
    $('#done-h').textContent = 'Slot ' + n + ' is yours, ' + name + '.';
    $('#done-url').textContent = 'dreh.art/c/' + state.slug;
    addStudioRow({name:name, size:state.sizeName, ppl:state.ppl, stage:'Waiting to start', photo:state.photoStatus, photoText:state.photoStatus === 'ok' ? 'Approved' : 'Needs review', dep:true, depAmt:state.deposit, due:state.weeks * 7, isNew:true});
    renderBoard(); refreshClient(); go(4);
    btn.disabled = false; calc();
  }, 900);
});
$('#again').addEventListener('click', function(){
  state.booked = null; state.photoUrl = null; state.slot = Math.max(2, firstFree());
  $('#thumb').innerHTML = '<span>no photo yet</span>'; $('#to2').disabled = true;
  $('#checks').innerHTML = '<li><span class="ic">·</span><div><b>Waiting for a photo</b><small>Resolution, lighting and sharpness are checked here.</small></div></li>';
  $('#verdict').hidden = true; $('#file').value = ''; $('#filebtn').textContent = 'Choose a photo';
  $('#agree').checked = false;
  renderBoard(); updateSlotLabels(); go(1);
});
function firstFree(){ for (var i=0;i<6;i++){ if (!isTaken(i)) return i; } return 2; }

/* ---------- client page ---------- */
var stages = [
  {n:'Outline', p:22, d:'Day 4',  t:'Outline done. Proportions are set. Reply here if anything looks off.'},
  {n:'Mid-tones', p:52, d:'Day 9', t:'Mid-tones are in. The shapes of the face and clothing are building up.'},
  {n:'Hatching', p:82, d:'Day 14', t:'Hatching is in progress. Texture and depth are starting to show.'},
  {n:'Final details', p:100, d:'Day 18', t:'Final details done. Darks, highlights and signature. Your reveal is ready.'}
];
var tween = null;
function setP(v){ $('#viewer').style.setProperty('--p', v); }
function renderFeed(extra){
  var feed = $('#feed'); feed.innerHTML = '';
  var rows = [{d:'Day 1', t:'Photo approved. Sharp, well lit, and plenty of detail to work from.'}];
  for (var i=0;i<=state.stage;i++) rows.push({d:stages[i].d, t:stages[i].t});
  rows.slice().reverse().forEach(function(r){
    var li = document.createElement('li'); li.innerHTML = '<span class="d">' + r.d + '</span><span></span>'; li.lastChild.textContent = r.t; feed.appendChild(li);
  });
  (state.msgs || []).slice().reverse().forEach(function(m){
    var li = document.createElement('li'); li.className = 'msg'; li.innerHTML = '<span class="d">You</span><span></span>'; li.lastChild.textContent = m; feed.insertBefore(li, feed.firstChild);
  });
}
function setStage(i){
  state.stage = i;
  $$('.stagebtns button').forEach(function(b){ b.setAttribute('aria-pressed', +b.dataset.s === i ? 'true' : 'false'); });
  var from = parseFloat($('#viewer').style.getPropertyValue('--p')) || 0, to = stages[i].p, t0 = performance.now();
  if (tween) cancelAnimationFrame(tween);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function step(t){
    var k = reduce ? 1 : Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1-k, 3);
    setP(from + (to - from) * e);
    if (k < 1) tween = requestAnimationFrame(step);
  })(t0);
  $('#meter').style.width = (i + 1) * 25 + '%';
  renderFeed();
}
$$('.stagebtns button').forEach(function(b){ b.addEventListener('click', function(){ setStage(+b.dataset.s); }); });
$('#csend').addEventListener('click', function(){
  var v = $('#cmsg').value.trim(); if (!v) return;
  (state.msgs = state.msgs || []).push(v); $('#cmsg').value = ''; renderFeed();
});

/* tabs */
function selectTab(n){
  [1,2].forEach(function(k){
    $('#tab' + k).setAttribute('aria-selected', k === n ? 'true' : 'false'); $('#tab' + k).tabIndex = k === n ? 0 : -1;
    $('#tp' + k).classList.toggle('on', k === n);
  });
}
$('#tab1').addEventListener('click', function(){ selectTab(1); });
$('#tab2').addEventListener('click', function(){ selectTab(2); });
$$('[role="tab"]').forEach(function(t){ t.addEventListener('keydown', function(e){
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ var n = t.id === 'tab1' ? 2 : 1; selectTab(n); $('#tab' + n).focus(); }
}); });

function refreshClient(){
  var nm = state.name;
  $('#cp-title').textContent = nm + (/s$/i.test(nm) ? "' portrait" : "'s portrait");
  $('#cpurl').textContent = 'dreh.art/c/' + state.slug;
  $('#chip-dep').textContent = 'Deposit paid ' + money(state.deposit);
  updatePay();
  var eta = new Date(); eta.setDate(eta.getDate() + state.weeks * 7);
  $('#eta').textContent = 'Estimated delivery: ' + eta.toLocaleDateString('en',{day:'numeric',month:'long',year:'numeric'});
}
function updatePay(){
  var bal = state.total - state.deposit;
  $('#balamt').textContent = money(bal);
  var cb = $('#chip-bal');
  if (state.paid){ cb.className = 'chip ok'; cb.textContent = 'Balance paid'; }
  else { cb.className = 'chip wait'; cb.textContent = 'Balance ' + money(bal) + ' due at reveal'; }
  $('#paybox').classList.toggle('paid', state.paid);
  $('#paystate').innerHTML = state.paid ? 'Balance paid. <b>Thank you.</b>' : 'Balance due: <b>' + money(bal) + '</b>';
  $('#paybal').hidden = state.paid;
  $('#wm').hidden = state.paid;
  ['sh-copy','sh-fb','sh-dl'].forEach(function(id){ $('#' + id).disabled = !state.paid; });
  $('#rtext').textContent = state.paid ? 'Your full-resolution reveal is unlocked. Share it, post it, or save it.' : 'Drag across to compare your photo with the portrait. The full-resolution reveal unlocks when the balance is paid.';
}
$('#paybal').addEventListener('click', function(){ state.paid = true; updatePay(); $('#toast').textContent = ''; });
$('#sh-copy').addEventListener('click', function(){
  var u = 'https://dreh.art/c/' + state.slug + '/reveal';
  try { navigator.clipboard.writeText(u).then(function(){ $('#toast').textContent = 'Link copied: ' + u; }, function(){ $('#toast').textContent = 'Copy this link: ' + u; }); }
  catch(e){ $('#toast').textContent = 'Copy this link: ' + u; }
});
$('#sh-fb').addEventListener('click', function(){ $('#toast').textContent = "On the live site this opens Facebook's share window with the reveal and a link back to DreH."; });
$('#sh-dl').addEventListener('click', function(){ $('#toast').textContent = 'On the live site this downloads the full-resolution file.'; });

/* watermark */
(function(){
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='230' height='150'><text x='115' y='80' text-anchor='middle' transform='rotate(-24 115 75)' font-family='Georgia,serif' font-size='24' fill='white' fill-opacity='.7' stroke='black' stroke-opacity='.3' stroke-width='.7'>DreH · preview</text></svg>";
  $('#wm').style.backgroundImage = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
})();

/* reveal slider */
(function(){
  var c = $('#rcmp'), r = c.querySelector('input');
  function set(){ c.style.setProperty('--x', r.value + '%'); }
  r.addEventListener('input', set); set();
})();

/* ---------- gifts ---------- */
(function(){
  var code = 'DREH-' + Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
  var d = new Date(); d.setDate(d.getDate() + 14);
  var iso = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  $('#gdate').value = iso; $('#gdate').min = new Date().toISOString().slice(0,10);
  function fmtDate(v){ if (!v) return 'the day you choose'; var p = v.split('-'); return new Date(+p[0], +p[1]-1, +p[2]).toLocaleDateString('en',{day:'numeric',month:'long'}); }
  function render(){
    var type = document.querySelector('input[name="gt"]:checked').value;
    var a = document.querySelector('input[name="ga"]:checked').value.split('|'), price = a[0], size = a[1];
    var to = $('#gto').value.trim() || 'you', from = $('#gfrom').value.trim() || 'Someone';
    $('#gtotal').textContent = 'Total today: ' + money(price);
    $('#gm').textContent = $('#gmsg').value;
    $('#gcode').textContent = code;
    if (type === 'voucher'){
      $('#gk').textContent = 'A gift from ' + from;
      $('#gh').textContent = 'A hand-drawn portrait, for ' + to;
      $('#gnote').textContent = 'Good for one ' + size + ' portrait. Arrives ' + fmtDate($('#gdate').value) + '. Redeem at dreh.art/gift';
    } else {
      $('#gk').textContent = from + ' has a surprise for you';
      $('#gh').textContent = 'Your portrait is being planned, ' + to;
      $('#gnote').textContent = 'A ' + size + ' portrait from a photo ' + from + ' chose. Unwraps ' + fmtDate($('#gdate').value) + '.';
    }
  }
  ['gto','gfrom','gmsg','gdate'].forEach(function(id){ $('#' + id).addEventListener('input', render); });
  $$('input[name="gt"],input[name="ga"]').forEach(function(i){ i.addEventListener('change', render); });
  $('#gbuy').addEventListener('click', function(){
    var ok = $('#gok'); ok.hidden = false;
    var to = $('#gto').value.trim() || 'the recipient';
    ok.textContent = 'Gift ready. On the live site you would pay now, and the card for ' + to + ' would be emailed on ' + fmtDate($('#gdate').value) + ' with a link you can also share yourself. No payment is taken in this mockup.';
  });
  render();
})();

/* ---------- studio view ---------- */
var rows = [
  {name:'Tobi', size:'A4', ppl:1, stage:'Hatching', photo:'ok', photoText:'Approved', dep:true, depAmt:45, due:9},
  {name:'Lena', size:'A3', ppl:2, stage:'Waiting to start', photo:'review', photoText:'Needs review', dep:true, depAmt:122, due:28},
  {name:'Kemi', size:'A5', ppl:1, stage:'Outline', photo:'ok', photoText:'Approved', dep:true, depAmt:27, due:6},
  {name:'Marcus', size:'A4', ppl:1, stage:'Waiting for deposit', photo:'ok', photoText:'Approved', dep:false, depAmt:45, due:null}
];
function dueText(n){ if (n === null) return 'Not set'; var d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en',{day:'numeric',month:'short'}); }
function addStudioRow(r){ rows.unshift(r); renderStudio(); }
function renderStudio(){
  var tb = $('#rows'); tb.innerHTML = '';
  rows.forEach(function(r, i){
    var tr = document.createElement('tr'); if (r.isNew) tr.className = 'new';
    var photoCls = r.photo === 'ok' ? 'good' : r.photo === 'asked' ? 'warn' : 'warn';
    var act = '';
    if (r.photo === 'review') act = '<button class="mini" data-a="ok" data-i="' + i + '">Approve photo</button><button class="mini" data-a="asked" data-i="' + i + '">Ask for new photo</button>';
    else if (r.photo === 'asked') act = '<span class="fine">Waiting for a new photo</span>';
    else if (!r.dep) act = '<button class="mini" data-a="remind" data-i="' + i + '">Send deposit reminder</button>';
    else act = '<span class="fine">Nothing needed</span>';
    tr.innerHTML = '<td><b></b>' + (r.isNew ? ' <span class="tag good">New</span>' : '') + '</td><td>' + r.size + ', ' + r.ppl + (r.ppl === 1 ? ' person' : ' people') + '</td><td>' + r.stage + '</td><td><span class="tag ' + photoCls + '">' + r.photoText + '</span></td><td><span class="tag ' + (r.dep ? 'good' : 'warn') + '">' + (r.dep ? 'Paid $' + r.depAmt : 'Waiting') + '</span></td><td>' + dueText(r.due) + '</td><td>' + act + '</td>';
    tr.querySelector('b').textContent = r.name;
    tb.appendChild(tr);
  });
  var collected = rows.reduce(function(s,r){ return s + (r.dep ? r.depAmt : 0); }, 0);
  var review = rows.filter(function(r){ return r.photo === 'review'; }).length;
  var waiting = rows.filter(function(r){ return !r.dep || r.photo === 'asked'; }).length;
  $('#stats').innerHTML = '<div><b>' + rows.length + '</b><span>commissions in the queue</span></div><div><b>$' + collected + '</b><span>deposits collected</span></div><div><b>' + review + '</b><span>photos need your eyes</span></div><div><b>' + waiting + '</b><span>waiting on clients</span></div>';
}
$('#rows').addEventListener('click', function(e){
  var b = e.target.closest('button[data-a]'); if (!b) return;
  var r = rows[+b.dataset.i], a = b.dataset.a;
  if (a === 'ok'){ r.photo = 'ok'; r.photoText = 'Approved'; if (r.stage === 'Waiting to start') r.stage = 'Outline'; }
  if (a === 'asked'){ r.photo = 'asked'; r.photoText = 'New photo requested'; }
  if (a === 'remind'){ b.textContent = 'Reminder sent'; b.disabled = true; return; }
  renderStudio();
});

/* init */
calc(); updateSlotLabels(); setMode('open'); refreshClient(); setStage(0); renderStudio(); setP(stages[0].p);
