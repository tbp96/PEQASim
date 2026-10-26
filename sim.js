// Peer-grading simulation engine (port of the Python notebook). No dependencies.
const DEFAULTS = { n:60, K:8, probes:12, mu:6, sdTrue:1.5, noiseSd:0.7, noiseHet:0.5, biasSd:0.5, biasShift:0,
  advFrac:0, advType:"shift", advShift:-5, reps:30, seed:2024 };
const RULE_NAMES=["Mean","Median","Joint LS","Joint ML (PG1)","PEQA (ISWDM)","PEQA-ERM weights"];

function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const randn=r=>Math.sqrt(-2*Math.log(1-r()))*Math.cos(2*Math.PI*r());
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function assign(n,K,L,r){
  const h=K/2;
  if(K%2||L<h+1||L>Math.floor(n/(h+1))) throw new Error(`Need K even and K/2+1 ≤ probes ≤ n/(K/2+1) (here ${h+1} ≤ probes ≤ ${Math.floor(n/(h+1))}).`);
  const idx=shuffle([...Array(n).keys()],r), probes=idx.slice(0,L), np=idx.slice(L);
  const isP=new Uint8Array(n); probes.forEach(i=>isP[i]=1);
  const A=new Uint8Array(n*n), load=new Float64Array(n);
  for(const i of shuffle([...Array(n).keys()],r)) for(const pool of [probes,np]){
    pool.filter(p=>p!==i).map(p=>[load[p],r(),p]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).slice(0,h)
      .forEach(([,,p])=>{A[i*n+p]=1;load[p]++;});
  }
  return {A,isP};
}

function makeRound(c,r){
  const n=c.n, y=Array.from({length:n},()=>c.mu+c.sdTrue*randn(r));
  const {A,isP}=assign(n,c.K,c.probes,r);
  const tau=[],bias=[];
  for(let i=0;i<n;i++){const s=c.noiseSd*(1-c.noiseHet+2*c.noiseHet*r());tau.push(1/(s*s));bias.push(c.biasShift+c.biasSd*randn(r));}
  const adv=new Uint8Array(n), k=Math.round(c.advFrac*n);
  shuffle([...Array(n).keys()],r).slice(0,k).forEach(i=>{adv[i]=1;if(c.advType==="shift")bias[i]=c.advShift;});
  const Y=new Float64Array(n*n).fill(NaN);
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(A[i*n+j]){
    let v=y[j]+bias[i]+randn(r)/Math.sqrt(tau[i]);
    if(adv[i]&&c.advType==="zero")v=0; if(adv[i]&&c.advType==="random")v=10*r();
    Y[i*n+j]=v;}
  const byPaper=Array.from({length:n},(_,j)=>{const g=[];for(let i=0;i<n;i++)if(A[i*n+j])g.push(i);return g;});
  return {c,n,y,A,isP,Y,byPaper,bias,tau,adv};
}

var median=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};

function peqaEst(R){ // probe-based bias / reliability estimates
  const {n,A,isP,Y,y}=R, b=new Float64Array(n), t=new Float64Array(n);
  for(let i=0;i<n;i++){const e=[];for(let j=0;j<n;j++)if(A[i*n+j]&&isP[j])e.push(Y[i*n+j]-y[j]);
    const m=e.reduce((a,x)=>a+x,0)/e.length, ss=e.reduce((a,x)=>a+(x-m)**2,0);
    b[i]=m; t[i]=Math.min(1e3,Math.max(1e-2,(e.length-1)/Math.max(ss,1e-12)));}
  return {b,t};
}

const RULES={
  "Mean":R=>R.byPaper.map((g,j)=>g.reduce((a,i)=>a+R.Y[i*R.n+j],0)/g.length),
  "Median":R=>R.byPaper.map((g,j)=>median(g.map(i=>R.Y[i*R.n+j]))),
  "Joint LS":R=>{const {n,byPaper:bp,Y}=R,b=new Float64Array(n);let yh=[];
    const byGrader=Array.from({length:n},(_,i)=>{const p=[];for(let j=0;j<n;j++)if(R.A[i*n+j])p.push(j);return p;});
    for(let it=0;it<100;it++){
      yh=bp.map((g,j)=>g.reduce((a,i)=>a+Y[i*n+j]-b[i],0)/g.length);
      for(let i=0;i<n;i++)b[i]=byGrader[i].reduce((a,j)=>a+Y[i*n+j]-yh[j],0)/byGrader[i].length;
      const m=b.reduce((a,x)=>a+x,0)/n;for(let i=0;i<n;i++)b[i]-=m;}
    return bp.map((g,j)=>g.reduce((a,i)=>a+Y[i*n+j]-b[i],0)/g.length);},
  "Joint ML (PG1)":R=>{const {n,byPaper:bp,Y,c}=R,g=1/c.sdTrue**2,b=new Float64Array(n),tau=new Float64Array(n).fill(1);
    const byG=Array.from({length:n},(_,i)=>{const p=[];for(let j=0;j<n;j++)if(R.A[i*n+j])p.push(j);return p;});
    const upd=()=>bp.map((gr,j)=>{let num=g*c.mu,den=g;for(const i of gr){num+=tau[i]*(Y[i*n+j]-b[i]);den+=tau[i];}return num/den;});
    for(let it=0;it<100;it++){const yh=upd();for(let i=0;i<n;i++){const P=byG[i];let s=0,ss=0;
      for(const j of P)s+=Y[i*n+j]-yh[j];b[i]=tau[i]*s/(1+P.length*tau[i]);   // prior precision eta0=1
      for(const j of P)ss+=(Y[i*n+j]-yh[j]-b[i])**2;tau[i]=Math.min(1e3,Math.max(1e-2,(1+P.length/2)/(1+0.5*ss)));}}   // Gamma(2,1) prior
    return upd();},
  "PEQA (ISWDM)":R=>peqa(R,0.5),
  "PEQA-ERM weights":R=>peqa(R,1)
};
function peqa(R,p){const {b,t}=peqaEst(R),g=(1/R.c.sdTrue**2)**p;
  return R.byPaper.map((gr,j)=>{if(R.isP[j])return R.y[j];let num=g*R.c.mu,den=g;
    for(const i of gr){const w=t[i]**p;num+=w*(R.Y[i*R.n+j]-b[i]);den+=w;}return num/den;});}

function evaluate(R){const out={};
  for(const name of RULE_NAMES){const r=RULES[name](R);let s2=0,s=0,m=0;
    for(let j=0;j<R.n;j++)if(!R.isP[j]){const e=r[j]-R.y[j];s2+=e*e;s+=e;m++;}
    out[name]={rmse:Math.sqrt(s2/m),me:s/m};}
  return out;}

function runExperiment(c){ // mean ± s.e. over reps
  const r=rng(c.seed),acc={};RULE_NAMES.forEach(k=>acc[k]={rm:[],me:[]});
  for(let q=0;q<c.reps;q++){const ev=evaluate(makeRound(c,r));RULE_NAMES.forEach(k=>{acc[k].rm.push(ev[k].rmse);acc[k].me.push(ev[k].me);});}
  const st=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length,v=a.reduce((x,y)=>x+(y-m)**2,0)/Math.max(a.length-1,1);return[m,Math.sqrt(v/a.length)];};
  const res={};RULE_NAMES.forEach(k=>{const [m,se]=st(acc[k].rm);res[k]={rmse:m,se,me:st(acc[k].me)[0]};});return res;}

if(typeof module!=="undefined")module.exports={DEFAULTS,RULE_NAMES,runExperiment};
