/* ========= Master Edition v5.2 — GitHub-ready =========
 * - TOC อัตโนมัติ
 * - Lazy-load Canvas กราฟทีวีสไตล์
 * - โค้ชโหมด (เปิด/ปิดคำอธิบายเชิงลึก)
 * - ปุ่ม Print → PDF
 */

// --------- สารบัญอัตโนมัติ ---------
const tocList = document.querySelector('#toc-list');
const headers = [...document.querySelectorAll('main h1, main h2')];
headers.forEach((h, idx)=>{
  const id = h.textContent.trim().toLowerCase()
    .replace(/[^a-z0-9ก-๙\s\-]/gi,'').replace(/\s+/g,'-') + '-' + idx;
  h.id = id;
  const li = document.createElement('li');
  li.innerHTML = `<a href="#${id}">${h.tagName==='H1'?'— ':''}${h.textContent}</a>`;
  tocList.appendChild(li);
});

// --------- ปุ่มพิมพ์ ---------
document.getElementById('printBtn')?.addEventListener('click', ()=> window.print());

// --------- Chart Engine (TV-like) ---------
class TVChart {
  constructor(canvas){
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width; this.h = canvas.height;
    this.pad = 36; this.gridY = 5;
    this.theme = {
      bg:'#0b0f14', grid:'#1b232c', axis:'#374151',
      bull:'#32d296', bear:'#ff6b6b', wick:'#cbd5e1',
      box:'#2a3440', label:'#cfe1ff'
    };
  }
  drawGrid(){
    const {ctx,w,h,pad,theme,gridY} = this;
    ctx.fillStyle = theme.bg; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = theme.grid; ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0;i<=gridY;i++){
      const y = pad + (h-2*pad)*i/gridY;
      ctx.moveTo(pad,y); ctx.lineTo(w-pad,y);
    }
    ctx.stroke();
  }
  scale(data){
    const highs = data.map(d=>d.h), lows = data.map(d=>d.l);
    const max = Math.max(...highs), min = Math.min(...lows);
    const px = (v)=> this.pad + (this.h-2*this.pad)*(1-(v-min)/(max-min+1e-9));
    const tx = (i)=> this.pad + (this.w-2*this.pad)*i/(data.length-1);
    return {px,tx,min,max};
  }
  candle(data){
    const {ctx,theme} = this, {px,tx} = this.scale(data);
    const w = Math.max(2, (this.w-2*this.pad)/data.length*0.6);
    data.forEach((d,i)=>{
      const x = tx(i); const o=px(d.o), c=px(d.c), hi=px(d.h), lo=px(d.l);
      // wick
      ctx.strokeStyle = theme.wick; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x,hi); ctx.lineTo(x,lo); ctx.stroke();
      // body
      const up = d.c>=d.o; ctx.fillStyle = up?theme.bull:theme.bear;
      const y = Math.min(o,c), h = Math.max(2, Math.abs(o-c));
      ctx.fillRect(x-w/2, y, w, h);
    });
  }
  label(text, x, y){
    const {ctx,theme} = this;
    ctx.fillStyle = theme.label; ctx.font = '12px system-ui';
    ctx.fillText(text, x, y);
  }
  box(x1,y1,x2,y2){
    const {ctx,theme}=this;
    ctx.fillStyle = 'rgba(121,184,255,.10)';
    ctx.strokeStyle = theme.box; ctx.lineWidth=1;
    ctx.fillRect(x1,y1,x2-x1,y2-y1); ctx.strokeRect(x1,y1,x2-x1,y2-y1);
  }
  line(x1,y1,x2,y2,color='#79b8ff',dash=[4,4]){
    const {ctx}=this;
    ctx.save(); ctx.strokeStyle=color; ctx.setLineDash(dash); ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore();
  }
}

// --------- ชุดข้อมูลเทียม (สมจริงพอสำหรับคู่มือ) ---------
function genSeries(n=120, start=100){
  const out=[]; let prev=start;
  for(let i=0;i<n;i++){
    const drift = (Math.random()-.5)*1.8;
    const o = prev + (Math.random()-.5)*0.7;
    const c = o + drift + (Math.random()-.3);
    const h = Math.max(o,c) + Math.random()*1.2 + .2;
    const l = Math.min(o,c) - Math.random()*1.2 - .2;
    out.push({o:+o.toFixed(2), h:+h.toFixed(2), l:+l.toFixed(2), c:+c.toFixed(2)});
    prev = c;
  }
  return out;
}
const datasets = {
  'structure-basic': genSeries(120,100),
  'liq-map': genSeries(120,102),
  'pd-zones': genSeries(120,98),
  'exe1-left': genSeries(80,100),
  'exe1-right': genSeries(80,102),
  'exe2-left': genSeries(80,99),
  'exe2-right': genSeries(80,101),
  'tf4h-a': genSeries(90,100),
  'tf4h-b': genSeries(90,101),
  'tf1h': genSeries(120,100),
  'tf15m-a': genSeries(90,100),
  'tf15m-b': genSeries(90,100),
  'tf5m-a': genSeries(90,100),
  'tf5m-b': genSeries(90,101),
  'tf1m': genSeries(140,100),
  'pat1': genSeries(70,100),
  'pat2': genSeries(70,101)
};

// --------- Overlay helpers (ตัวอย่าง) ---------
function drawFVG50(chart, data, i0, i1){
  const {px,tx} = chart.scale(data);
  const yTop = px(Math.max(data[i0].o, data[i0].c));
  const yBot = px(Math.min(data[i1].o, data[i1].c));
  const mid = yBot + (yTop - yBot)*0.5;
  chart.box(tx(i0), mid-8, tx(i1), mid+8);
  chart.label('FVG 50%', tx(i0)+6, mid-10);
}
function drawBOS(chart, data, idx){
  const {px,tx} = chart.scale(data);
  const y = px(data[idx].h);
  chart.line(tx(idx-6), y, tx(idx+6), y, '#32d296', [6,3]);
  chart.label('BOS', tx(idx)-10, y-6);
}
function drawEQL(chart, data, idx, len=10){
  const {px,tx} = chart.scale(data); const y = px(data[idx].l);
  chart.line(tx(idx-len), y, tx(idx+len), y, '#ffd166', [4,4]);
  chart.label('EQL', tx(idx)-14, y-8);
}

// --------- Lazy render เมื่อเลื่อนถึง ---------
const onVisible = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const cv = entry.target; const key = cv.dataset.chart;
    const data = datasets[key] || genSeries(100,100);
    const ch = new TVChart(cv);
    ch.drawGrid(); ch.candle(data);
    // ตัวอย่าง annotation ต่อกราฟ
    if(key==='structure-basic'){ drawBOS(ch,data,60); drawFVG50(ch,data,68,75); }
    if(key==='liq-map'){ drawEQL(ch,data,30); drawBOS(ch,data,80); }
    if(key==='pd-zones'){ drawFVG50(ch,data,50,60); }
    if(key==='exe1-left'){ drawBOS(ch,data,30); drawFVG50(ch,data,40,48); }
    if(key==='exe1-right'){ drawFVG50(ch,data,42,50); }
    if(key==='tf15m-b'){ drawEQL(ch,data,20); }
    if(key==='pat1'){ drawEQL(ch,data,20); }
    if(key==='pat2'){ drawBOS(ch,data,35); }
    onVisible.unobserve(cv);
  });
},{rootMargin:"160px"});

document.querySelectorAll('canvas.chart').forEach(c=>onVisible.observe(c));

// --------- Coach Mode toggle ---------
document.querySelectorAll('.coach-toggle input[type="checkbox"]').forEach(cb=>{
  const panel = document.querySelector(`.coach-panel[data-coach="${cb.id}"]`);
  if(!panel) return;
  const sync = ()=> panel.classList.toggle('show', cb.checked);
  cb.addEventListener('change', sync); sync();
});

/* ===== หมายเหตุสำหรับใส่กราฟจริงจาก TradingView =====
1) ใส่รูปจริง: <img class="chart" src="assets/your_tv_chart.png" alt="...">
2) หรือเปลี่ยน datasets.* ให้เป็น OHLC จริง (JSON) แล้วเรียกแทน key เดิม
*/
