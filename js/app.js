
// ─── 기본 네비게이션 ───
let obIdx=0;
function nextOb(){obIdx++;document.getElementById('ob-slides').style.transform=`translateX(-${obIdx*100}vw)`;}
function go(id){ if(id==='home') location.href='index.html'; else location.href=id+'.html'; }
function nav(btn){btn.closest('.nav').querySelectorAll('.ni').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
function ltab(tab,m){document.querySelectorAll('.lt').forEach(t=>t.classList.remove('on'));tab.classList.add('on');document.getElementById('freeTab').style.display=m==='free'?'block':'none';document.getElementById('premTab').style.display=m==='prem'?'block':'none';}
function cFilter(tab){document.querySelectorAll('.ctab').forEach(t=>t.classList.remove('on'));tab.classList.add('on');}
function dTab(tab,mode){document.querySelectorAll('.dtab').forEach(t=>t.classList.remove('on'));tab.classList.add('on');}

// toast
function toast(msg){const t=document.getElementById('uToast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
function shareGarden(){toast('잔디 링크가 클립보드에 복사됐어요! 📋');}

// isometric item tooltip
function isoTip(e, name, desc){
  e.stopPropagation();
  const tip = document.getElementById('isoTip');
  tip.innerHTML = `<span style="color:var(--grn);font-weight:700">${name}</span><br><span style="color:var(--tx2);font-size:11px">${desc}</span>`;
  const wrap = document.querySelector('.iso-wrap');
  const wRect = wrap.getBoundingClientRect();
  let cx = e.clientX - wRect.left;
  let cy = e.clientY - wRect.top;
  tip.classList.remove('show');
  tip.style.left = '0px'; tip.style.top = '0px';
  requestAnimationFrame(() => {
    const tw = tip.offsetWidth || 160;
    const th = tip.offsetHeight || 44;
    tip.style.left = Math.min(cx, wRect.width - tw - 8) + 'px';
    tip.style.top = Math.max(cy - th - 12, 4) + 'px';
    tip.classList.add('show');
    clearTimeout(tip._t);
    tip._t = setTimeout(() => tip.classList.remove('show'), 2000);
  });
}

// ─── Activity Garden 잔디 생성 ───
function buildGarden(){
  const g=document.getElementById('gardenGrid');
  if(!g||g.children.length>0)return;
  const WEEKS=52,DAYS=7,total=WEEKS*DAYS;
  // 시드 랜덤 — 재현 가능한 패턴
  const seed=data=>{ let h=5381; for(let c of data+''){h=((h<<5)+h)+c.charCodeAt(0)|0;} return h; };
  for(let i=0;i<total;i++){
    const daysAgo=total-1-i;
    let lvl=0;
    if(daysAgo<7)lvl=Math.abs(seed(i*7))%2===0?4:3;
    else if(daysAgo<43){const r=Math.abs(seed(i*3))%10;lvl=r>6?3:r>3?2:r>0?1:0;}
    else{lvl=Math.abs(seed(i))%12===0?1:0;}
    const el=document.createElement('div');
    el.className=`gc l${lvl}`;
    const dateStr=`D-${daysAgo}`;
    const xp=[0,12,35,68,110][lvl];
    el.setAttribute('data-tip',daysAgo===0?`오늘 · ${xp} XP`:`${dateStr} · ${xp||0} XP · ${lvl>0?'직무적성+영어 학습 완료':'학습 없음'}`);
    el.addEventListener('click',function(e){
      const tip=document.getElementById('gTip');
      tip.innerHTML=`<strong>${this.dataset.tip}</strong>`;
      tip.style.display='block';
      const r=this.getBoundingClientRect();
      tip.style.left=Math.min(r.left,window.innerWidth-230)+'px';
      tip.style.top=(r.bottom+6)+'px';
      setTimeout(()=>tip.style.display='none',1800);
    });
    g.appendChild(el);
  }
}

// ─── ENGLISH STORY 5단계 ───
const STORY={
  label:'📧 비즈니스 이메일',
  title:'Rescheduling a Client Meeting',
  text:`Alex is a junior analyst at a Seoul investment bank. His manager, Ms. Park, asks him to <span class="hl-word" onclick="wPop('reschedule','to arrange for a different time')">reschedule</span> an important client meeting from Tuesday to Thursday. The client, Mr. Kim, is a key <span class="hl-word" onclick="wPop('investor','a person who puts money into a business to gain profit')">investor</span>. Alex must write a <span class="hl-word" onclick="wPop('professional','polite, skilled, and appropriate for work')">professional</span> and <span class="hl-word" onclick="wPop('concise','brief and clear, using few words')">concise</span> email.`,
  vocabQ:[
    {word:'reschedule',defs:['to arrange for a different time','to cancel permanently','to send a payment','to ignore a deadline'],ans:0},
    {word:'concise',defs:['very long and detailed','brief and clear','loud and emotional','uncertain and vague'],ans:1},
  ],
  blankQ:{
    sent:'I am writing to _____ our meeting originally scheduled for Tuesday.',
    opts:['reschedule','cancel','approve','confirm'],
    ans:0,
    exp:'reschedule은 "다른 시간으로 일정을 변경한다"는 의미로, 이 문맥에서 가장 적합한 표현입니다.'
  },
  listenSent:'I am writing to reschedule our meeting to Thursday.',
  listenWords:['writing','reschedule','am','to','our','I','meeting','to','Thursday'],
  speakSent:'I hope this new time works for you.',
  writeSit:'Mr. Kim replied and confirmed the new Thursday meeting. Write a short thank-you reply to him. (Use 10 or more words)',
};

let esStep=0,vSelW=null,vSelD=null,vMatched=0;
let arrangeAns=[],wbWords=[];
let micRec=false;

function wPop(w,d){toast(`${w}: ${d}`);}
function startEng(){esStep=0;vSelW=null;vSelD=null;vMatched=0;arrangeAns=[];go('eng');renderStep();}

function renderStep(){
  const pct=(esStep/5)*100;
  document.getElementById('engPb').style.width=pct+'%';
  document.getElementById('engSl').textContent=`STEP ${esStep+1} / 5`;
  const dots=document.querySelectorAll('.step-dot');
  dots.forEach((d,i)=>{d.className='step-dot'+(i===esStep?' on':(i<esStep?' dn':''));});
  const body=document.getElementById('engBody');
  const cta=document.getElementById('engCta');
  cta.disabled=false;
  cta.textContent=esStep<4?'다음 ›':'🎉 세션 완료';
  cta.onclick=engNext;

  if(esStep===0){
    // STEP 1: 읽기
    body.innerHTML=`
      <div class="story-card">
        <p class="story-label">${STORY.label}</p>
        <p class="story-title">${STORY.title}</p>
        <p class="story-text">${STORY.text}</p>
      </div>
      <p style="text-align:center;font-size:12px;color:var(--tx3);padding:8px 20px">초록 단어를 탭하면 뜻을 볼 수 있어요</p>`;
  }
  else if(esStep===1){
    // STEP 2: 어휘 (매칭 + 빈칸)
    const q=STORY.vocabQ;
    const shuffled=[...q[1].defs].sort(()=>Math.random()-.5);
    body.innerHTML=`
      <p class="vocab-hint">단어와 알맞은 뜻을 탭하여 연결하세요</p>
      <div class="vocab-area">
        ${q.map((item,i)=>`
          <div class="v-row">
            <div class="v-w" id="vw${i}" onclick="vPickW(${i})">${item.word}</div>
            <span class="v-arr">→</span>
            <div class="v-d" id="vd${i}" onclick="vPickD(${i})">${shuffled[i]}</div>
          </div>`).join('')}
      </div>
      <div style="margin:14px 20px 0;height:1px;background:var(--b1)"></div>
      <div style="padding:12px 20px 0">
        <p style="font-size:12px;color:var(--tx2);margin-bottom:10px;text-align:center">또는 문장의 빈칸을 채우세요</p>
        <div class="blank-sent">${STORY.blankQ.sent.replace('_____','<span class="blank" id="blankFill">_____</span>')}</div>
        <div class="blank-opts" id="blankOpts">
          ${STORY.blankQ.opts.map((o,i)=>`<div class="blank-opt" onclick="pickBlank(this,${i})">${o}</div>`).join('')}
        </div>
      </div>`;
    cta.disabled=true;
    vMatched=0;vSelW=null;vSelD=null;
  }
  else if(esStep===2){
    // STEP 3: 듣기 (단어 배열)
    wbWords=[...STORY.listenWords].sort(()=>Math.random()-.5);
    arrangeAns=[];
    body.innerHTML=`
      <p style="font-size:13px;font-weight:700;text-align:center;padding:6px 20px 4px;color:var(--tx2)">문장을 듣고 올바른 어순으로 배열하세요</p>
      <button class="play-btn" onclick="playAudio()">🔊 문장 듣기</button>
      <button class="play-btn slow" style="display:block;margin:0 auto 10px" onclick="playAudio('slow')">🐢 느리게 듣기 (0.75×)</button>
      <p style="font-size:11px;color:var(--tx3);padding:0 20px 6px">완성 문장:</p>
      <div class="slots" id="slots"></div>
      <p style="font-size:11px;color:var(--tx3);padding:0 20px 5px">단어 카드:</p>
      <div class="wbank" id="wbank">
        ${wbWords.map((w,i)=>`<div class="wc" id="wb${i}" onclick="placeWord('${w}',${i})">${w}</div>`).join('')}
      </div>`;
    cta.disabled=true;
  }
  else if(esStep===3){
    // STEP 4: 말하기
    body.innerHTML=`
      <p style="font-size:13px;font-weight:700;text-align:center;padding:8px 20px 5px">문장을 듣고 똑같이 따라 말하세요</p>
      <div class="speak-txt">"${STORY.speakSent}"</div>
      <button class="play-btn" onclick="playAudio()" style="margin-top:8px">🔊 다시 듣기</button>
      <div class="mic-area">
        <div class="mic-btn" id="micBtn" onclick="toggleMic()">🎤</div>
        <p class="mic-score" id="micScore">마이크 버튼을 눌러 따라 말하세요</p>
        <p class="skip-txt" onclick="skipSpeak()">지금은 말하기 어려운 환경이에요 → 건너뛰기</p>
      </div>`;
    cta.disabled=true;
  }
  else if(esStep===4){
    // STEP 5: 쓰기
    body.innerHTML=`
      <div class="write-sit">
        <p class="ws-lbl">✍️ 상황</p>
        <p class="ws-txt">${STORY.writeSit}</p>
      </div>
      <div class="write-box">
        <textarea id="writeTA" placeholder="여기에 영어 문장을 작성하세요..." oninput="wCount(this)" rows="4"></textarea>
      </div>
      <p class="wc-count" id="wcnt">0 / 10단어 이상 작성</p>
      <div class="write-fb" id="writeFb">
        <p class="wfb-t">✅ AI 채점 결과</p>
        <p class="wfb-b" id="wfbBody"></p>
      </div>`;
    cta.disabled=true;
    cta.textContent='AI 채점하기';
    cta.onclick=checkWrite;
  }
}

function engNext(){
  if(esStep>=4){
    document.getElementById('compEm').textContent='📖';
    document.getElementById('compT').textContent='영어 세션 완료!';
    document.getElementById('compS').textContent='스토리 5단계를 모두 완주했어요';
    document.getElementById('xpBonusLbl').textContent='스토리 완주 보너스';
    document.getElementById('xpBonusVal').textContent='+25 XP';
    go('complete');return;
  }
  esStep++;renderStep();
  document.getElementById('engBody').scrollTop=0;
}

function playAudio(mode){
  const spd=mode==='slow'?'느린 속도(0.75×)':'';
  toast(`🔊 ${spd} "${STORY.listenSent}"\n(실서비스: TTS/MP3 재생)`);
}

// vocab matching
let vSelWIdx=null,vSelDIdx=null,blankDone=false;
function vPickW(i){
  vSelWIdx=i;
  document.querySelectorAll('.v-w').forEach(e=>e.classList.remove('sel'));
  document.getElementById('vw'+i).classList.add('sel');
  checkVMatch();
}
function vPickD(i){
  vSelDIdx=i;
  document.querySelectorAll('.v-d').forEach(e=>e.classList.remove('sel'));
  document.getElementById('vd'+i).classList.add('sel');
  checkVMatch();
}
function checkVMatch(){
  if(vSelWIdx===null||vSelDIdx===null)return;
  // 데모: 항상 매칭 성공
  document.getElementById('vw'+vSelWIdx).classList.replace('sel','ok');
  document.getElementById('vd'+vSelDIdx).classList.replace('sel','ok');
  vMatched++;vSelWIdx=null;vSelDIdx=null;
  if(vMatched>=STORY.vocabQ.length&&blankDone)document.getElementById('engCta').disabled=false;
}

function pickBlank(el,idx){
  document.querySelectorAll('.blank-opt').forEach(e=>e.classList.remove('sel','ok','ng'));
  if(idx===STORY.blankQ.ans){
    el.classList.add('ok');
    document.getElementById('blankFill').textContent=STORY.blankQ.opts[idx];
    blankDone=true;
    if(vMatched>=STORY.vocabQ.length)document.getElementById('engCta').disabled=false;
    else{blankDone=true;if(vMatched>=STORY.vocabQ.length)document.getElementById('engCta').disabled=false;}
    // simplify: enable if blank done
    blankDone=true;
    if(vMatched>0||blankDone)document.getElementById('engCta').disabled=false;
  } else {
    el.classList.add('ng');el.classList.add('sel');
    setTimeout(()=>el.classList.remove('ng','sel'),600);
  }
}

// word arrange
function placeWord(w,i){
  arrangeAns.push({w,i});
  document.getElementById('wb'+i).classList.add('used');
  const slots=document.getElementById('slots');
  const s=document.createElement('div');
  s.className='slot';s.textContent=w;
  s.onclick=()=>{
    arrangeAns=arrangeAns.filter(x=>x.i!==i);
    document.getElementById('wb'+i).classList.remove('used');
    s.remove();
    if(arrangeAns.length<5)document.getElementById('engCta').disabled=true;
  };
  slots.appendChild(s);
  if(arrangeAns.length>=7)document.getElementById('engCta').disabled=false;
}

// mic
function toggleMic(){
  if(micRec){micRec=false;return;}
  micRec=true;
  const btn=document.getElementById('micBtn');
  btn.classList.add('rec');
  document.getElementById('micScore').textContent='🔴 녹음 중...';
  setTimeout(()=>{
    micRec=false;btn.classList.remove('rec');
    const sc=65+Math.floor(Math.random()*30);
    const ms=document.getElementById('micScore');
    if(sc>=80){ms.innerHTML=`발음 일치율 <strong>${sc}%</strong> — 훌륭해요! 🎉`;}
    else if(sc>=60){ms.innerHTML=`발음 일치율 <strong>${sc}%</strong> — 거의 다 됐어요!`;}
    else{ms.innerHTML=`발음 일치율 <strong>${sc}%</strong> — 한 번 더 시도해보세요`;}
    document.getElementById('engCta').disabled=false;
  },2400);
}
function skipSpeak(){document.getElementById('micScore').textContent='건너뛰기 선택 — XP 일부 감소';document.getElementById('engCta').disabled=false;}

// writing
function wCount(ta){
  const n=ta.value.trim().split(/\s+/).filter(w=>w).length;
  const el=document.getElementById('wcnt');
  el.textContent=`${n} / 10단어 이상 작성`;
  el.className='wc-count'+(n>=10?' ok':'');
}
function checkWrite(){
  const ta=document.getElementById('writeTA');
  const n=ta.value.trim().split(/\s+/).filter(w=>w).length;
  if(n<10){toast('10단어 이상 작성해주세요!');return;}
  const fb=document.getElementById('writeFb');
  fb.classList.add('on');
  document.getElementById('wfbBody').textContent=`${n}단어 문장을 확인했어요.\n핵심 표현 포함 여부: ✓\n문법 자연스러움: 4/5점\n\n💡 개선 포인트: "Thank you for your confirmation." 같은 감사 표현을 앞에 쓰면 더 자연스러운 비즈니스 이메일이 됩니다.`;
  const cta=document.getElementById('engCta');
  cta.disabled=false;cta.textContent='🎉 세션 완료';cta.onclick=engNext;
}

// ─── QUIZ 직무적성 3과목 ───
const QS={
  lan:[
    {type:'명제 추론',q:'다음 조건을 모두 만족할 때, 반드시 참인 것은?',pass:'• A가 참석하면 B도 참석한다.\n• C가 참석하면 D는 참석하지 않는다.\n• B가 참석하지 않으면 C가 참석한다.\n• D가 참석하지 않으면 E가 참석한다.',opts:['A→E 불참','B참→D참','A참→E참','C참→B참','D참→A참'],ans:2,exp:'A→B→(B불참이면C)의 대우 적용: A→B→C→D불참→E참. ③이 항상 참.'},
    {type:'어휘 유추',q:'다음 단어 쌍의 관계가 나머지와 다른 하나는?',pass:'① 의사:환자  ② 교사:학생  ③ 부모:자녀  ④ 변호사:피의자  ⑤ 하늘:구름',opts:['①','②','③','④','⑤'],ans:4,exp:'①②③④는 모두 사람-사람 관계(전문직-대상)이지만, ⑤는 자연물-자연물 관계입니다.'},
    {type:'독해 추론',q:'다음 글의 주제로 가장 알맞은 것은?',pass:'"ESG 경영은 단순한 비용이 아닌 장기적 기업 가치를 높이는 전략이다. 환경·사회·지배구조를 고려한 기업은 투자자 신뢰와 소비자 충성도를 동시에 확보한다."',opts:['ESG 비용 절감 방법','ESG 경영의 전략적 가치','기업의 환경 오염 사례','소비자 충성도 하락 이유','투자자 유치 단기 전략'],ans:1,exp:'지문은 ESG 경영이 비용이 아닌 장기 가치 창출 전략임을 주장합니다.'},
  ],
  num:[
    {type:'자료 해석',q:'2023년 전년 대비 성장률이 가장 높은 부문은?',pass:'• A부문: 2022년 200억 → 2023년 260억\n• B부문: 2022년 150억 → 2023년 180억\n• C부문: 2022년 300억 → 2023년 345억\n• D부문: 2022년 80억 → 2023년 112억',opts:['A (30%)','B (20%)','C (15%)','D (40%)','모두 동일'],ans:3,exp:'D: (112-80)/80×100=40%로 가장 높습니다.'},
    {type:'수 추리',q:'다음 수열의 빈칸에 알맞은 수는?',pass:'3, 9, 27, 81, ___',opts:['162','243','189','324','270'],ans:1,exp:'3을 곱하는 등비수열: 81×3=243.'},
    {type:'응용 계산',q:'8명이 40시간에 완성하는 작업을 5명이 하면 몇 시간 걸리나?',pass:'',opts:['52시간','60시간','64시간','68시간','72시간'],ans:2,exp:'총 작업량 = 8×40=320 맨시간. 5명으로 320÷5=64시간.'},
  ],
  rea:[
    {type:'도형 패턴',q:'다음 수열의 물음표(?)에 알맞은 수는?',pass:'2, 6, 18, 54, ?',opts:['108','162','144','216','180'],ans:1,exp:'×3 등비수열: 54×3=162.'},
    {type:'규칙 추리',q:'다음 배열의 빈칸에 들어갈 수는?  1, 4, 9, 16, 25, ___',pass:'',opts:['30','36','42','49','35'],ans:1,exp:'1²=1, 2²=4, 3²=9, 4²=16, 5²=25, 6²=36. 제곱수 수열입니다.'},
    {type:'조건 추리',q:'5개 팀이 A~E를 리그전으로 경기할 때 총 경기 수는?',pass:'※ 리그전: 모든 팀이 서로 한 번씩 대결',opts:['8경기','10경기','12경기','15경기','20경기'],ans:1,exp:'C(5,2)=5×4÷2=10경기.'},
  ],
};
const SUBJINFO={lan:{label:'🔤 언어 (Language)',cls:'lan'},num:{label:'🔢 수리 (Numeracy)',cls:'num'},rea:{label:'🔀 추리 (Reasoning)',cls:'rea'}};

let curSubj='lan',curQ=0,selOpt=null,isCorr=false,answered=false;

function startQuiz(subj='lan'){curSubj=subj;curQ=0;selOpt=null;answered=false;
  ['h1','h2','h3'].forEach(id=>document.getElementById(id).className='ht');
  updateSubjTabs();loadQ();go('quiz');}

function pickSubj(s){curSubj=s;curQ=0;selOpt=null;answered=false;
  ['h1','h2','h3'].forEach(id=>document.getElementById(id).className='ht');
  updateSubjTabs();loadQ();}

function updateSubjTabs(){
  document.querySelectorAll('.q-stab').forEach(t=>{
    t.className='q-stab '+t.getAttribute('onclick').match(/'(\w+)'/)[1];
  });
  document.querySelector(`.q-stab.${curSubj}`).classList.add('on');
  const pf=document.getElementById('qpf');
  pf.className=`qpf ${curSubj}`;
  document.getElementById('qsub').className=`qsub ${curSubj}`;
}

function loadQ(){
  const qs=QS[curSubj];const q=qs[curQ];const si=SUBJINFO[curSubj];
  document.getElementById('qBadge').innerHTML=`${si.label} · 문제 <span id="qN">${curQ+1}</span>/${qs.length}`;
  document.getElementById('qType').textContent=q.type;
  document.getElementById('qType').className=`q-type ${curSubj}`;
  document.getElementById('qTxt').textContent=q.q;
  const pass=document.getElementById('qPass');
  if(q.pass){pass.style.display='block';pass.innerHTML=q.pass.replace(/\n/g,'<br>');}
  else{pass.style.display='none';}
  const nums=['①','②','③','④','⑤'];
  document.getElementById('qOpts').innerHTML=q.opts.map((o,i)=>
    `<button class="opt" onclick="pickOpt(this,${i===q.ans})"><span class="onum">${nums[i]}</span>${o}</button>`
  ).join('');
  document.getElementById('rb').className='rbanner';
  const sb=document.getElementById('qsub');sb.disabled=true;sb.textContent='확인';sb.onclick=submitQ;
  document.getElementById('qpf').style.width=((curQ+1)/qs.length*100)+'%';
  answered=false;selOpt=null;
}

function pickOpt(btn,corr){
  if(answered)return;
  document.querySelectorAll('.opt').forEach(b=>b.classList.remove('sel','lan','num','rea'));
  btn.classList.add('sel',curSubj);
  selOpt=btn;isCorr=corr;
  document.getElementById('qsub').disabled=false;
}

function submitQ(){
  if(!selOpt||answered)return;answered=true;
  const q=QS[curSubj][curQ];const rb=document.getElementById('rb');
  if(isCorr){selOpt.classList.replace('sel','correct');rb.className='rbanner ok';document.getElementById('rb-t').textContent='✅ 정답입니다!';}
  else{
    selOpt.classList.replace('sel','wrong');
    document.querySelectorAll('.opt').forEach((b,i)=>{if(i===q.ans)b.classList.add('correct');});
    rb.className='rbanner ng';document.getElementById('rb-t').textContent='❌ 틀렸습니다';
    const lost=document.querySelectorAll('.ht.lost').length;
    if(lost<3)document.getElementById(['h3','h2','h1'][lost]).className='ht lost';
  }
  document.getElementById('rb-b').textContent=q.exp;
  const sb=document.getElementById('qsub');
  sb.textContent=curQ<QS[curSubj].length-1?'다음 문제 →':'결과 보기';sb.onclick=nextQ;
}

function nextQ(){
  curQ++;
  if(curQ>=QS[curSubj].length){
    const si=SUBJINFO[curSubj];
    document.getElementById('compEm').textContent='🎉';
    document.getElementById('compT').textContent=si.label.split(' ')[1]+' 세션 완료!';
    document.getElementById('compS').textContent=`${QS[curSubj].length}문제를 모두 풀었어요`;
    document.getElementById('xpBonusLbl').textContent='정확도 보너스';
    document.getElementById('xpBonusVal').textContent='+15 XP';
    go('complete');return;
  }
  loadQ();document.getElementById('qsub').onclick=submitQ;
}

// ─── 초기화 ───
window.addEventListener('load',()=>{buildGarden();});
