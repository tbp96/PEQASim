const TP=[["sdLow","Noise sd, low effort",.05,"Larger = noisier signal.",.8],["sdMed","Noise sd, medium effort (grader B)",.05,"B's effort.",.5],["sdHigh","Noise sd, high effort",.05,"Smaller = more precise.",.3],
["alpha","Performance weight α",.5,"Scales PEQA's grading performance score.",4],["eps","Smoothing ε",.05,"Added to the probe residual sum so τ̂ is finite (only 2 probe observations).",.1],
["mu","Prior mean μ",.1,"Prior mean score (also the median's phantom report).",2.5],["sg","Prior weight √γ",.1,"Weight of the prior in PEQA's average.",2],
["w","Rival weight w",.1,"How much A loses when others score high (0 = not competitive; 1 = fully competitive).",1],
["lam","Cost of high effort (× PEQA's benefit)",.1,"0.5 means high effort costs half of what PEQA pays for it.",.5],["regrade","Regrading (1/0)",1,"1: C asks a regrade when her score is below the truth.",1]];
const $=id=>document.getElementById(id),OF=[-1,-.5,0,.5,1],SH=OF,PR=[];for(const a of OF)for(const b of OF)PR.push([a,b]);
const yP0=[2.5,3],yP1=[2,3],yN=[2.5,2],med3=(a,b,c)=>a+b+c-Math.min(a,b,c)-Math.max(a,b,c);
const val=()=>Object.fromEntries(TP.map(([k])=>[k,Number($("p_"+k).value)]));
function pp(sd){const p=OF.map(o=>Math.exp(-o*o/(2*sd*sd))),s=p.reduce((a,b)=>a+b);return PR.map(([a,b])=>p[OF.indexOf(a)]*p[OF.indexOf(b)]/s/s)}
function run(o,mech,ae,as,be,bs){const sdk=e=>o["sd"+e[0].toUpperCase()+e.slice(1)],pA=pp(sdk(ae)),pB=pp(sdk(be)),ex=new Float64Array(625),Wf=(r,y)=>o.regrade?-(Math.max(y-r,0)**2):-((r-y)**2);let nc=0,cp=0;
 for(let a1=0;a1<25;a1++){const e1=PR[a1],mA=(e1[0]+e1[1])/2,sA=1/Math.sqrt((e1[0]-mA)**2+(e1[1]-mA)**2+o.eps);
  for(let b0=0;b0<25;b0++){const f=PR[b0],mB=(f[0]+f[1])/2,sB=1/Math.sqrt((f[0]-mB)**2+(f[1]-mB)**2+o.eps);
   for(let a2=0;a2<25;a2++)for(let b2=0;b2<25;b2++){let tA=0,tB=0,gC=0;
    for(let q=0;q<2;q++){const y=yN[q];let r;
     if(mech==="PEQA"){const dA=y+PR[a2][q]-mA,dB=y+PR[b2][q]-mB;r=(o.sg*o.mu+sA*dA+sB*dB)/(o.sg+sA+sB);const W=Wf(r,y);
      tA+=o.alpha*(W-Wf((o.sg*o.mu+sB*dB)/(o.sg+sB),y));tB+=o.alpha*(W-Wf((o.sg*o.mu+sA*dA)/(o.sg+sA),y))}
     else{const rA=y+PR[a2][q]+as,rB=y+PR[b2][q]+bs;r=mech==="Median"?med3(rA,rB,o.mu):(rA+rB)/2}
     gC+=o.regrade?Math.max(r,y):r}
    const u0=5.5+tA,u1=u0-o.w/2*(5+tB+gC),p=pA[a1]*pA[a2]*pB[b0]*pB[b2];nc+=p*u0;cp+=p*u1;ex[b0*25+b2]+=pA[a1]*pA[a2]*u1}}}
 return{nc,cp,ex};}
function go(){const o=val(),M=["PEQA","Median","Mean"],E=["low","high"],T={};
 const gap=run(o,"PEQA","high",0,"Med",0).cp-run(o,"PEQA","low",0,"Med",0).cp,cost={low:0,high:o.lam*gap};
 for(const m of M){const R=E.map(e=>SH.map(s=>run(o,m,e,s,"Med",0)));for(const comp of[1,0])T[m+comp]=R.map((row,i)=>row.map(r=>(comp?r.cp:r.nc)-cost[E[i]]))}
 let h=`<p>PEQA benefit of high effort (competitive A): <b>${gap.toFixed(4)}</b> → cost of high effort = <b>${cost.high.toFixed(4)}</b>.</p>`;
 for(const comp of[1,0]){h+=`<h4>${comp?"Competitive A (rival weight w = "+o.w+")":"Non-competitive A"} – expected net utility; green = best response</h4>`;
  for(const m of M){const U=T[m+comp],mx=Math.max(...U.flat()),tr=Math.abs(U[1][2]-mx)<1e-9;
   h+=`<b>${m}</b> – truthful + high effort is a best response: <span class="${tr?"ok":"bad"}">${tr?"YES":"NO"}</span><table><tr><th></th>${SH.map(s=>`<th>shift ${s>0?"+":""}${s}</th>`).join("")}</tr>`+E.map((e,i)=>`<tr><th>${e} effort</th>`+U[i].map(v=>`<td class="${Math.abs(v-mx)<1e-9?"best":""}">${v.toFixed(4)}</td>`).join("")+"</tr>").join("")+"</table>"}}
 const pe=SH.map(s=>run(o,"PEQA","high",s,"Med",0).cp),epbi=Math.max(...pe)-Math.min(...pe),lo=run(o,"PEQA","low",0,"Med",0).ex,hi=run(o,"PEQA","high",0,"Med",0).ex;
 let ok=0,mg=1e9;for(let i=0;i<625;i++){if(hi[i]>=lo[i]-1e-12)ok++;mg=Math.min(mg,hi[i]-lo[i])}
 h+=`<h4>Property checks (PEQA)</h4><ul><li><b>EPBI</b>: max difference of expected utility across the 5 shifts = <b>${epbi.toExponential(2)}</b> (≈0 means bias is irrelevant).</li><li><b>Ex-post EPRM</b>: for <b>${ok}/625</b> report profiles of B, high effort gives A at least as much as low effort (smallest gain ${mg.toFixed(3)}).</li></ul><p class="why">Reading: under PEQA every shift gives the same utility and high effort is best whenever it costs less than PEQA's reward for it. Under Median/Mean a competitive A prefers the most negative shift and low effort; without competition the shifts tie but she still shirks, because nothing pays for precision.</p>`;
 $("out").innerHTML=h;}
function boot(){$("params").innerHTML=TP.map(([k,l,s,d])=>`<label>${l}<small>${d}</small><input id="p_${k}" type="number" step="${s}"></label>`).join("");
 const rs=()=>TP.forEach(([k,,,,v])=>$("p_"+k).value=v);rs();$("reset").onclick=rs;$("run").onclick=()=>{$("out").textContent="Computing…";setTimeout(()=>{try{go()}catch(e){$("msg").textContent=e.message}},30)};$("run").click()}
if(typeof document!=="undefined")boot();
