
"use client";
import { useState, useEffect } from "react";

export default function Page(){
  const [tab, setTab] = useState("home");
  const [auth, setAuth] = useState(null); // {email, name}
  const [showAuth, setShowAuth] = useState(null); // signup | login
  const [authForm, setAuthForm] = useState({email:"", password:"", name:"", phone:""});
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:"", carrier:"KT", phoneFee:69000, dataUsage:11,
    ott:{netflix:false, youtube:false, disney:false, wavve:false, tving:false},
    ottFee:{netflix:17000, youtube:14900, disney:9900, wavve:13900, tving:13900},
    loanAmount:30000000, loanRate:4.8
  });
  const [result, setResult] = useState(null);

  useEffect(()=>{
    const saved = localStorage.getItem("fixcut_auth");
    if(saved) setAuth(JSON.parse(saved));
  },[]);

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
      if(monthlySave>0){ total+=monthlySave; details.push({cat:"대출", title:`대출 ${form.loanRate}% → 3.2% 대환`, save:monthlySave});}
    }
    return {total, details};
  };

  const handleSignup = async () => {
    if(!authForm.email || !authForm.password || !authForm.name){ alert("모두 입력해주세요"); return; }
    try{
      const res = await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(authForm)});
      const data = await res.json();
      if(data.success){
        const user = {email:authForm.email, name:authForm.name};
        localStorage.setItem("fixcut_auth", JSON.stringify(user));
        setAuth(user);
        setShowAuth(null);
        alert("회원가입 완료! 🎉");
      }else{ alert(data.error||"가입 실패"); }
    }catch(e){ alert("오류: "+e.message); }
  };

  const handleLogin = async () => {
    if(!authForm.email || !authForm.password){ alert("이메일/비밀번호 입력"); return; }
    try{
      const res = await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(authForm)});
      const data = await res.json();
      if(data.success){
        const user = {email:data.user.email, name:data.user.name};
        localStorage.setItem("fixcut_auth", JSON.stringify(user));
        setAuth(user);
        setShowAuth(null);
        alert(`${user.name}님 환영해요!`);
      }else{ alert(data.error||"로그인 실패"); }
    }catch(e){ alert("오류: "+e.message); }
  };

  const handleLogout = () => {
    localStorage.removeItem("fixcut_auth");
    setAuth(null);
    setTab("home");
  };

  const handleFinal = async () => {
    if(!auth){ setShowAuth("signup"); alert("회원가입 후 절약 내역을 저장할 수 있어요!"); return; }
    const {total, details}=calc();
    try{ await fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,total,details,email:auth.email}}); }catch(e){}
    setResult({total,details});
    setTab("saving");
  };

  return (
    <main className="min-h-screen bg-white pb-[88px]">
      <div className="max-w-[480px] md:max-w-6xl mx-auto px-5 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm">F</div><span className="font-black tracking-tight">FIXCUT</span></div>
          <div className="flex items-center gap-2">
            {auth ? <><span className="text-[12px] font-bold">{auth.name}님</span><button onClick={handleLogout} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">로그아웃</button></> 
            : <><button onClick={()=>setShowAuth("login")} className="text-[12px] font-bold px-3 py-1">로그인</button><button onClick={()=>setShowAuth("signup")} className="text-[12px] bg-black text-white px-4 py-1.5 rounded-full font-bold">회원가입</button></>}
          </div>
        </div>

        {tab==="home" && (
          <div className="mt-8">
            <div className="bg-black text-white rounded-[28px] p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600 rounded-full blur-[40px] opacity-60"></div>
              <div className="relative">
                <div className="text-white/60 text-[11px] font-bold tracking-widest">{auth?`${auth.name}님을 위한 절약`:"FIXCUT APP"}</div>
                <h1 className="text-[30px] font-black leading-[1.1] mt-3">매달 새는<br/>고정비 67만원,<br/><span className="text-violet-400">19.4만원 찾아드려요</span></h1>
                <p className="text-white/60 text-[13px] mt-4">가입하면 내 절약 내역이 자동 저장돼요</p>
                <button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-6 bg-white text-black rounded-full px-6 py-3.5 font-black text-[15px] w-full">무료 진단 시작하기 →</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-50 border rounded-2xl p-4 text-center"><div className="text-[20px]">📱</div><div className="text-[12px] font-bold mt-1">통신비 -52,000원</div></div>
              <div className="bg-gray-50 border rounded-2xl p-4 text-center"><div className="text-[20px]">🎬</div><div className="text-[12px] font-bold mt-1">구독료 -27,000원</div></div>
              <div className="bg-gray-50 border rounded-2xl p-4 text-center"><div className="text-[20px]">🏦</div><div className="text-[12px] font-bold mt-1">대출 -89,000원</div></div>
            </div>
            {!auth && (
              <div className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-5 flex justify-between items-center">
                <div><div className="font-bold text-[14px]">회원가입하고 내 절약 리포트 저장</div><div className="text-[12px] text-black/60 mt-1">3초만에 가입 · 무료</div></div>
                <button onClick={()=>setShowAuth("signup")} className="bg-black text-white rounded-full px-5 py-2 text-[13px] font-bold">가입하기</button>
              </div>
            )}
          </div>
        )}

        {tab==="diag" && (
          <div className="mt-6">
            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-black transition-all" style={{width:`${step*25}%`}}></div></div>
            {step===1 && (<div className="mt-8"><h2 className="text-[26px] font-black">이름이 뭐예요?</h2><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={auth?.name||"박현용"} className="mt-6 w-full bg-gray-50 border rounded-2xl px-6 py-5 text-[18px] outline-none"/><button onClick={()=>{if(form.name.trim()||auth?.name){ setForm({...form,name:form.name||auth.name}); setStep(2);}}} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button></div>)}
            {step===2 && (<div className="mt-8"><h2 className="text-[26px] font-black">핸드폰 요금제</h2><div className="mt-6 space-y-4"><div className="grid grid-cols-4 gap-2">{["SKT","KT","LGU+","알뜰폰"].map(c=><button key={c} onClick={()=>setForm({...form,carrier:c})} className={`py-3 rounded-xl border font-bold text-[14px] ${form.carrier===c?"bg-black text-white":"bg-white"}`}>{c}</button>)}</div><input type="number" value={form.phoneFee} onChange={e=>setForm({...form,phoneFee:Number(e.target.value)})} className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><div className="flex items-center gap-3"><span className="text-[13px]">데이터 {form.dataUsage}GB</span><input type="range" min={1} max={100} value={form.dataUsage} onChange={e=>setForm({...form,dataUsage:Number(e.target.value)})} className="flex-1"/></div></div><button onClick={()=>setStep(3)} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button></div>)}
            {step===3 && (<div className="mt-8"><h2 className="text-[26px] font-black">OTT 구독</h2><div className="mt-6 space-y-2">{[{k:"netflix",n:"넷플릭스",f:17000},{k:"youtube",n:"유튜브 프리미엄",f:14900},{k:"disney",n:"디즈니+",f:9900},{k:"tving",n:"티빙",f:13900},{k:"wavve",n:"웨이브",f:13900}].map(o=><label key={o.k} className={`flex justify-between items-center p-4 rounded-2xl border ${form.ott[o.k]?"bg-violet-50 border-violet-200":"bg-gray-50"}`}><div className="flex items-center gap-3"><input type="checkbox" checked={form.ott[o.k]} onChange={e=>setForm({...form,ott:{...form.ott,[o.k]:e.target.checked}})} className="w-5 h-5"/><span className="font-bold text-[14px]">{o.n}</span></div><span className="text-[12px] text-black/50">{o.f.toLocaleString()}원</span></label>)}</div><button onClick={()=>setStep(4)} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">다음 →</button></div>)}
            {step===4 && (<div className="mt-8"><h2 className="text-[26px] font-black">대출</h2><div className="mt-6 space-y-4"><input type="number" value={form.loanAmount} onChange={e=>setForm({...form,loanAmount:Number(e.target.value)})} className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><input type="number" step="0.1" value={form.loanRate} onChange={e=>setForm({...form,loanRate:Number(e.target.value)})} className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/></div><button onClick={handleFinal} className="mt-8 w-full bg-black text-white rounded-full py-4 font-bold">{auth?"결과 보기 →":"회원가입하고 결과 보기 →"}</button></div>)}
          </div>
        )}

        {tab==="saving" && (
          <div className="mt-6">
            {!result ? <div className="text-center py-20"><div className="text-[48px]">💸</div><div className="font-bold mt-4">아직 진단 결과가 없어요</div><button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-6 bg-black text-white rounded-full px-8 py-3 font-bold">진단하기 →</button></div> :
            <div><h2 className="text-[26px] font-black">🎉 {form.name}님,<br/><span className="text-violet-600">월 {result.total.toLocaleString()}원 절약!</span></h2><div className="mt-6 space-y-3">{result.details.map((d,i)=><div key={i} className="bg-white border rounded-2xl p-4 flex justify-between items-center"><div><div className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full w-fit font-bold mb-1">{d.cat}</div><div className="font-bold text-[14px]">{d.title}</div></div><div className="text-violet-600 font-black">-{d.save.toLocaleString()}원</div></div>)}</div><div className="mt-6 bg-black text-white rounded-[24px] p-6"><div className="text-white/60 text-[12px]">총 절약</div><div className="text-[32px] font-black">월 {result.total.toLocaleString()}원</div><div className="text-white/60 text-[13px]">연 {(result.total*12).toLocaleString()}원</div></div></div>}
          </div>
        )}

        {tab==="my" && (
          <div className="mt-8">
            {!auth ? <div className="text-center py-20"><div className="text-[48px]">👤</div><div className="font-bold mt-4">로그인이 필요해요</div><div className="text-[13px] text-black/50 mt-1">내 절약 내역을 보려면 로그인해주세요</div><div className="flex gap-2 justify-center mt-6"><button onClick={()=>setShowAuth("login")} className="border rounded-full px-6 py-2.5 font-bold">로그인</button><button onClick={()=>setShowAuth("signup")} className="bg-black text-white rounded-full px-6 py-2.5 font-bold">회원가입</button></div></div> :
            <div><div className="flex items-center gap-4"><div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white font-black text-[20px]">{auth.name[0]}</div><div><div className="font-black text-[18px]">{auth.name}님</div><div className="text-[13px] text-black/50">{auth.email}</div></div></div><div className="mt-8 space-y-3"><div className="bg-gray-50 rounded-2xl p-4 flex justify-between"><span className="text-[14px]">통신사</span><span className="font-bold text-[14px]">{form.carrier}</span></div><div className="bg-gray-50 rounded-2xl p-4 flex justify-between"><span className="text-[14px]">OTT {Object.keys(form.ott).filter(k=>form.ott[k]).length}개</span><span className="font-bold text-[14px]">{Object.keys(form.ott).filter(k=>form.ott[k]).length?Object.keys(form.ott).filter(k=>form.ott[k]).join(", "):"없음"}</span></div><div className="bg-gray-50 rounded-2xl p-4 flex justify-between"><span className="text-[14px]">대출</span><span className="font-bold text-[14px]">{form.loanAmount.toLocaleString()}원 · {form.loanRate}%</span></div></div><button onClick={()=>{localStorage.removeItem("fixcut_auth"); setAuth(null); setTab("home");}} className="mt-8 w-full border rounded-full py-3.5 font-bold text-[14px]">로그아웃</button></div>}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-[28px] w-full max-w-[400px] p-7 pb-[max(24px,env(safe-area-inset-bottom))]">
            <div className="flex justify-between items-center"><h3 className="text-[20px] font-black">{showAuth==="signup"?"회원가입":"로그인"}</h3><button onClick={()=>setShowAuth(null)} className="w-8 h-8 bg-black/5 rounded-full">✕</button></div>
            <div className="mt-6 space-y-4">
              {showAuth==="signup" && <input value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="이름 (예: 박현용)" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 outline-none"/>}
              <input value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:e.target.value})} placeholder="핸드폰 번호 (010-1234-5678)" type="tel" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 outline-none"/>
              <input value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="이메일" type="email" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 outline-none"/>
              <input value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="비밀번호" type="password" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 outline-none"/>
              <button onClick={showAuth==="signup"?handleSignup:handleLogin} className="w-full bg-black text-white rounded-full py-4 font-bold mt-2">{showAuth==="signup"?"가입하고 시작하기 →":"로그인 →"}</button>
              <div className="text-center text-[13px] text-black/50">{showAuth==="signup"?"이미 계정이 있나요?":"계정이 없나요?"} <button onClick={()=>setShowAuth(showAuth==="signup"?"login":"signup")} className="font-bold text-black underline">{showAuth==="signup"?"로그인":"회원가입"}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/[0.06] z-50">
        <div className="max-w-[480px] md:max-w-6xl mx-auto px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          <div className="grid grid-cols-4">
            {[{id:"home",icon:"🏠",label:"홈"},{id:"diag",icon:"🔍",label:"진단"},{id:"saving",icon:"💰",label:"절약내역"},{id:"my",icon:"👤",label:"내정보"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} className={`flex flex-col items-center py-1.5 rounded-2xl ${tab===t.id?"text-black":"text-black/30"}`}>
                <span className="text-[20px]">{t.icon}</span><span className={`text-[10px] mt-1 font-bold ${tab===t.id?"text-black":"text-black/40"}`}>{t.label}</span>{tab===t.id && <div className="w-1 h-1 bg-black rounded-full mt-1"></div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
