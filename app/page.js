
"use client";
import { useState } from "react";

export default function Page(){
  const [tab, setTab] = useState("home");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:"", carrier:"KT", phoneFee:69000, dataUsage:11,
    ott:{netflix:false, youtube:false, disney:false, wavve:false, tving:false},
    ottFee:{netflix:17000, youtube:14900, disney:9900, wavve:13900, tving:13900},
    loanAmount:30000000, loanRate:4.8
  });
  const [result, setResult] = useState(null);

  const calc = () => {
    let total=0, details=[];
    if(form.carrier!=="알뜰폰" && form.phoneFee>30000){
      const target = form.dataUsage<=15?19900:29700;
      const save = form.phoneFee-target;
      if(save>0){ total+=save; details.push({cat:"통신", title:`${form.carrier} ${form.phoneFee.toLocaleString()}원 → 알뜰폰 ${target.toLocaleString()}원`, save});}
    }
    Object.keys(form.ott).forEach(k=>{ if(form.ott[k]){ const fee=form.ottFee[k]; total+=fee; details.push({cat:"구독", title:`${k.toUpperCase()} ${fee.toLocaleString()}원 정리`, save:fee}); }});
    if(form.loanAmount>=5000000 && form.loanRate>3.5){
      const monthlySave=Math.round(form.loanAmount*(form.loanRate-3.2)/100/12);
      if(monthlySave>0){ total+=monthlySave; details.push({cat:"대출", title:`신용대출 ${form.loanRate}% → 3.2% 대환`, save:monthlySave});}
    }
    return {total, details};
  };

  const handleFinal = async () => {
    const {total, details}=calc();
    try{ await fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,total,details})}); }catch(e){}
    setResult({total,details});
    setTab("saving");
  };

  return (
    <main className="min-h-screen bg-white pb-[88px] md:pb-0">
      <div className="max-w-[480px] md:max-w-6xl mx-auto px-5 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm">F</div><span className="font-black tracking-tight">FIXCUT</span><span className="ml-2 text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">APP</span></div>
          <div className="text-[11px] text-black/40">{tab.toUpperCase()}</div>
        </div>

        {tab==="home" && (
          <div className="mt-8">
            <div className="bg-black text-white rounded-[28px] p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600 rounded-full blur-[40px] opacity-60"></div>
              <div className="relative">
                <div className="text-white/60 text-[12px] font-bold tracking-widest">FIXCUT APP</div>
                <h1 className="text-[30px] font-black leading-[1.1] mt-3">매달 새는<br/>고정비 67만원,<br/><span className="text-violet-400">19.4만원 찾아드려요</span></h1>
                <p className="text-white/60 text-[13px] mt-4">3분 진단 → 원클릭 실행 → 매달 자동 절약</p>
                <button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-6 bg-white text-black rounded-full px-6 py-3.5 font-black text-[15px] w-full md:w-auto">무료 진단 시작하기 →</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-50 border border-black/5 rounded-2xl p-4 text-center"><div className="text-[20px]">📱</div><div className="text-[12px] font-bold mt-1">통신비<br/>-52,000원</div></div>
              <div className="bg-gray-50 border border-black/5 rounded-2xl p-4 text-center"><div className="text-[20px]">🎬</div><div className="text-[12px] font-bold mt-1">구독료<br/>-27,000원</div></div>
              <div className="bg-gray-50 border border-black/5 rounded-2xl p-4 text-center"><div className="text-[20px]">🏦</div><div className="text-[12px] font-bold mt-1">대출이자<br/>-89,000원</div></div>
            </div>
            <div className="mt-6 bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
              <div className="text-[13px] font-bold">🔥 실시간 절약 현황</div>
              <div className="mt-3 space-y-2 text-[13px]"><div className="flex justify-between"><span className="text-black/60">박**님 KT → 알뜰폰</span><span className="text-emerald-600 font-bold">-38,000원</span></div><div className="flex justify-between"><span className="text-black/60">김**님 대출 대환 완료</span><span className="text-emerald-600 font-bold">-112,000원</span></div><div className="flex justify-between"><span className="text-black/60">이**님 구독 3개 정리</span><span className="text-emerald-600 font-bold">-41,000원</span></div></div>
            </div>
          </div>
        )}

        {tab==="diag" && (
          <div className="mt-6">
            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-black transition-all" style={{width:`${step*25}%`}}></div></div>
            {step===1 && (<div className="mt-8"><h2 className="text-[26px] font-black">이름이 뭐예요?</h2><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="박현용" className="mt-6 w-full bg-gray-50 border border-black/5 rounded-2xl px-6 py-5 text-[18px] outline-none"/><button onClick={()=>form.name.trim()&&setStep(2)} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button></div>)}
            {step===2 && (<div className="mt-8"><h2 className="text-[26px] font-black">핸드폰 요금제</h2><div className="mt-6 space-y-4"><div className="grid grid-cols-4 gap-2">{["SKT","KT","LGU+","알뜰폰"].map(c=><button key={c} onClick={()=>setForm({...form,carrier:c})} className={`py-3 rounded-xl border font-bold text-[14px] ${form.carrier===c?"bg-black text-white":"bg-white border-black/10"}`}>{c}</button>)}</div><input type="number" value={form.phoneFee} onChange={e=>setForm({...form,phoneFee:Number(e.target.value)})} placeholder="월 요금" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><div className="flex items-center gap-3"><span className="text-[13px]">데이터 {form.dataUsage}GB</span><input type="range" min={1} max={100} value={form.dataUsage} onChange={e=>setForm({...form,dataUsage:Number(e.target.value)})} className="flex-1"/></div></div><button onClick={()=>setStep(3)} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button></div>)}
            {step===3 && (<div className="mt-8"><h2 className="text-[26px] font-black">OTT 구독</h2><div className="mt-6 space-y-2">{[{k:"netflix",n:"넷플릭스",f:17000},{k:"youtube",n:"유튜브 프리미엄",f:14900},{k:"disney",n:"디즈니+",f:9900},{k:"tving",n:"티빙",f:13900},{k:"wavve",n:"웨이브",f:13900}].map(o=><label key={o.k} className={`flex justify-between items-center p-4 rounded-2xl border ${form.ott[o.k]?"bg-violet-50 border-violet-200":"bg-gray-50 border-black/5"}`}><div className="flex items-center gap-3"><input type="checkbox" checked={form.ott[o.k]} onChange={e=>setForm({...form,ott:{...form.ott,[o.k]:e.target.checked}})} className="w-5 h-5"/><span className="font-bold text-[14px]">{o.n}</span></div><span className="text-[12px] text-black/50">{o.f.toLocaleString()}원</span></label>)}</div><button onClick={()=>setStep(4)} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button></div>)}
            {step===4 && (<div className="mt-8"><h2 className="text-[26px] font-black">대출</h2><div className="mt-6 space-y-4"><input type="number" value={form.loanAmount} onChange={e=>setForm({...form,loanAmount:Number(e.target.value)})} placeholder="대출 잔액" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><input type="number" step="0.1" value={form.loanRate} onChange={e=>setForm({...form,loanRate:Number(e.target.value)})} placeholder="현재 금리 %" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/></div><button onClick={handleFinal} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">결과 보기 →</button></div>)}
          </div>
        )}

        {tab==="saving" && (
          <div className="mt-6">
            {!result ? (
              <div className="text-center py-20"><div className="text-[48px]">💸</div><div className="font-bold mt-4">아직 진단 결과가 없어요</div><div className="text-[13px] text-black/50 mt-1">진단을 먼저 진행해주세요</div><button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-6 bg-black text-white rounded-full px-8 py-3 font-bold">진단하기 →</button></div>
            ):(
              <div>
                <h2 className="text-[26px] font-black">🎉 {form.name}님,<br/><span className="text-violet-600">월 {result.total.toLocaleString()}원 절약!</span></h2>
                <div className="mt-6 space-y-3">{result.details.map((d,i)=><div key={i} className="bg-white border border-black/5 rounded-2xl p-4 flex justify-between items-center"><div><div className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full w-fit font-bold mb-1">{d.cat}</div><div className="font-bold text-[14px]">{d.title}</div></div><div className="text-violet-600 font-black">-{d.save.toLocaleString()}원</div></div>)}</div>
                <div className="mt-6 bg-black text-white rounded-[24px] p-6"><div className="text-white/60 text-[12px]">총 절약</div><div className="text-[32px] font-black">월 {result.total.toLocaleString()}원</div><div className="text-white/60 text-[13px]">연 {(result.total*12).toLocaleString()}원 · 실제 신청은 해당 앱에서 진행</div></div>
              </div>
            )}
          </div>
        )}

        {tab==="my" && (
          <div className="mt-8">
            <div className="flex items-center gap-4"><div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white font-black text-[20px]">{form.name?form.name[0]:"P"}</div><div><div className="font-black text-[18px]">{form.name||"박현용"}님</div><div className="text-[13px] text-black/50">{form.carrier} · {form.phoneFee.toLocaleString()}원 사용중</div></div></div>
            <div className="mt-8 space-y-3">
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between"><span className="text-[14px]">통신사</span><span className="font-bold text-[14px]">{form.carrier}</span></div>
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between"><span className="text-[14px]">데이터</span><span className="font-bold text-[14px]">{form.dataUsage}GB</span></div>
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between"><span className="text-[14px]">OTT {Object.keys(form.ott).filter(k=>form.ott[k]).length}개</span><span className="font-bold text-[14px]">{Object.keys(form.ott).filter(k=>form.ott[k]).map(k=>k.toUpperCase()).join(", ")||"없음"}</span></div>
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between"><span className="text-[14px]">대출</span><span className="font-bold text-[14px]">{form.loanAmount.toLocaleString()}원 · {form.loanRate}%</span></div>
            </div>
            <button onClick={()=>{setForm({name:"",carrier:"KT",phoneFee:69000,dataUsage:11,ott:{netflix:false,youtube:false,disney:false,wavve:false,tving:false},ottFee:{netflix:17000,youtube:14900,disney:9900,wavve:13900,tving:13900},loanAmount:30000000,loanRate:4.8}); setResult(null); setTab("home");}} className="mt-8 w-full border border-black/10 rounded-full py-3.5 font-bold text-[14px]">정보 초기화</button>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar - Real App Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/[0.06] z-50">
        <div className="max-w-[480px] md:max-w-6xl mx-auto px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          <div className="grid grid-cols-4">
            {[
              {id:"home", icon:"🏠", label:"홈"},
              {id:"diag", icon:"🔍", label:"진단"},
              {id:"saving", icon:"💰", label:"절약내역"},
              {id:"my", icon:"👤", label:"내정보"},
            ].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} className={`flex flex-col items-center py-1.5 rounded-2xl transition ${tab===t.id?"text-black":"text-black/30"}`}>
                <span className={`text-[20px] ${tab===t.id?"scale-110":""}`}>{t.icon}</span>
                <span className={`text-[10px] mt-1 font-bold ${tab===t.id?"text-black":"text-black/40"}`}>{t.label}</span>
                {tab===t.id && <div className="w-1 h-1 bg-black rounded-full mt-1"></div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
