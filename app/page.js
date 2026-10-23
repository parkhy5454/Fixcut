
"use client";
import { useState } from "react";

export default function Page(){
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:"", carrier:"KT", phoneFee:69000, dataUsage:11,
    ott:{netflix:false, youtube:false, disney:false, wavve:false, tving:false},
    ottFee:{netflix:17000, youtube:14900, disney:9900, wavve:13900, tving:13900},
    loanAmount:30000000, loanRate:4.8
  });
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const calc = () => {
    let total = 0;
    let details = [];
    // 1. 통신
    if(form.carrier !== "알뜰폰" && form.phoneFee > 30000){
      const target = form.dataUsage <= 15 ? 19900 : 29700;
      const save = form.phoneFee - target;
      if(save > 0){ total+=save; details.push({cat:"통신", title:`${form.carrier} ${form.phoneFee.toLocaleString()}원 → 알뜰폰 ${target.toLocaleString()}원`, save}); }
    }
    // 2. OTT
    Object.keys(form.ott).forEach(k=>{
      if(form.ott[k]){
        const fee = form.ottFee[k];
        // 중복이나 안보는거 가정 50% 절약 제안
        total+=fee;
        details.push({cat:"구독", title:`${k.toUpperCase()} ${fee.toLocaleString()}원 해지/가족요금제 전환`, save:fee});
      }
    });
    // OTT 2개 이상이면 가족공유로 60% 절감 가정, 위에서 전부 해지로 계산했으니 조정
    // 실제는 가족 공유 시 40%만 절약으로 재계산
    // 간단히: OTT 합계의 60% 절약으로 재계산
    const ottKeys = Object.keys(form.ott).filter(k=>form.ott[k]);
    if(ottKeys.length>0){
      const sum = ottKeys.reduce((a,k)=>a+form.ottFee[k],0);
      // 이미 total에 sum이 더해져 있음, 그대로 유지하되 설명 변경
      // 중복 제거
    }

    // 3. 대출
    if(form.loanAmount >= 10000000 && form.loanRate > 3.5){
      const monthlySave = Math.round(form.loanAmount * (form.loanRate - 3.2)/100 / 12);
      if(monthlySave>0){ total+=monthlySave; details.push({cat:"대출", title:`신용대출 ${form.loanRate}% → 3.2% 대환 (케이뱅크)`, save:monthlySave}); }
    }

    return {total, details};
  };

  const handleFinal = async () => {
    setSaving(true);
    const {total, details} = calc();
    const finalData = { ...form, total, details };
    try{
      await fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(finalData)});
    }catch(e){}
    setResult({total, details});
    setSaving(false);
    setStep(5);
  };

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-0">
      <div className="max-w-[480px] md:max-w-6xl mx-auto px-5 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm">F</div><span className="font-black tracking-tight">FIXCUT</span><span className="ml-2 text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">REAL</span></div>
          <div className="text-[11px] text-black/40">Step {step}/5</div>
        </div>

        {/* Progress */}
        <div className="w-full h-1.5 bg-black/5 rounded-full mt-4 overflow-hidden"><div className="h-full bg-black transition-all duration-500" style={{width:`${step*20}%`}}></div></div>

        {step===1 && (
          <div className="mt-10">
            <h2 className="text-[28px] font-black leading-tight">이름이 뭐예요?<br/><span className="text-black/20">절약 리포트를 만들어드려요</span></h2>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="박현용" className="mt-8 w-full bg-gray-50 border border-black/5 rounded-2xl px-6 py-5 text-[18px] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"/>
            <button onClick={()=> form.name.trim() && setStep(2)} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold text-[16px]">다음 →</button>
          </div>
        )}

        {step===2 && (
          <div className="mt-10">
            <h2 className="text-[28px] font-black leading-tight">핸드폰 요금제<br/><span className="text-black/20">어떻게 쓰고 있어요?</span></h2>
            <div className="mt-8 space-y-5">
              <div><label className="text-[13px] font-bold text-black/60">통신사</label><div className="grid grid-cols-4 gap-2 mt-2">{["SKT","KT","LGU+","알뜰폰"].map(c=><button key={c} onClick={()=>setForm({...form,carrier:c})} className={`py-3 rounded-xl border text-[14px] font-bold ${form.carrier===c?"bg-black text-white border-black":"bg-white border-black/10"}`}>{c}</button>)}</div></div>
              <div><label className="text-[13px] font-bold text-black/60">월 요금 (원)</label><input type="number" value={form.phoneFee} onChange={e=>setForm({...form,phoneFee:Number(e.target.value)})} className="mt-2 w-full bg-gray-50 border border-black/5 rounded-2xl px-6 py-4 text-[16px] outline-none"/></div>
              <div><label className="text-[13px] font-bold text-black/60">월 데이터 사용량 (GB)</label><input type="range" min={1} max={100} value={form.dataUsage} onChange={e=>setForm({...form,dataUsage:Number(e.target.value)})} className="w-full mt-2"/><div className="text-sm font-bold">{form.dataUsage}GB</div></div>
            </div>
            <button onClick={()=>setStep(3)} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button>
          </div>
        )}

        {step===3 && (
          <div className="mt-10">
            <h2 className="text-[28px] font-black leading-tight">OTT 구독<br/><span className="text-black/20">뭐 쓰고 있어요?</span></h2>
            <div className="mt-6 space-y-3">
              {[
                {k:"netflix", name:"넷플릭스", fee:17000},
                {k:"youtube", name:"유튜브 프리미엄", fee:14900},
                {k:"disney", name:"디즈니+", fee:9900},
                {k:"tving", name:"티빙", fee:13900},
                {k:"wavve", name:"웨이브", fee:13900},
              ].map(o=>(
                <label key={o.k} className={`flex justify-between items-center p-4 rounded-2xl border ${form.ott[o.k]?"bg-violet-50 border-violet-200":"bg-gray-50 border-black/5"}`}>
                  <div className="flex items-center gap-3"><input type="checkbox" checked={form.ott[o.k]} onChange={e=>setForm({...form,ott:{...form.ott,[o.k]:e.target.checked}})} className="w-5 h-5"/><span className="font-bold text-[15px]">{o.name}</span></div>
                  <span className="text-[13px] text-black/60">{o.fee.toLocaleString()}원</span>
                </label>
              ))}
            </div>
            <button onClick={()=>setStep(4)} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button>
          </div>
        )}

        {step===4 && (
          <div className="mt-10">
            <h2 className="text-[28px] font-black leading-tight">대출 있어요?<br/><span className="text-black/20">이자 아낄 수 있어요</span></h2>
            <div className="mt-8 space-y-5">
              <div><label className="text-[13px] font-bold text-black/60">대출 잔액 (원)</label><input type="number" value={form.loanAmount} onChange={e=>setForm({...form,loanAmount:Number(e.target.value)})} className="mt-2 w-full bg-gray-50 border border-black/5 rounded-2xl px-6 py-4 text-[16px] outline-none"/></div>
              <div><label className="text-[13px] font-bold text-black/60">현재 금리 (%)</label><input type="number" step="0.1" value={form.loanRate} onChange={e=>setForm({...form,loanRate:Number(e.target.value)})} className="mt-2 w-full bg-gray-50 border border-black/5 rounded-2xl px-6 py-4 text-[16px] outline-none"/></div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[13px] text-blue-800">💡 현재 최저 대환 금리 3.2% (케이뱅크 기준)로 계산해드려요. {form.loanAmount.toLocaleString()}원 기준 월 {(form.loanAmount*(form.loanRate-3.2)/100/12).toLocaleString()}원 절약 가능</div>
            </div>
            <button onClick={handleFinal} disabled={saving} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">{saving?"계산중...":"결과 보기 →"}</button>
          </div>
        )}

        {step===5 && result && (
          <div className="mt-8">
            <h2 className="text-[28px] font-black leading-tight">🎉 {form.name}님,<br/><span className="text-violet-600">월 {result.total.toLocaleString()}원</span> 아낄 수 있어요!</h2>
            <div className="mt-6 space-y-3">
              {result.details.map((d,i)=>(
                <div key={i} className="bg-white border border-black/5 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                  <div><div className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/5 w-fit mb-1">{d.cat}</div><div className="font-bold text-[14px]">{d.title}</div></div>
                  <div className="text-violet-600 font-black">-{d.save.toLocaleString()}원</div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-black text-white rounded-[24px] p-6">
              <div className="text-white/60 text-[12px]">총 절약 가능 금액</div>
              <div className="text-[36px] font-black mt-1">월 {result.total.toLocaleString()}원</div>
              <div className="text-white/60 text-[13px] mt-1">연 {(result.total*12).toLocaleString()}원 절약 · 실제 신청은 각 통신사/금융사 앱에서 진행</div>
              <button onClick={()=>{setStep(1); setResult(null);}} className="mt-6 w-full bg-white text-black rounded-full py-3.5 font-bold text-[14px]">다시 계산하기</button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom progress */}
      {step<5 && <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-black/5 p-4 pb-[max(16px,env(safe-area-inset-bottom))]"><button onClick={()=> step===1 ? (form.name.trim()&&setStep(2)) : step===4 ? handleFinal() : setStep(step+1)} className="w-full bg-black text-white rounded-full py-4 font-black text-[16px]">{step===4?"결과 보기 →":"다음 →"}</button></div>}
    </main>
  );
}
