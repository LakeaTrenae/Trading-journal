let trades = JSON.parse(localStorage.getItem('tj_pink') || '[]');
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let grade = '';
  document.getElementById('f-date').valueAsDate = new Date();
  ['f-entry','f-exit','f-contracts'].forEach(id => document.getElementById(id).addEventListener('input', calcPnl));

  function calcPnl() {
    const e=parseFloat(document.getElementById('f-entry').value)||0;
    const x=parseFloat(document.getElementById('f-exit').value)||0;
    const c=parseInt(document.getElementById('f-contracts').value)||1;
    const el=document.getElementById('f-pnl-calc');
    if(e&&x){const p=(x-e)*100*c;el.value=(p>=0?'+':'')+'$'+p.toFixed(2);el.style.color=p>=0?'var(--win)':'var(--loss)';}
    else{el.value='';el.style.color='';}
  }

  function goTab(id,btn){
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.bnav-btn').forEach(t=>t.classList.remove('active'));
    document.getElementById('panel-'+id).classList.add('active');
    document.querySelectorAll('.tab').forEach(t=>{ if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'"+id+"'")) t.classList.add('active'); });
    document.querySelectorAll('.bnav-btn').forEach(t=>{ if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'"+id+"'")) t.classList.add('active'); });
    if(id==='calendar')renderCalendar();
    if(id==='history')renderHistory();
    if(id==='stats')renderStats();
    window.scrollTo(0,0);
  }
  function goTabMobile(id,btn){ goTab(id,btn); }

  function togglePill(el){el.classList.toggle('on');}
  function toggleRule(el){
    el.classList.toggle('on');
    el.querySelector('.chk').textContent=el.classList.contains('on')?'✓':'';
  }
  function pickGrade(btn,g){
    document.querySelectorAll('.grade-btn').forEach(b=>b.className='grade-btn');
    btn.classList.add('on-'+g); grade=g;
  }

  function saveTrade(){
    const date=document.getElementById('f-date').value;
    const tick=document.getElementById('f-ticker').value.trim().toUpperCase();
    const dir=document.getElementById('f-direction').value;
    const entry=parseFloat(document.getElementById('f-entry').value);
    const exit=parseFloat(document.getElementById('f-exit').value);
    if(!date||!tick||!dir||!entry||!exit){alert('Please fill in: Date, Ticker, Direction, Entry Price, and Exit Price 🌸');return;}
    const contracts=parseInt(document.getElementById('f-contracts').value)||1;
    const pnl=(exit-entry)*100*contracts;
    const emotions=[...document.querySelectorAll('#emotion-grid .pill.on')].map(b=>b.textContent.trim());
    const rules=[...document.querySelectorAll('.rule-item.on')].map(r=>r.dataset.rule);
    const paperTrade = document.getElementById('f-paper')?.value === 'yes';
    trades.unshift({id:Date.now(),date,ticker:tick,direction:dir,strike:document.getElementById('f-strike').value,expiry:document.getElementById('f-expiry').value,contracts,entry,exit,pnl,paperTrade,entryTime:document.getElementById('f-entry-time').value,exitTime:document.getElementById('f-exit-time').value,setup:[...document.querySelectorAll('#setup-grid .setup-pill.on')].map(b=>b.textContent.trim()),emotions,rules,grade,what:document.getElementById('f-what').value,lesson:document.getElementById('f-lesson').value,diff:document.getElementById('f-diff').value});
    localStorage.setItem('tj_pink',JSON.stringify(trades));
    updateHeader();
  renderCalendar(); resetForm(); alert('✓ Trade saved! Keep going 🌸');
  }

  function resetForm(){
    ['f-ticker','f-strike','f-entry','f-exit','f-pnl-calc','f-what','f-lesson','f-diff'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('f-pnl-calc').style.color='';
    ['f-direction','f-expiry','f-entry-time','f-exit-time'].forEach(id=>document.getElementById(id).value='');
    if(document.getElementById('f-paper')) document.getElementById('f-paper').value='no';
    document.querySelectorAll('#setup-grid .setup-pill.on').forEach(b=>b.classList.remove('on'));
    document.getElementById('f-contracts').value='1';
    document.getElementById('f-date').valueAsDate=new Date();
    document.querySelectorAll('.pill.on').forEach(b=>b.classList.remove('on'));
    document.querySelectorAll('.rule-item.on').forEach(r=>{r.classList.remove('on');r.querySelector('.chk').textContent='';});
    document.querySelectorAll('.grade-btn').forEach(b=>b.className='grade-btn');
    grade='';
  }

  function buildDayMap(){
    const map={};
    trades.forEach(t=>{
      if(!map[t.date]) map[t.date]={pnl:0,count:0};
      map[t.date].pnl+=t.pnl;
      map[t.date].count++;
    });
    return map;
  }

  function changeMonth(dir){
    calMonth+=dir;
    if(calMonth>11){calMonth=0;calYear++;}
    if(calMonth<0){calMonth=11;calYear--;}
    renderCalendar();
  }

  function renderCalendar(){
    document.getElementById('cal-month-label').textContent=MONTHS[calMonth];
    document.getElementById('cal-year-label').textContent=calYear;

    const dayMap=buildDayMap();
    const today=new Date();
    const firstDay=new Date(calYear,calMonth,1).getDay();
    const daysInMonth=new Date(calYear,calMonth+1,0).getDate();

    let html='';

    for(let d=1;d<=daysInMonth;d++){
      let gridStyle = d===1 && firstDay>0 ? ` style="grid-column-start:${firstDay+1}"` : '';
      const dateStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday=today.getFullYear()===calYear&&today.getMonth()===calMonth&&today.getDate()===d;
      const data=dayMap[dateStr];
      let cls='cal-day';
      if(isToday) cls+=' today';
      let inner=`<div class="cal-day-num">${d}</div>`;
      if(data){
        const p=data.pnl;
        if(p>0) cls+=' win-day';
        else if(p<0) cls+=' loss-day';
        else cls+=' flat-day';
        inner+=`<div class="cal-day-pnl">${(p>=0?'+':'')+'$'+Math.abs(p).toFixed(0)}</div>`;
        inner+=`<div class="cal-day-trades">${data.count} trade${data.count!==1?'s':''}</div>`;
      }
      html+=`<div class="${cls}"${gridStyle} onclick="openDayModal('${dateStr}')">${inner}</div>`;gridStyle='';
    }
    document.getElementById('cal-grid').innerHTML=html;
    renderWeekly();
  }

  function openDayModal(dateStr){
    const dayTrades = trades.filter(t => t.date === dateStr);
    const [year, month, day] = dateStr.split('-');
    document.getElementById('day-modal-title').textContent = `${MONTHS[parseInt(month)-1]} ${parseInt(day)}, ${year}`;
    document.getElementById('day-modal-list').innerHTML = dayTrades.length ? dayTrades.map(t => {
      const pc=t.pnl>0?'w':t.pnl<0?'l':'b';
      const ps=(t.pnl>=0?'+':'')+'$'+t.pnl.toFixed(2);
      const cc=t.pnl>0?'is-win':t.pnl<0?'is-loss':'';
      const paperTag = t.paperTrade ? '<span class="ttag ttag-paper">Paper</span>' : '';
      return `<div class="trade-card ${cc}" style="margin-bottom:10px;">
        <div class="tc-top">
          <div style="display:flex;align-items:center;gap:8px;"><span class="tc-ticker">${t.ticker}</span><span class="tc-dir ${t.direction==='CALL'?'call':'put'}">${t.direction}</span></div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="tc-pnl ${pc}">${ps}</span>
            <button class="edit-btn" onclick="openEditModal(${t.id})" title="Edit">✎</button>
          </div>
        </div>
        <div class="tc-meta">
          ${t.entryTime?`<div class="tc-meta-item"><div class="tc-meta-lbl">In</div><div class="tc-meta-val">${t.entryTime}</div></div>`:''}
          ${t.exitTime?`<div class="tc-meta-item"><div class="tc-meta-lbl">Out</div><div class="tc-meta-val">${t.exitTime}</div></div>`:''}
          <div class="tc-meta-item"><div class="tc-meta-lbl">Entry</div><div class="tc-meta-val">$${t.entry.toFixed(2)}</div></div>
          <div class="tc-meta-item"><div class="tc-meta-lbl">Exit</div><div class="tc-meta-val">$${t.exit.toFixed(2)}</div></div>
          <div class="tc-meta-item"><div class="tc-meta-lbl">Qty</div><div class="tc-meta-val">${t.contracts}x</div></div>
          ${t.grade?`<div class="tc-meta-item"><div class="tc-meta-lbl">Grade</div><div class="tc-meta-val">${t.grade}</div></div>`:''}
        </div>
        ${paperTag?`<div class="tc-tags">${paperTag}</div>`:''}
        ${t.what?`<div class="tc-notes"><strong>What happened:</strong> ${t.what}</div>`:''}
      </div>`;
    }).join('') : '<div class="empty" style="padding:24px 0;"><div class="empty-icon">🌸</div><div class="empty-title">No trades for this day</div><div class="empty-sub">Log a trade to see it here</div></div>';
    const modal = document.getElementById('day-modal');
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '16px';
  }

  function closeDayModal(){
    document.getElementById('day-modal').style.display = 'none';
  }

  document.getElementById('day-modal').addEventListener('click', function(e){
    if(e.target === this) closeDayModal();
  });

  function renderWeekly(){
    const dayMap=buildDayMap();
    const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
    const weeks=[];
    let week=[];
    for(let d=1;d<=daysInMonth;d++){
      const dateObj=new Date(calYear,calMonth,d);
      const dow=dateObj.getDay();
      if(dow===1&&week.length>0){weeks.push(week);week=[];}
      week.push({d,dateObj,dateStr:`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`});
    }
    if(week.length>0) weeks.push(week);

    if(!weeks.length){document.getElementById('week-cards').innerHTML=`<div class="empty" style="padding:30px 0;"><div class="empty-sub">No data for this month</div></div>`;return;}

    const html=weeks.map(wk=>{
      let weekPnl=0, winDays=0, lossDays=0, tradeDays=0;
      const dots=[];
      const tradingDays=wk.filter(day=>day.dateObj.getDay()>=1&&day.dateObj.getDay()<=5);
      tradingDays.forEach(day=>{
        const data=dayMap[day.dateStr];
        if(data){tradeDays++;weekPnl+=data.pnl;if(data.pnl>0){winDays++;dots.push('w');}else{lossDays++;dots.push('l');}}
        else{dots.push('n');}
      });
      const weekClass=weekPnl>0?'week-win':weekPnl<0?'week-loss':'week-flat';
      const pnlClass=weekPnl>0?'w':weekPnl<0?'l':'f';
      const firstDay=wk[0];
      const lastDay=wk[wk.length-1];
      const dateRange=`${MONTHS[calMonth].substring(0,3)} ${firstDay.d} – ${lastDay.d}`;
      const dotsHtml=dots.map(d=>`<div class="week-dot ${d}"></div>`).join('');
      return `<div class="week-card ${weekClass}">
        <div>
          <div class="week-label">Week of</div>
          <div class="week-dates">${dateRange}</div>
          <div class="week-days" style="margin-top:6px;">${dotsHtml}</div>
        </div>
        <div class="week-stats">
          <div class="week-stat"><div class="week-stat-label">Win Days</div><div class="week-stat-val w">${winDays}</div></div>
          <div class="week-stat"><div class="week-stat-label">Loss Days</div><div class="week-stat-val l">${lossDays}</div></div>
          <div class="week-stat"><div class="week-stat-label">Trades</div><div class="week-stat-val">${trades.filter(t=>{const d=new Date(t.date);return d.getFullYear()===calYear&&d.getMonth()===calMonth&&wk.some(w=>w.dateStr===t.date)}).length}</div></div>
          <div>
            <div class="week-stat-label" style="text-align:right;">Week P&L</div>
            <div class="week-pnl ${pnlClass}">${tradeDays===0?'—':(weekPnl>=0?'+':'')+'$'+Math.abs(weekPnl).toFixed(2)}</div>
          </div>
        </div>
      </div>`;
    }).join('');
    document.getElementById('week-cards').innerHTML=html||`<div class="empty" style="padding:30px 0;"><div class="empty-sub">Log trades to see weekly breakdown</div></div>`;
  }

  function renderHistory(){
    const list=document.getElementById('trade-list');
    document.getElementById('log-count').textContent=trades.length+' trade'+(trades.length!==1?'s':'')+' logged';
    if(!trades.length){list.innerHTML=`<div class="empty"><div class="empty-icon">🌸</div><div class="empty-title">No trades yet, bestie</div><div class="empty-sub">Head to Log Trade and add your first entry</div></div>`;return;}
    list.innerHTML=trades.map(t=>{
      const pc=t.pnl>0?'w':t.pnl<0?'l':'b';
      const ps=(t.pnl>=0?'+':'')+'$'+t.pnl.toFixed(2);
      const cc=t.pnl>0?'is-win':t.pnl<0?'is-loss':'';
      const eTags=(t.emotions||[]).map(e=>`<span class="ttag ttag-emotion">${e}</span>`).join('');
      const rTags=(t.rules||[]).slice(0,3).map(r=>`<span class="ttag ttag-rule">${r.substring(0,26)}</span>`).join('');
      const pTag=t.paperTrade?`<span class="ttag ttag-paper">Paper</span>`:'';
      const gc=t.grade==='A'?'A':t.grade==='B'?'B':'';
      const gTag=t.grade?`<span class="ttag ttag-grade ${gc}">Grade ${t.grade}</span>`:'';
      return `<div class="trade-card ${cc}">
        <div class="tc-top">
          <div style="display:flex;align-items:center;gap:8px;"><span class="tc-ticker">${t.ticker}</span><span class="tc-dir ${t.direction==='CALL'?'call':'put'}">${t.direction}</span></div>
          <div style="display:flex;align-items:center;gap:8px;"><span class="tc-pnl ${pc}">${ps}</span><button class="edit-btn" onclick="openEditModal(${t.id})" title="Edit">✎</button><button class="del-btn" onclick="delTrade(${t.id})">✕</button></div>
        </div>
        <div class="tc-meta">
          <div class="tc-meta-item"><div class="tc-meta-lbl">Date</div><div class="tc-meta-val">${t.date}</div></div>
          ${t.entryTime?`<div class="tc-meta-item"><div class="tc-meta-lbl">In</div><div class="tc-meta-val">${t.entryTime}</div></div>`:''}
          ${t.exitTime?`<div class="tc-meta-item"><div class="tc-meta-lbl">Out</div><div class="tc-meta-val">${t.exitTime}</div></div>`:''}
          ${t.strike?`<div class="tc-meta-item"><div class="tc-meta-lbl">Strike</div><div class="tc-meta-val">$${t.strike}</div></div>`:''}
          ${t.expiry?`<div class="tc-meta-item"><div class="tc-meta-lbl">Expiry</div><div class="tc-meta-val">${t.expiry}</div></div>`:''}
          <div class="tc-meta-item"><div class="tc-meta-lbl">Qty</div><div class="tc-meta-val">${t.contracts}x</div></div>
          <div class="tc-meta-item"><div class="tc-meta-lbl">Entry</div><div class="tc-meta-val">$${t.entry.toFixed(2)}</div></div>
          <div class="tc-meta-item"><div class="tc-meta-lbl">Exit</div><div class="tc-meta-val">$${t.exit.toFixed(2)}</div></div>
          ${t.setup&&(Array.isArray(t.setup)?t.setup.length:t.setup)?`<div class="tc-meta-item"><div class="tc-meta-lbl">Setup</div><div class="tc-meta-val">${Array.isArray(t.setup)?t.setup.join(', '):t.setup}</div></div>`:''}
        </div>
        ${gTag||rTags||eTags||pTag?`<div class="tc-tags">${gTag}${pTag}${rTags}${eTags}</div>`:''}
        ${t.what||t.lesson||t.diff?`<div class="tc-notes">${t.what?`<strong>What happened:</strong> ${t.what}<br>`:''} ${t.lesson?`<strong>Lesson:</strong> ${t.lesson}<br>`:''} ${t.diff?`<strong>Next time:</strong> ${t.diff}`:''}</div>`:''}
      </div>`;
    }).join('');
  }

  function renderStats(){
    const n=trades.length;
    const wins=trades.filter(t=>t.pnl>0);
    const losses=trades.filter(t=>t.pnl<0);
    const pnl=trades.reduce((s,t)=>s+t.pnl,0);
    const wr=n?Math.round(wins.length/n*100):null;
    const avgW=wins.length?(wins.reduce((s,t)=>s+t.pnl,0)/wins.length).toFixed(2):null;
    const avgL=losses.length?Math.abs(losses.reduce((s,t)=>s+t.pnl,0)/losses.length).toFixed(2):null;
    document.getElementById('s-total').textContent=n;
    const we=document.getElementById('s-wr');we.textContent=wr!==null?wr+'%':'—';we.className='stat-val '+(wr>=50?'win':wr>=40?'nude':'loss');
    const pe=document.getElementById('s-pnl');pe.textContent=(pnl>=0?'+':'')+'$'+pnl.toFixed(2);pe.className='stat-val '+(pnl>=0?'win':'loss');
    document.getElementById('s-wl-count').textContent=wins.length+' wins / '+losses.length+' losses';
    document.getElementById('s-avg').textContent=avgW&&avgL?`+$${avgW} / -$${avgL}`:'—';
    const gc={A:0,B:0,C:0,D:0,F:0};trades.forEach(t=>{if(t.grade)gc[t.grade]++;});
    const gmax=Math.max(...Object.values(gc),1);
    const gcols={A:'win',B:'pink',C:'nude',D:'loss',F:'loss'};
    document.getElementById('breakdown-grade').innerHTML=Object.entries(gc).map(([g,c])=>`<div class="bar-row"><div class="bar-lbl">Grade ${g}</div><div class="bar-track"><div class="bar-fill ${gcols[g]}" style="width:${c/gmax*100}%"></div></div><div class="bar-n">${c}</div></div>`).join('');
    const sc={};trades.forEach(t=>{const setups=Array.isArray(t.setup)?t.setup:(t.setup?[t.setup]:[]);setups.forEach(s=>{if(s)sc[s]=(sc[s]||0)+1;});});
    const ss=Object.entries(sc).sort((a,b)=>b[1]-a[1]);const smax=ss.length?ss[0][1]:1;
    document.getElementById('breakdown-setup').innerHTML=ss.length?ss.map(([s,c])=>`<div class="bar-row"><div class="bar-lbl">${s.substring(0,16)}</div><div class="bar-track"><div class="bar-fill pink" style="width:${c/smax*100}%"></div></div><div class="bar-n">${c}</div></div>`).join(''):'<div class="no-data">Log trades to see data</div>';
    const ec={};trades.forEach(t=>(t.emotions||[]).forEach(e=>{const k=e.replace(/[^\w\s]/gi,'').trim();ec[k]=(ec[k]||0)+1;}));
    const es=Object.entries(ec).sort((a,b)=>b[1]-a[1]).slice(0,6);const emax=es.length?es[0][1]:1;
    document.getElementById('breakdown-emotion').innerHTML=es.length?es.map(([e,c])=>`<div class="bar-row"><div class="bar-lbl">${e.substring(0,14)}</div><div class="bar-track"><div class="bar-fill nude" style="width:${c/emax*100}%"></div></div><div class="bar-n">${c}</div></div>`).join(''):'<div class="no-data">Log trades to see data</div>';
    const rc={};trades.forEach(t=>(t.rules||[]).forEach(r=>{rc[r]=(rc[r]||0)+1;}));
    const rs=Object.entries(rc).sort((a,b)=>b[1]-a[1]).slice(0,6);const rmax=rs.length?rs[0][1]:1;
    document.getElementById('breakdown-rules').innerHTML=rs.length?rs.map(([r,c])=>`<div class="bar-row"><div class="bar-lbl">${r.substring(0,16)}</div><div class="bar-track"><div class="bar-fill win" style="width:${c/rmax*100}%"></div></div><div class="bar-n">${c}</div></div>`).join(''):'<div class="no-data">Log trades to see data</div>';
  }

  function delTrade(id){if(!confirm('Delete this trade? 🌸'))return;trades=trades.filter(t=>t.id!==id);localStorage.setItem('tj_pink',JSON.stringify(trades));updateHeader();renderHistory();}
  function exportTrades(){
    if(!trades.length){alert('No trades to export yet 🌸');return;}
    const data=JSON.stringify(trades,null,2);
    const date=new Date().toISOString().slice(0,10);
    const filename='my-trades-backup-'+date+'.json';
    const blob=new Blob([data],{type:'application/json'});
    if(navigator.share && navigator.canShare){
      const file=new File([blob],filename,{type:'application/json'});
      if(navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:'Trade Journal Backup',text:'My trades backup — '+date})
          .catch(err=>{ if(err.name!=='AbortError') fallbackDownload(blob,filename); });
        return;
      }
    }
    fallbackDownload(blob,filename);
  }

  function fallbackDownload(blob,filename){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function importTrades(e){
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=function(ev){
      try{
        const imported=JSON.parse(ev.target.result);
        if(!Array.isArray(imported))throw new Error('Invalid format');
        const action=confirm('Found '+imported.length+' trades in this file 🌸\n\nClick OK to MERGE with existing trades.\nClick Cancel to REPLACE all trades with imported trades.');
        if(action===true){
          const existingIds=new Set(trades.map(t=>t.id));
          const newTrades=imported.filter(t=>!existingIds.has(t.id));
          trades=[...trades,...newTrades].sort((a,b)=>b.id-a.id);
          alert('✓ Merged! Added '+newTrades.length+' new trades. Total: '+trades.length+' 🌸');
        } else {
          if(!confirm('Are you sure you want to REPLACE all '+trades.length+' existing trades?'))return;
          trades=imported.sort((a,b)=>b.id-a.id);
          alert('✓ Replaced with '+trades.length+' imported trades 🌸');
        }
        localStorage.setItem('tj_pink',JSON.stringify(trades));
        updateHeader(); renderHistory();
      }catch(err){
        alert('Error reading file. Make sure it is a valid trades backup .json file 🌸');
      }
      e.target.value='';
    };
    reader.readAsText(file);
  }

  function clearAll(){if(!confirm('Delete ALL trades? This cannot be undone!'))return;trades=[];localStorage.setItem('tj_pink',JSON.stringify(trades));updateHeader();renderHistory();}

  function updateHeader(){
    const n=trades.length;const wins=trades.filter(t=>t.pnl>0).length;const pnl=trades.reduce((s,t)=>s+t.pnl,0);
    const wr=n?Math.round(wins/n*100)+'%':'—';
    document.getElementById('h-total').textContent=n;
    document.getElementById('h-wr').textContent=wr;
    document.getElementById('h-wr').className='hstat-value '+(n&&wins/n>=0.5?'win':n?'loss':'');
    document.getElementById('h-pnl').textContent=(pnl>=0?'+':'')+'$'+pnl.toFixed(2);
    document.getElementById('h-pnl').className='hstat-value '+(pnl>=0?'win':'loss');
  }

  const DEFAULT_RULES = [
    { label: "Waited for 15-min opening range to form",     key: "Waited for 15-min ORB to form" },
    { label: "Candle closed beyond level — not just a wick", key: "Candle closed beyond level (Break & Hold)" },
    { label: "Volume confirmed the breakout",               key: "Volume confirmed the breakout" },
    { label: "VWAP was aligned with my direction",          key: "VWAP aligned with direction" },
    { label: "RSI was not extreme at entry",                key: "RSI not overbought/oversold at entry" },
    { label: "Stop-loss was defined before entering",       key: "Stop-loss set before entering" },
    { label: "Profit target was defined before entering",   key: "Profit target defined before entering" },
    { label: "Max risk per trade respected",                key: "Max risk respected ($50–$100)" },
    { label: "This was NOT a revenge or FOMO trade",        key: "Not a revenge or FOMO trade" },
    { label: "Position closed within my trading window",    key: "Position closed within trading window" }
  ];

  let customRules = JSON.parse(localStorage.getItem('tj_pink_rules') || 'null');
  if(!customRules) customRules = DEFAULT_RULES.map(r=>({...r}));

  function renderRuleGrid(){
    const grid = document.getElementById('rule-grid-dynamic');
    if(!grid) return;
    grid.innerHTML = customRules.map(r=>`
      <div class="rule-item" onclick="toggleRule(this)" data-rule="${r.key}">
        <div class="chk"></div>${r.label}
      </div>`).join('');
    buildEditRuleGrid();
  }

  function openRulesModal(){
    const list = document.getElementById('rule-edit-list');
    list.innerHTML = customRules.map((r,i)=>`
      <div class="rule-edit-row" data-index="${i}">
        <input type="text" value="${r.label.replace(/"/g,'&quot;')}" placeholder="Rule description..." />
        <button class="rule-del-btn" onclick="removeRuleField(${i})" title="Remove">✕</button>
      </div>`).join('');
    document.getElementById('rules-modal').classList.add('open');
  }

  function closeRulesModal(){
    document.getElementById('rules-modal').classList.remove('open');
  }

  function addRuleField(){
    const list = document.getElementById('rule-edit-list');
    const idx = list.children.length;
    const row = document.createElement('div');
    row.className = 'rule-edit-row';
    row.dataset.index = idx;
    row.innerHTML = `<input type="text" placeholder="Type your rule..." /><button class="rule-del-btn" onclick="this.parentElement.remove()" title="Remove">✕</button>`;
    list.appendChild(row);
    row.querySelector('input').focus();
  }

  function removeRuleField(i){
    document.querySelectorAll('.rule-edit-row')[i]?.remove();
  }

  function saveRules(){
    const rows = document.querySelectorAll('.rule-edit-row input');
    const newRules = [];
    rows.forEach(input=>{
      const val = input.value.trim();
      if(val) newRules.push({ label: val, key: val });
    });
    if(!newRules.length){ alert('Add at least one rule 🌸'); return; }
    customRules = newRules;
    localStorage.setItem('tj_pink_rules', JSON.stringify(customRules));
    renderRuleGrid();
    closeRulesModal();
  }

  document.getElementById('rules-modal').addEventListener('click', function(e){
    if(e.target === this) closeRulesModal();
  });

  // EDIT TRADE
  let editingId = null;
  let editGrade = '';

  function buildEditRuleGrid(){
    const grid = document.getElementById('e-rule-grid');
    if(!grid) return;
    grid.innerHTML = customRules.map(r=>`
      <div class="rule-item" onclick="toggleRule(this)" data-rule="${r.key.replace(/"/g,'&quot;')}">
        <div class="chk"></div>${r.label}
      </div>`).join('');
  }

  function openEditModal(id){
    const t = trades.find(x=>x.id===id);
    if(!t) return;
    editingId = id;
    editGrade = t.grade||'';

    document.getElementById('e-date').value = t.date||'';
    document.getElementById('e-ticker').value = t.ticker||'';
    document.getElementById('e-direction').value = t.direction||'CALL';
    document.getElementById('e-strike').value = t.strike||'';
    document.getElementById('e-expiry').value = t.expiry||'';
    document.getElementById('e-contracts').value = t.contracts||1;
    if(document.getElementById('e-paper')) document.getElementById('e-paper').value = t.paperTrade ? 'yes' : 'no';
    document.getElementById('e-entry').value = t.entry||'';
    document.getElementById('e-exit').value = t.exit||'';
    document.getElementById('e-entry-time').value = t.entryTime||'';
    document.getElementById('e-exit-time').value = t.exitTime||'';
    document.getElementById('e-what').value = t.what||'';
    document.getElementById('e-lesson').value = t.lesson||'';
    document.getElementById('e-diff').value = t.diff||'';
    calcEditPnl();

    const setups = Array.isArray(t.setup) ? t.setup : (t.setup ? [t.setup] : []);
    document.querySelectorAll('#e-setup-grid .setup-pill').forEach(b=>{
      b.classList.toggle('on', setups.includes(b.textContent.trim()));
    });

    document.querySelectorAll('#e-emotion-grid .pill').forEach(b=>{
      b.classList.toggle('on', (t.emotions||[]).includes(b.textContent.trim()));
    });

    buildEditRuleGrid();
    document.querySelectorAll('#e-rule-grid .rule-item').forEach(r=>{
      const on = (t.rules||[]).includes(r.dataset.rule);
      r.classList.toggle('on', on);
      r.querySelector('.chk').textContent = on ? '✓' : '';
    });

    document.querySelectorAll('#e-grade-row .grade-btn').forEach(b=>b.className='grade-btn');
    if(t.grade){
      const gb = document.querySelector(`#e-grade-row .grade-btn[onclick*="'${t.grade}'"]`);
      if(gb) gb.classList.add('on-'+t.grade);
    }

    document.getElementById('edit-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function calcEditPnl(){
    const entry = parseFloat(document.getElementById('e-entry').value);
    const exit = parseFloat(document.getElementById('e-exit').value);
    const contracts = parseInt(document.getElementById('e-contracts').value)||1;
    const el = document.getElementById('e-pnl-calc');
    if(entry && exit){
      const pnl = (exit-entry)*100*contracts;
      el.value = (pnl>=0?'+':'')+'$'+pnl.toFixed(2);
      el.style.color = pnl>=0 ? 'var(--win)' : 'var(--loss)';
    } else { el.value=''; el.style.color=''; }
  }

  function pickEditGrade(btn,g){
    document.querySelectorAll('#e-grade-row .grade-btn').forEach(b=>b.className='grade-btn');
    btn.classList.add('on-'+g);
    editGrade = g;
  }

  function saveEditTrade(){
    const date = document.getElementById('e-date').value;
    const tick = document.getElementById('e-ticker').value.trim().toUpperCase();
    const dir = document.getElementById('e-direction').value;
    const entry = parseFloat(document.getElementById('e-entry').value);
    const exit = parseFloat(document.getElementById('e-exit').value);
    if(!date||!tick||!dir||!entry||!exit){ alert('Please fill in: Date, Ticker, Direction, Entry and Exit 🌸'); return; }
    const contracts = parseInt(document.getElementById('e-contracts').value)||1;
    const pnl = (exit-entry)*100*contracts;
    const setup = [...document.querySelectorAll('#e-setup-grid .setup-pill.on')].map(b=>b.textContent.trim());
    const emotions = [...document.querySelectorAll('#e-emotion-grid .pill.on')].map(b=>b.textContent.trim());
    const rules = [...document.querySelectorAll('#e-rule-grid .rule-item.on')].map(r=>r.dataset.rule);
    const idx = trades.findIndex(x=>x.id===editingId);
    if(idx===-1) return;
    const paperTrade = document.getElementById('e-paper')?.value === 'yes';
    trades[idx] = {...trades[idx], date, ticker:tick, direction:dir,
      strike:document.getElementById('e-strike').value,
      expiry:document.getElementById('e-expiry').value,
      contracts, entry, exit, pnl, paperTrade,
      entryTime:document.getElementById('e-entry-time').value,
      exitTime:document.getElementById('e-exit-time').value,
      setup, emotions, rules, grade:editGrade,
      what:document.getElementById('e-what').value,
      lesson:document.getElementById('e-lesson').value,
      diff:document.getElementById('e-diff').value
    };
    localStorage.setItem('tj_pink', JSON.stringify(trades));
    closeEditModal();
    updateHeader();
    renderHistory();
  }

  function closeEditModal(){
    document.getElementById('edit-modal').classList.remove('open');
    document.body.style.overflow = '';
    editingId = null; editGrade = '';
  }

  document.getElementById('edit-modal').addEventListener('click', function(e){
    if(e.target === this) closeEditModal();
  });

  renderRuleGrid();
  updateHeader();
  renderCalendar();
