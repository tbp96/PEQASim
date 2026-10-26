// PEQA Lab UI + incentive experiments. Needs sim.js (engine) loaded first.
const PARAMS=[
["n","Students n",1,"Number of students; each is one paper and one grader."],
["K","Papers per grader K (even)",1,"Each grader gets K/2 probes + K/2 non-probes. More K = better bias/precision estimates (biggest lever)."],
["probes","Probe papers ℓ",1,"Papers graded by staff. Need K/2+1 ≤ ℓ ≤ n/(K/2+1). Mostly affects instructor workload."],
["mu","True-score mean μ",0.1,"Average true score."],["sdTrue","True-score sd",0.1,"Spread of true scores (prior used by PEQA/ML)."],
["noiseSd","Grader noise sd σ",0.05,"Average random error of a grader (σ=1/√τ). Larger = less precise."],
["noiseHet","Noise heterogeneity 0–1",0.05,"How different graders' precision is: σᵢ = σ·U[1−h,1+h]."],
["biasSd","Individual bias sd",0.05,"Each grader's own harshness/generosity."],
["biasShift","Common bias shift δ",0.1,"Added to every grader (a generous/harsh class)."],
["advFrac","Adversary fraction 0–1",0.05,"Share of graders who attack."],
["advType","Adversary type",["shift","zero","random"],"shift: bias = adversary shift; zero: always 0; random: uniform 0–10."],
["advShift","Adversary shift",0.5,"Bias used by 'shift' adversaries."],
["reps","Replications",1,"Random rounds averaged per point (more = smoother, slower)."],["seed","Random seed",1,"Same seed = same results."],
["alpha","Performance weight α",1,"Weight of the grading performance score t = α·Σ(W − W₍₋ᵢ₎). Higher α = more effort."],
["kappa","Effort cost κ",0.001,"Cost of reliability τ per paper: κτ²/2; a grader pays it on all K papers."],
["regrade","Regrading (1/0)",1,"1: a student asks a regrade when her score is below the truth, so g = max(r, y)."]];
const DEF={...DEFAULTS,alpha:10,kappa:0.01,regrade:1,n:40,K:8,probes:8,reps:30};
const $=id=>document.getElementById(id);
const CLR={"Mean":"#e03131","Median":"#f08c00","Joint LS":"#2f9e44","Joint ML (PG1)":"#c9a200","PEQA (ISWDM)":"#3b5bdb","PEQA-ERM weights":"#9c36b5","Mean/Median":"#e03131","PEQA":"#3b5bdb","45° line":"#888","Social utility":"#3b5bdb","Own effort cost":"#e03131","Expected score t":"#2f9e44","Net utility":"#3b5bdb"};
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length, logGrid=(a,b,m)=>Array.from({length:m},(_,i)=>a*Math.pow(b/a,i/(m-1)));

// ---------- chart ----------
function chart(cv,xs,series,xl,yl,title,vl=[],logx=false){const g=cv.getContext("2d"),W=cv.width,H=cv.height,L=64,R=175,T=34,B=46,ink=getComputedStyle(document.body).color;
 g.clearRect(0,0,W,H);g.font="12px system-ui";g.fillStyle=ink;g.fillText(title,L,18);
 const all=Object.values(series).flatMap(s=>s.ys).filter(isFinite);let y0=Math.min(...all),y1=Math.max(...all);if(y0===y1){y0-=1;y1+=1}const pad=(y1-y0)*.06;y0-=pad;y1+=pad;
 const f=logx?Math.log:(v=>v),xa=f(xs[0]),xb=f(xs[xs.length-1]),X=v=>L+(f(v)-xa)/((xb-xa)||1)*(W-L-R),Y=v=>H-B-(v-y0)/(y1-y0)*(H-T-B);
 g.globalAlpha=.25;g.strokeStyle=ink;for(let i=0;i<=5;i++){const v=y0+(y1-y0)*i/5;g.beginPath();g.moveTo(L,Y(v));g.lineTo(W-R,Y(v));g.stroke()}g.globalAlpha=1;
 for(let i=0;i<=5;i++){const v=y0+(y1-y0)*i/5;g.fillText(v.toFixed(2),6,Y(v)+4)}
 xs.forEach((x,i)=>{if(xs.length<=10||i%Math.ceil(xs.length/8)==0)g.fillText(+x.toFixed(2),X(x)-10,H-B+16)});
 g.fillText(xl,L+(W-L-R)/2-40,H-8);g.save();g.translate(14,H/2+30);g.rotate(-Math.PI/2);g.fillText(yl,0,0);g.restore();
 vl.forEach(v=>{g.strokeStyle=v.c;g.setLineDash([5,4]);g.beginPath();g.moveTo(X(v.x),T);g.lineTo(X(v.x),H-B);g.stroke();g.setLineDash([]);g.fillStyle=v.c;g.fillText(v.t,X(v.x)+3,T+10+vl.indexOf(v)*13)});
 Object.entries(series).forEach(([k,s],idx)=>{const c=CLR[k]||"#555";g.strokeStyle=g.fillStyle=c;g.lineWidth=2;g.beginPath();
  s.ys.forEach((v,i)=>i?g.lineTo(X(xs[i]),Y(v)):g.moveTo(X(xs[i]),Y(v)));g.stroke();s.ys.forEach((v,i)=>{g.beginPath();g.arc(X(xs[i]),Y(v),2.5,0,7);g.fill()});
  g.fillRect(W-R+10,T+idx*18,14,4);g.fillStyle=ink;g.fillText(k,W-R+30,T+idx*18+6)});}

// ---------- config ----------
function cfg(){const c={};for(const [k,,s] of PARAMS)c[k]=Array.isArray(s)?$("p_"+k).value:Number($("p_"+k).value);return c;}
const lim=c=>({lo:c.K/2+1,hi:Math.floor(c.n/(c.K/2+1))}), fit=(l,c)=>Math.min(Math.max(l,c.K/2+1),Math.floor(c.n/(c.K/2+1)));

// ---------- Tab 1 ----------
function roundView(c){const R=makeRound(c,rng(c.seed)),n=R.n,{b,t}=peqaEst(R),S={};RULE_NAMES.forEach(k=>S[k]=RULES[k](R));const m=Math.min(n,30);
 let h=`<h4>Assignment matrix (first ${m} graders × ${m} papers)</h4><div class="sc"><table><tr><th></th>`+Array.from({length:m},(_,j)=>`<th>${j+1}</th>`).join("")+"</tr>";
 for(let i=0;i<m;i++){h+=`<tr><th>${i+1}</th>`;for(let j=0;j<m;j++)h+=R.A[i*n+j]?`<td class="${R.isP[j]?"P":"N"}">${R.isP[j]?"P":"N"}</td>`:`<td>${i==j?"x":""}</td>`;h+="</tr>"}
 h+=`</table></div><h4>Graders: true vs estimated bias and reliability</h4><div class="sc"><table><tr><th>grader</th><th>probes</th><th>non-probes</th><th>true bias</th><th>b̂</th><th>true τ</th><th>τ̂</th></tr>`;
 for(let i=0;i<m;i++){let p=0,q=0;for(let j=0;j<n;j++)if(R.A[i*n+j])R.isP[j]?p++:q++;h+=`<tr><td>${i+1}${R.adv[i]?" ⚠":""}</td><td>${p}</td><td>${q}</td><td>${R.bias[i].toFixed(2)}</td><td>${b[i].toFixed(2)}</td><td>${R.tau[i].toFixed(2)}</td><td>${t[i].toFixed(2)}</td></tr>`}
 h+=`</table></div><h4>Final score of each paper under each mechanism</h4><div class="sc"><table><tr><th>paper</th><th>type</th><th>true</th>`+RULE_NAMES.map(k=>`<th>${k}</th>`).join("")+"</tr>";
 for(let j=0;j<m;j++)h+=`<tr><td>${j+1}</td><td class="${R.isP[j]?"P":"N"}">${R.isP[j]?"probe":"non-probe"}</td><td>${R.y[j].toFixed(2)}</td>`+RULE_NAMES.map(k=>`<td>${S[k][j].toFixed(2)}</td>`).join("")+"</tr>";
 const ev=evaluate(R);h+=`</table></div><h4>RMSE on non-probe papers (this round)</h4><table><tr>`+RULE_NAMES.map(k=>`<th>${k}</th>`).join("")+"</tr><tr>"+RULE_NAMES.map(k=>`<td>${ev[k].rmse.toFixed(3)}</td>`).join("")+"</tr></table>";
 h+=`<p class="why">Per paper graders: non-probe ≈ ${(n*c.K/2/(n-c.probes)).toFixed(1)}, probe ≈ ${(n*c.K/2/c.probes).toFixed(1)}. ⚠ = adversarial grader. With few probes per grader (K/2) b̂ and τ̂ are noisy; compare columns to see how well PEQA recovers the biases.</p>`;return h;}

// ---------- Tab 2 : sweeps ----------
const PRE={
bias:{t:"RMSE as individual bias grows",xl:"individual bias sd",xs:()=>[0,.25,.5,.75,1,1.5,2],mk:(c,x)=>({...c,biasSd:x}),w:"Mean and Median grow almost linearly with bias; rules that estimate biases (Joint LS, PEQA) stay flat. PEQA estimates b̂ from only K/2 probes, so it is close to, not better than, the joint estimator here."},
noise:{t:"RMSE as noise grows",xl:"noise sd σ",xs:()=>[.2,.4,.7,1,1.5,2,2.5],mk:(c,x)=>({...c,noiseSd:x}),w:"Everyone degrades with noise. Precision-weighting helps only modestly; PEQA's √τ̂ weights are a safe compromise (τ̂ weights amplify estimation noise)."},
shift:{t:"RMSE as a common bias shift grows",xl:"common shift δ",xs:()=>[0,.5,1,1.5,2,3],mk:(c,x)=>({...c,biasShift:x,biasSd:.3}),w:"If every grader is generous, Mean, Median and Joint LS are off by about δ (they cannot see it). PEQA is unaffected: probes fix the absolute scale."},
advS:{t:"Adversaries: shift attack (report y−5)",xl:"fraction of adversarial graders",xs:()=>[0,.05,.1,.2,.3,.4,.5],mk:(c,x)=>({...c,advFrac:x,advType:"shift",advShift:-5}),w:"Mean is pulled linearly; Median resists a small minority then breaks. PEQA subtracts the estimated bias and stays flat."},
advZ:{t:"Adversaries: always report 0",xl:"fraction of adversarial graders",xs:()=>[0,.05,.1,.2,.3,.4,.5],mk:(c,x)=>({...c,advFrac:x,advType:"zero"}),w:"Median is robust for a few adversaries (error ×1.1–1.4 at 5–10%) while Mean is not (×2–2.8). PEQA gives the useless reports tiny weight."},
advR:{t:"Adversaries: uniform random reports",xl:"fraction of adversarial graders",xs:()=>[0,.05,.1,.2,.3,.4,.5],mk:(c,x)=>({...c,advFrac:x,advType:"random"}),w:"A noise attack. Joint ML (not shown here) tends to do best; PEQA identifies noisy graders only from probes."},
L:{t:"Effect of the number of probes ℓ",xl:"probe papers ℓ",xs:c=>{const{lo,hi}=lim(c);return[...new Set(logGrid(lo,hi,6).map(Math.round))]},mk:(c,x)=>({...c,probes:x}),w:"Small effect: every grader still sees K/2 probes. More probes only slightly raise the graders per non-probe paper. Mostly a workload decision."},
K:{t:"Effect of papers per grader K",xl:"K",xs:()=>[4,6,8,10,12],mk:(c,x)=>({...c,K:x,probes:fit(c.probes,{...c,K:x})}),w:"The key design parameter: more probes per grader sharpen b̂, τ̂ and more graders see each paper. With K=4 PEQA is no better than simple rules."},
N:{t:"Effect of class size n (ℓ≈0.2n)",xl:"n",xs:()=>[30,40,60,100,160],mk:(c,x)=>{const d={...c,n:x};return{...d,probes:fit(Math.round(.2*x),d)}},w:"Roughly flat once ℓ/n is fixed: accuracy depends on graders per paper, not on class size."}};
function sweep(id){const p=PRE[id],c=cfg(),xs=p.xs(c),ys={};RULE_NAMES.forEach(k=>ys[k]={ys:[]});
 xs.forEach(x=>{const r=runExperiment(p.mk(c,x));RULE_NAMES.forEach(k=>ys[k].ys.push(r[k].rmse))});
 chart($("c1"),xs,ys,p.xl,"RMSE (non-probe papers)",p.t);$("accWhy").innerHTML="<b>What to look for:</b> "+p.w;
 $("accTab").innerHTML="<table><tr><th>"+p.xl+"</th>"+RULE_NAMES.map(k=>`<th>${k}</th>`).join("")+"</tr>"+xs.map((x,i)=>`<tr><td>${+x.toFixed(2)}</td>`+RULE_NAMES.map(k=>`<td>${ys[k].ys[i].toFixed(3)}</td>`).join("")+"</tr>").join("")+"</table>";}

// ---------- Tab 3 : incentives ----------
function pre(c,tauO,seed){const cc={...c,noiseSd:1/Math.sqrt(tauO),noiseHet:0,biasSd:0,biasShift:0,advFrac:0},r=rng(seed);return Array.from({length:c.reps},()=>makeRound(cc,r));}
function focal(R,f,tau,b,c){ // modify grader f: bias b, reliability tau (same noise draws); return t_f and graded-paper outcomes
 const n=R.n,Y=Float64Array.from(R.Y),sc=Math.sqrt(R.tau[f]/tau);
 for(let j=0;j<n;j++)if(R.A[f*n+j])Y[f*n+j]=R.y[j]+b+(R.Y[f*n+j]-R.y[j]-R.bias[f])*sc;
 const est=peqaEst({...R,Y}),sg=1/c.sdTrue,s=i=>Math.sqrt(est.t[i]),rg=c.regrade;let t=0,gP=0,gM=0,gA=0,m=0;
 for(let j=0;j<n;j++){if(!R.A[f*n+j]||R.isP[j])continue;let num=sg*c.mu,den=sg,v=[];
  for(const i of R.byPaper[j]){num+=s(i)*(Y[i*n+j]-est.b[i]);den+=s(i);v.push(Y[i*n+j])}
  const r=num/den,rl=(num-s(f)*(Y[f*n+j]-est.b[f]))/(den-s(f)),y=R.y[j],ye=rg&&r>=y?r:y,Wf=x=>-((x-ye)**2);
  t+=c.alpha*(Wf(r)-Wf(rl));gP+=rg?Math.max(r,y):r;const md=median(v),mn=mean(v);gM+=rg?Math.max(md,y):md;gA+=rg?Math.max(mn,y):mn;m++}
 return {t,gP:gP/m,gM:gM/m,gA:gA/m};}
const cost=(tau,c)=>c.K*c.kappa*tau*tau/2;
function tCurve(Rs,taus,b,c){return taus.map(x=>mean(Rs.map(R=>focal(R,0,x,b,c).t)))}
function epb(){const c=cfg(),Rs=pre(c,2,c.seed),G=logGrid(.25,25,24),S={};
 [-2,0,2].forEach(b=>S["b = "+b]={ys:tCurve(Rs,G,b,c)});CLR["b = -2"]="#e03131";CLR["b = 0"]="#3b5bdb";CLR["b = 2"]="#2f9e44";
 chart($("c2"),G,S,"own reliability τ (effort)","expected performance score t","EPRM: t rises with reliability (the three bias curves coincide = EPBI)",[],true);
 const B=Array.from({length:13},(_,i)=>-3+i*.5),T={};[.5,2,8].forEach(x=>{T["τ = "+x]={ys:B.map(b=>mean(Rs.map(R=>focal(R,0,x,b,c).t)))};CLR["τ = "+x]=x==.5?"#e03131":x==2?"#3b5bdb":"#2f9e44"});
 chart($("c3"),B,T,"own bias b","expected performance score t","EPBI: t is flat in the bias");
 $("incWhy").innerHTML="<b>What this shows (Theorem 1):</b> under PEQA a grader's expected reward does not depend on her bias (flat lines) and increases with her reliability, whatever the others do. Under Mean/Median the performance score is 0, so nothing rewards precision.";$("incTxt").innerHTML="";}
function eq(){const c=cfg(),G=logGrid(.25,25,24),O=[.5,1,1.5,2,3,4,6,8,12],br=O.map(o=>{const Rs=pre(c,o,c.seed),u=G.map((x,i)=>mean(Rs.map(R=>focal(R,0,x,0,c).t))-cost(x,c));return G[u.indexOf(Math.max(...u))]});
 let ne=NaN;for(let i=1;i<O.length;i++){const a=br[i-1]-O[i-1],b2=br[i]-O[i];if(a*b2<=0){ne=O[i-1]+(O[i]-O[i-1])*a/(a-b2);break}}
 chart($("c2"),O,{"PEQA":{ys:br},"Mean/Median":{ys:O.map(()=>G[0])},"45° line":{ys:O}},"effort of all other graders τ₋ᵢ","best-response effort τᵢ","Best-response curve (crossing with the 45° line = Nash equilibrium)",isNaN(ne)?[]:[{x:ne,c:"#3b5bdb",t:"NE "+ne.toFixed(2)}]);
 const sw=G.map(x=>{const Rs=pre(c,x,c.seed);return mean(Rs.map(R=>{const r=RULES["PEQA (ISWDM)"](R);let s=0;for(let j=0;j<R.n;j++)if(!R.isP[j]){const y=R.y[j],ye=c.regrade&&r[j]>=y?r[j]:y;s-=(r[j]-ye)**2}return c.alpha*s/R.n}))-cost(x,c)});
 const so=G[sw.indexOf(Math.max(...sw))],ref=isNaN(ne)?2:ne,Rs=pre(c,ref,c.seed),tt=tCurve(Rs,G,0,c);
 chart($("c3"),G,{"Expected score t":{ys:tt},"Own effort cost":{ys:G.map(x=>cost(x,c))},"Net utility":{ys:tt.map((v,i)=>v-cost(G[i],c))}},"own effort τ (others at equilibrium)","utility","One grader: score vs cost; the best response is the top of 'Net utility'",[],true);
 $("incWhy").innerHTML="<b>Reading:</b> a grader gains from precision (score t) with diminishing returns but pays a rising cost, so her best effort is interior. Under Mean/Median there is no score, so the best response is always the lowest effort. Equilibrium effort is where best response = others' effort.";
 $("incTxt").innerHTML=`<p><b>Symmetric Nash equilibrium ≈ ${ne.toFixed(2)}</b> · <b>social optimum (max of accuracy − cost per grader) ≈ ${so.toFixed(2)}</b>. ${Math.abs(ne-so)/so<.15?'<span class="ok">Close: private and social incentives agree (Theorem 3).</span>':'<span class="bad">Gap &gt; 15%: with regrading the mechanism reward is one-sided, and the search is noisy – try regrading = 0 or more replications.</span>'}</p>`;}
function comp(){const c=cfg(),Rs=pre(c,2,c.seed),B=Array.from({length:9},(_,i)=>-2+i*.5),tf=2,res={Median:[],Mean:[],PEQA:[]};
 B.forEach(b=>{const o=Rs.map(R=>focal(R,0,tf,b,c));res.Median.push(-mean(o.map(x=>x.gM)));res.Mean.push(-mean(o.map(x=>x.gA)));res.PEQA.push(mean(o.map(x=>x.t))-mean(o.map(x=>x.gP)))});
 const S={};for(const k in res){const z=res[k][4];S[k==="PEQA"?"PEQA":k]={ys:res[k].map(v=>v-z)}}
 chart($("c2"),B,S,"bias b (negative = grade aggressively)","utility gain vs truthful (b = 0)","Competitive grader (total rival weight 1 on the papers she grades), effort τ = 2");$("c3").getContext("2d").clearRect(0,0,880,380);
 $("incWhy").innerHTML="<b>Reading:</b> her utility is her performance score minus the average final score of the papers she grades. Under Mean/Median, shading down (b&lt;0) raises her utility, so truthful grading is <i>not</i> a best response. Under PEQA the line is flat: the de-biasing makes shading pointless.";$("incTxt").innerHTML="";}

// ---------- boot ----------
function guard(f){try{$("msg").textContent="";f()}catch(e){$("msg").textContent=e.message;console.error(e)}}
function boot(){$("params").innerHTML=PARAMS.map(([k,l,s,d])=>`<label>${l}<small>${d}</small>`+(Array.isArray(s)?`<select id="p_${k}">${s.map(o=>`<option>${o}</option>`).join("")}</select>`:`<input id="p_${k}" type="number" step="${s}">`)+"</label>").join("");
 const rs=()=>PARAMS.forEach(([k])=>$("p_"+k).value=DEF[k]);rs();$("reset").onclick=rs;
 $("presets").innerHTML=Object.entries(PRE).map(([k,p])=>`<button class="alt" data-k="${k}">${p.t}</button>`).join("");
 document.querySelectorAll("#presets button").forEach(b=>b.onclick=()=>guard(()=>sweep(b.dataset.k)));
 document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button,.pane").forEach(x=>x.classList.remove("on"));b.classList.add("on");$(b.dataset.t).classList.add("on")});
 $("goRound").onclick=()=>guard(()=>$("roundOut").innerHTML=roundView(cfg()));$("goEpbi").onclick=()=>guard(epb);$("goEq").onclick=()=>guard(eq);$("goComp").onclick=()=>guard(comp);$("goRound").click();}
if(typeof document!=="undefined")boot();
