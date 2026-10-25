
"use client";
import { useState, useEffect } from "react";

function formatComma(n){ if(!n && n!==0) return ""; const num = Number(String(n).replace(/[^0-9]/g,"")); if(isNaN(num)) return ""; return num.toLocaleString(); }
function parseNumber(s){ if(!s) return 0; return Number(String(s).replace(/[^0-9]/g,""))||0; }
function formatPhone(v){ const digits = v.replace(/[^0-9]/g,"").slice(0,11); if(digits.length<=3) return digits; if(digits.length<=7) return `${digits.slice(0,3)}-${digits.slice(3)}`; return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`; }

export default function Page(){
  const [tab,setTab]=useState("home");
  const [auth,setAuth]=useState(null);
  const [showAuth,setShowAuth]=useState(null);
  const [authForm,setAuthForm]=useState({name:"",phone:"",email:"",password:"",referralCode:""});
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({
    name:"", carrier:"KT", phoneFee:"69,000", dataUsage:"11",
    ott:{netflix:false,youtube:false,disney:false,wavve:false,tving:false},
    loans:[{institution:"하나은행", amount:"30,000,000", rate:"4.8"}]
  });
  const [result,setResult]=useState(null);
  const [myDiagnoses,setMyDiagnoses]=useState([]);
  const [referralCode,setReferralCode]=useState("");
  const [myReferrals,setMyReferrals]=useState([]);
  const [editMode,setEditMode]=useState(false);
  const [editForm,setEditForm]=useState({name:"",phone:"",email:"",password:"",newPassword:""});
  const [isAdmin,setIsAdmin]=useState(false);
  const [savings,setSavings]=useState([]);
  const [copied,setCopied]=useState(false);

  // Load auth & persisted data
  useEffect(()=>{
    try{
      const s=localStorage.getItem("fixcut_auth");
      if(s){ 
        const u=JSON.parse(s); 
        // FIX: if stored name is email id like parkhy5454, keep but try to recover real name from DB later
        setAuth(u); 
        setEditForm({name:u.name||"",phone:u.phone||"",email:u.email||"",password:"",newPassword:""});
      }
      const rc=localStorage.getItem("fixcut_ref_code");
      if(rc) setReferralCode(rc);
      const last=localStorage.getItem("fixcut_last_result");
      if(last) setResult(JSON.parse(last));
      const lastForm=localStorage.getItem("fixcut_last_form");
      if(lastForm){ 
        try{ const lf=JSON.parse(lastForm); if(lf.loans) setForm(prev=>({...prev, ...lf})); }catch(e){}
      }
      const saved=localStorage.getItem("fixcut_my_diagnoses");
      if(saved) setMyDiagnoses(JSON.parse(saved));
      const urlParams=new URLSearchParams(window.location.search);
      const ref=urlParams.get("ref");
      if(ref){ setAuthForm(prev=>({...prev, referralCode:ref})); localStorage.setItem("fixcut_incoming_ref", ref); }
    }catch(e){}
  },[]);

  // Fetch my diagnoses from DB on login
  useEffect(()=>{
    if(auth?.phone){
      fetch(`/api/my-diagnoses?phone=${encodeURIComponent(auth.phone)}`).then(r=>r.json()).then(d=>{
        if(d.savings?.length){ 
          setMyDiagnoses(d.savings); 
          localStorage.setItem("fixcut_my_diagnoses", JSON.stringify(d.savings));
          // also update last result to latest
          if(d.savings[0] && !result){
            const s=d.savings[0];
            const det = typeof s.details==="string"?JSON.parse(s.details):s.details;
            setResult({total:s.total, details:det||[]});
          }
        }
      }).catch(()=>{});
    }
  },[auth]);

  // Auto skip name step when logged in
  useEffect(()=>{
    if(tab==="diag" && auth && step===1){
      setForm(prev=>({...prev, name:auth.name}));
      setStep(2);
    }
  },[tab, auth, step]);

  const calc=()=>{
    let t=0; let d=[];
    const phoneFeeNum = parseNumber(form.phoneFee);
    const dataUsageNum = parseNumber(form.dataUsage);
    if(form.carrier!=="알뜰폰" && phoneFeeNum>30000){
      const tar=dataUsageNum<=15?19900:29700;
      const sv=phoneFeeNum-tar;
      if(sv>0){t+=sv; d.push({title:`${form.carrier} ${formatComma(phoneFeeNum)}원 → 알뜰폰 ${formatComma(tar)}원`,save:sv, desc:`데이터 ${dataUsageNum}GB 기준`});}
    }
    const fees={netflix:17000,youtube:14900,disney:9900,wavve:13900,tving:13900};
    const feeNames={netflix:"넷플릭스",youtube:"유튜브 프리미엄",disney:"디즈니+",wavve:"웨이브",tving:"티빙"};
    Object.keys(form.ott).forEach(k=>{
      if(form.ott[k]){ t+=fees[k]; d.push({title:`${feeNames[k]} 공유/해지`,save:fees[k], desc:`${formatComma(fees[k])}원 절약`}); }
    });
    (form.loans||[]).forEach((loan, idx)=>{
      const amt = parseNumber(loan.amount);
      const rate = parseFloat(loan.rate) || 0;
      if(amt>=1000000 && rate>3.2){
        const ms=Math.round(amt*(rate-3.2)/100/12);
        if(ms>0){t+=ms; d.push({title:`${loan.institution||"대출"+(idx+1)} ${rate}% → 3.2% 대환`,save:ms, desc:`${loan.institution||"대출"} ${formatComma(amt)}원 기준`});}
      }
    });
    return {total:t,details:d};
  };

  const handleAuth = async()=>{
    const incomingRef = localStorage.getItem("fixcut_incoming_ref") || authForm.referralCode;
    try{
      if(showAuth==="signup"){
        if(!authForm.name||!authForm.phone||!authForm.email||!authForm.password){alert("이름, 전화번호, 이메일, 비밀번호 모두 입력"); return;}
        // ROOT FIX: use real name from input, not email prefix
        const res = await fetch("/api/auth/signup", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:authForm.name.trim(), phone:authForm.phone, email:authForm.email.trim(), password:authForm.password})});
        const data = await res.json();
        if(!res.ok && !data.ok){ alert("회원가입 실패: "+(data.error||"")); return; }
        const user={name:authForm.name.trim(), phone:authForm.phone, email:authForm.email.trim()};
        localStorage.setItem("fixcut_auth", JSON.stringify(user));
        const code = (user.name.slice(0,2).toUpperCase()||user.email.split("@")[0].slice(0,4).toUpperCase()) + Math.random().toString(36).slice(2,6).toUpperCase();
        localStorage.setItem("fixcut_ref_code", code);
        setReferralCode(code);
        setAuth(user);
        if(incomingRef){
          try{ await fetch("/api/referral", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({referrerCode:incomingRef, refereeEmail:user.email, refereeName:user.name}}); }catch(e){}
        }
      }else{
        // LOGIN - ROOT FIX: use server returned name
        const res = await fetch("/api/auth/login", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email:authForm.email.trim(), password:authForm.password})});
        const data = await res.json();
        if(!res.ok || !data.ok){ alert("로그인 실패: 이메일/비밀번호 확인"); return; }
        const serverUser = data.user;
        const user={name:serverUser.name, phone:serverUser.phone, email:serverUser.email};
        localStorage.setItem("fixcut_auth", JSON.stringify(user));
        setAuth(user);
        const code = localStorage.getItem("fixcut_ref_code") || (user.name.slice(0,2).toUpperCase()+Math.random().toString(36).slice(2,6).toUpperCase());
        localStorage.setItem("fixcut_ref_code", code);
        setReferralCode(code);
      }
      setShowAuth(null);
      setAuthForm({name:"",phone:"",email:"",password:"",referralCode:""});
      if(tab==="diag") setStep(2);
    }catch(e){ alert("오류: "+String(e)); }
  };

  const widthPercent = `${(step/4)*100}%`;

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen pb-20 px-5">
        <div className="flex justify-between items-center pt-6">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black">F</div><span className="font-black">FIXCUT</span>{isAdmin && <span className="ml-1 text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full">ADMIN</span>}</div>
          <div className="flex gap-2">{auth ? <><span className="text-[12px] font-bold">{auth.name}님</span><button onClick={()=>{localStorage.removeItem("fixcut_auth"); setAuth(null); setTab("home");}} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">로그아웃</button></> : <><button onClick={()=>setShowAuth("login")} className="text-[12px] font-bold">로그인</button><button onClick={()=>setShowAuth("signup")} className="text-[12px] bg-black text-white px-4 py-1.5 rounded-full font-bold">회원가입</button></>}</div>
        </div>

        {tab==="home" && <div className="mt-8">
          <div className="bg-black text-white rounded-[28px] p-7"><h1 className="text-[30px] font-black leading-[1.1]">매달 새는<br/>고정비 67만원,<br/><span className="text-violet-400">19.4만원 찾아드려요</span></h1><button onClick={()=>{setTab("diag"); setStep(auth?2:1); if(auth) setForm(prev=>({...prev, name:auth.name}));}} className="mt-6 bg-white text-black rounded-full px-6 py-3.5 font-black w-full">무료 진단 시작하기</button></div>
          {auth && <div className="mt-4 bg-gradient-to-br from-amber-300 to-orange-400 rounded-[24px] p-5 flex justify-between items-center"><div><div className="text-[11px] font-black bg-black text-white px-2 py-0.5 rounded-full inline-block">친구 추천 이벤트</div><div className="font-black text-[16px] mt-2 leading-tight">친구 추천하면<br/>둘 다 1만원 지급!</div><div className="text-[11px] mt-1 opacity-70">내 코드: {referralCode}</div></div><button onClick={()=>setTab("referral")} className="bg-black text-white rounded-full px-4 py-2.5 text-[12px] font-black">공유하기</button></div>}
        </div>}

        {tab==="diag" && <div className="mt-6">
          <div className="w-full h-1.5 bg-black/5 rounded-full"><div className="h-full bg-black transition-all" style={{width: widthPercent}}></div></div>
          <div className="mt-2 flex justify-between text-[10px] text-black/40"><span className={step>=1?"text-black font-bold":""}>이름</span><span className={step>=2?"text-black font-bold":""}>통신비</span><span className={step>=3?"text-black font-bold":""}>구독</span><span className={step>=4?"text-black font-bold":""}>대출</span></div>

          {step===1 && <div className="mt-8">
            <h2 className="text-[26px] font-black leading-tight">이름을<br/>입력해주세요</h2>
            <div className="mt-6"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="홍길동" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 text-[18px] font-bold"/>
            <button onClick={()=>{if(!form.name) return alert("이름 입력"); setStep(2);}} className="mt-4 w-full bg-black text-white rounded-full py-4 font-bold">다음</button></div>
          </div>}

          {step===2 && <div className="mt-8">
            <h2 className="text-[26px] font-black leading-tight">통신비 입력</h2>
            <div className="mt-6 space-y-5">
              <div><div className="text-[12px] font-bold mb-2">통신사</div><div className="flex gap-2">{["KT","SKT","LGU+","알뜰폰"].map(c=><button key={c} onClick={()=>setForm({...form,carrier:c})} className={`flex-1 border rounded-xl py-3 text-[13px] font-bold ${form.carrier===c?"bg-black text-white":"bg-gray-50"}`}>{c}</button>)}</div></div>
              <div><div className="text-[12px] font-bold mb-2">월 통신비</div><div className="relative"><input value={form.phoneFee} onChange={e=>{const raw=e.target.value.replace(/[^0-9]/g,""); if(raw===""){setForm({...form,phoneFee:""}); return;} const num=Number(raw); setForm({...form,phoneFee:formatComma(num)});}} inputMode="numeric" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 pr-12 text-[18px] font-bold"/><span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-black/40">원</span></div></div>
              <div><div className="text-[12px] font-bold mb-2">월 데이터 사용량</div><div className="relative"><input value={form.dataUsage} onChange={e=>{let v=e.target.value.replace(/[^0-9.]/g,""); setForm({...form,dataUsage:v});}} placeholder="실제 사용 데이터 입력" inputMode="decimal" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 pr-12 text-[18px] font-bold"/><span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-black/40">GB</span></div></div>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setStep(1)} className="flex-1 bg-black/5 rounded-full py-4 font-bold">이전</button><button onClick={()=>setStep(3)} className="flex-[2] bg-black text-white rounded-full py-4 font-bold">다음</button></div>
          </div>}

          {step===3 && <div className="mt-8">
            <h2 className="text-[26px] font-black leading-tight">구독 서비스<br/>선택</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[{k:"netflix",n:"넷플릭스"},{k:"youtube",n:"유튜브 프리미엄"},{k:"disney",n:"디즈니+"},{k:"wavve",n:"웨이브"},{k:"tving",n:"티빙"}].map(o=>(
                <button key={o.k} onClick={()=>setForm({...form, ott:{...form.ott, [o.k]:!form.ott[o.k]}})} className={`border rounded-2xl py-4 font-bold text-[14px] ${form.ott[o.k]?"bg-black text-white":"bg-gray-50"}`}>{o.n}</button>
              ))}
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setStep(2)} className="flex-1 bg-black/5 rounded-full py-4 font-bold">이전</button><button onClick={()=>setStep(4)} className="flex-[2] bg-black text-white rounded-full py-4 font-bold">다음</button></div>
          </div>}

          {step===4 && <div className="mt-8">
            <h2 className="text-[26px] font-black leading-tight">대출 정보 입력</h2>
            <div className="mt-6 space-y-4">
              {form.loans.map((loan, idx)=>(
                <div key={idx} className="bg-gray-50 border rounded-[20px] p-4 relative">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[12px] font-black bg-black text-white px-3 py-1 rounded-full">대출 {idx+1}</div>
                    {form.loans.length>1 && <button onClick={()=>{const newLoans=form.loans.filter((_,i)=>i!==idx); setForm({...form, loans:newLoans});}} className="text-[11px] bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-full font-bold">삭제</button>}
                  </div>
                  <div className="space-y-3">
                    <select value={loan.institution} onChange={e=>{const nl=[...form.loans]; nl[idx].institution=e.target.value; setForm({...form, loans:nl});}} className="w-full bg-white border rounded-xl px-4 py-3.5 text-[14px] font-bold">
                      <option value="">대출 기관 선택</option>
                      <option value="KB국민은행">KB국민은행</option>
                      <option value="신한은행">신한은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="NH농협">NH농협</option>
                      <option value="카카오뱅크">카카오뱅크</option>
                      <option value="토스뱅크">토스뱅크</option>
                      <option value="케이뱅크">케이뱅크</option>
                      <option value="기타 은행">기타 은행</option>
                      <option value="카드론/캐피탈">카드론/캐피탈</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input value={loan.amount} onChange={e=>{const raw=e.target.value.replace(/[^0-9]/g,""); const nl=[...form.loans]; if(raw===""){nl[idx].amount="";} else {nl[idx].amount=formatComma(Number(raw));} setForm({...form, loans:nl});}} placeholder="30,000,000" inputMode="numeric" className="w-full bg-white border rounded-xl px-4 py-3.5 pr-8 text-[14px] font-bold"/>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-black/40">원</span>
                      </div>
                      <div className="relative">
                        <input value={loan.rate} onChange={e=>{let v=e.target.value.replace(/[^0-9.]/g,""); const parts=v.split("."); if(parts.length>2) v=parts[0]+"."+parts.slice(1).join(""); const nl=[...form.loans]; nl[idx].rate=v; setForm({...form, loans:nl});}} placeholder="4.8" inputMode="decimal" className="w-full bg-white border rounded-xl px-4 py-3.5 pr-8 text-[14px] font-bold"/>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-black/40">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setForm({...form, loans:[...form.loans, {institution:"", amount:"", rate:""}]})} className="w-full border-2 border-dashed border-black/20 bg-white rounded-2xl py-4 font-bold text-[14px] text-black hover:bg-black hover:text-white transition-all">+ 대출 추가하기</button>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setStep(3)} className="flex-1 bg-black/5 rounded-full py-4 font-bold">이전</button><button onClick={()=>{
              const r=calc(); 
              setResult(r); 
              try{
                localStorage.setItem("fixcut_last_result", JSON.stringify(r));
                localStorage.setItem("fixcut_last_form", JSON.stringify(form));
                const prev = JSON.parse(localStorage.getItem("fixcut_my_diagnoses")||"[]");
                const payload={...r, total:r.total, details:r.details, inputs:{carrier:form.carrier,phoneFee:form.phoneFee,dataUsage:form.dataUsage,ott:form.ott,loans:form.loans}, carrier:form.carrier, phoneFee:form.phoneFee, dataUsage:form.dataUsage, ott:form.ott, loans:form.loans, created_at:new Date().toISOString(), name:form.name, phone:auth?.phone||""};
                const updated=[payload, ...prev].slice(0,10);
                localStorage.setItem("fixcut_my_diagnoses", JSON.stringify(updated));
                setMyDiagnoses(updated);
                fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{});
              }catch(e){}
              setTab("saving");
            }} className="flex-[2] bg-black text-white rounded-full py-4 font-bold">결과 보기 ({form.loans.length}건 계산)</button></div>
          </div>}
        </div>}

        {tab==="saving" && <div className="mt-6">{!result ? <div className="text-center py-20"><div className="text-[14px] font-bold">진단 먼저 해주세요</div><button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-4 bg-black text-white rounded-full px-6 py-2 text-[13px]">진단하기</button></div> : <div><h2 className="text-[26px] font-black">월 {formatComma(result.total)}원 절약</h2><p className="text-[13px] text-black/50 mt-1">아래 방법으로 절약할 수 있어요</p><div className="mt-6 space-y-3">{result.details.map((d,i)=><div key={i} className="border rounded-2xl p-4 flex justify-between items-center"><div><div className="font-bold text-[14px]">{d.title}</div><div className="text-[11px] text-black/40 mt-0.5">{d.desc}</div></div><div className="font-black text-violet-600 text-[15px]">{formatComma(d.save)}원</div></div>)}</div>{result.details.length===0 && <div className="text-center py-10 bg-gray-50 rounded-2xl mt-4"><div className="text-[13px]">절약할 부분이 없네요! 잘 관리하고 계세요</div></div>}
        <div className="mt-6 bg-gray-50 rounded-2xl p-4"><div className="text-[12px] font-bold text-black/50">입력한 정보</div><div className="mt-2 text-[13px]">통신사: {form.carrier} / {form.phoneFee} / {form.dataUsage}GB</div><div className="text-[13px] mt-1">대출: {form.loans.length}건 {form.loans.map(l=>`${l.institution} ${l.amount} ${l.rate}%`).join(", ")}</div></div>
        </div>}</div>}

        {tab==="my" && <div className="mt-8">
          {!auth ? <div className="text-center py-20"><div className="font-bold mt-2">로그인 필요</div><button onClick={()=>setShowAuth("signup")} className="mt-4 bg-black text-white rounded-full px-6 py-2">회원가입</button></div> :
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black rounded-[20px] flex items-center justify-center text-white font-black text-[22px]">{auth.name?.[0]||"?"}</div>
              <div className="flex-1">
                <div className="font-black text-[18px]">{auth.name}님 {isAdmin && <span className="text-red-500 text-[12px]">[관리자]</span>}</div>
                <div className="text-[13px] text-black/50 mt-1">{auth.email}</div>
                <div className="text-[12px] text-black/40">{auth.phone}</div>
              </div>
              <button onClick={()=>{setEditMode(!editMode); setEditForm({name:auth.name,phone:auth.phone,email:auth.email,password:"",newPassword:""});}} className="bg-black/5 px-4 py-2 rounded-full text-[12px] font-bold">{editMode?"닫기":"수정"}</button>
            </div>

            <div className="mt-5 bg-gradient-to-r from-amber-300 to-orange-300 rounded-2xl p-4 flex justify-between items-center">
              <div><div className="text-[11px] font-bold">내 추천 코드</div><div className="font-black text-[16px]">{referralCode}</div><div className="text-[11px]">{myReferrals.length}명 추천 - {(myReferrals.length*10000).toLocaleString()}원 적립</div></div>
              <button onClick={()=>setTab("referral")} className="bg-black text-white rounded-full px-4 py-2 text-[11px] font-bold">자세히</button>
            </div>

            <div className="mt-8">
              <h3 className="text-[18px] font-black">내가 입력한 진단 정보</h3>
              {myDiagnoses.length===0 ? <div className="mt-3 bg-gray-50 border rounded-2xl p-6 text-center text-[13px] text-black/40">아직 진단 내역이 없어요<br/>진단하기를 진행해보세요</div> :
              <div className="mt-3 space-y-3">
                {myDiagnoses.map((s,i)=>(
                  <div key={i} className="border rounded-2xl p-4 bg-white">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-[14px] text-violet-600">{(s.total||0).toLocaleString()}원 절약 가능</span>
                      <span className="text-[10px] text-black/40">{(s.created_at||"").slice(0,16).replace("T"," ")}</span>
                    </div>
                    <div className="mt-2 text-[12px] space-y-1 text-black/70">
                      <div>통신사: <b>{s.carrier||s.inputs?.carrier||"-"}</b> / {s.phone_fee||s.inputs?.phoneFee||"-"} / {s.data_usage||s.inputs?.dataUsage||"-"}GB</div>
                      <div>OTT: <b>{(() => { const ott = s.ott||s.inputs?.ott||{}; const o = typeof ott==="string"?JSON.parse(ott):ott; return Object.keys(o).filter(k=>o[k]).join(", ")||"없음"; })()}</b></div>
                      <div>대출: <b>{(() => { const loans = s.loans||s.inputs?.loans||[]; const l = typeof loans==="string"?JSON.parse(loans):loans; if(!l.length) return "없음"; return l.map(x=>`${x.institution||"대출"} ${x.amount||""} ${x.rate||""}%`).join(" | "); })()}</b></div>
                    </div>
                    <div className="mt-3 bg-gray-50 rounded-xl p-3">
                      {(s.details||[]).map((d,j)=><div key={j} className="text-[11px] flex justify-between py-1"><span>{d.title}</span><b>{d.save?.toLocaleString()}원</b></div>)}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={()=>{ const inputs = s.inputs||{carrier:s.carrier, phoneFee:s.phone_fee, dataUsage:s.data_usage, ott:s.ott, loans:s.loans}; const ottObj = typeof inputs.ott==="string"?JSON.parse(inputs.ott):inputs.ott||{}; const loansArr = typeof inputs.loans==="string"?JSON.parse(inputs.loans):inputs.loans||[]; setForm({name:s.name||auth?.name||"", carrier:inputs.carrier||"KT", phoneFee:inputs.phoneFee||inputs.phone_fee||"69,000", dataUsage:inputs.dataUsage||inputs.data_usage||"11", ott:ottObj?.netflix!==undefined?ottObj:{netflix:false,youtube:false,disney:false,wavve:false,tving:false}, loans:loansArr.length?loansArr:[{institution:"", amount:"", rate:""}]}); setTab("diag"); setStep(2); }} className="flex-1 bg-black text-white rounded-full py-2.5 text-[12px] font-bold">수정하기</button>
                      <button onClick={()=>{ if(!confirm("이 진단 내역을 삭제할까요?")) return; const updated = myDiagnoses.filter((_,idx)=>idx!==i); setMyDiagnoses(updated); localStorage.setItem("fixcut_my_diagnoses", JSON.stringify(updated)); }} className="flex-1 bg-black/5 rounded-full py-2.5 text-[12px] font-bold">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
              }
            </div>

            {editMode && <div className="mt-6 bg-gray-50 rounded-[24px] p-6 border">
              <h3 className="font-black text-[16px]">내 정보 수정</h3>
              <div className="mt-4 space-y-3">
                <div><div className="text-[11px] font-bold text-black/50 mb-1">이름 (실명)</div><input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">핸드폰 번호</div><input value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:formatPhone(e.target.value)})} inputMode="numeric" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">이메일</div><input value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div className="pt-3 border-t mt-3"><div className="text-[11px] font-bold text-black/50 mb-1">현재 비밀번호</div><input value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})} type="password" placeholder="현재 비밀번호" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/><div className="text-[11px] font-bold text-black/50 mb-1 mt-2">새 비밀번호 (변경시만)</div><input value={editForm.newPassword} onChange={e=>setEditForm({...editForm,newPassword:e.target.value})} type="password" placeholder="새 비밀번호" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <button onClick={async()=>{
                  if(!editForm.name) return alert("이름 입력");
                  const newAuth={name:editForm.name.trim(), phone:editForm.phone, email:editForm.email.trim()};
                  localStorage.setItem("fixcut_auth", JSON.stringify(newAuth));
                  setAuth(newAuth);
                  setEditMode(false);
                  try{ await fetch("/api/auth/update", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({oldEmail:auth.email, ...editForm})}); alert("수정 완료! 재로그인해도 유지됩니다."); }catch(e){ alert("로컬 수정 완료"); }
                }} className="w-full bg-black text-white rounded-xl py-3 font-bold mt-2">저장하기</button>
              </div>
            </div>}
          </div>}
        </div>}

        {showAuth && <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"><div className="w-full max-w-[480px] bg-white rounded-t-[24px] p-6"><div className="flex justify-between"><h3 className="font-black text-[18px]">{showAuth==="signup"?"회원가입":"로그인"}</h3><button onClick={()=>setShowAuth(null)}>✕</button></div>
          <div className="mt-6 space-y-3">
            {showAuth==="signup" && <><input value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="이름 (실명)" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><div><div className="text-[11px] font-bold text-black/50 mb-1">핸드폰 번호</div><input value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:formatPhone(e.target.value)})} inputMode="numeric" placeholder="010-1234-5678" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/></div></>}
            <input value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="이메일" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
            <input value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="비밀번호" type="password" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
            {showAuth==="signup" && <div><div className="text-[11px] font-bold text-black/50 mb-1">친구 추천 코드 (선택)</div><input value={authForm.referralCode} onChange={e=>setAuthForm({...authForm,referralCode:e.target.value})} placeholder="추천 코드 있으면 입력" className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-[14px]"/></div>}
            <button onClick={handleAuth} className="w-full bg-black text-white rounded-2xl py-4 font-bold mt-2">{showAuth==="signup"?"가입하기":"로그인"}</button>
          </div>
        </div></div>}

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t flex justify-around py-2">
          <button onClick={()=>setTab("home")} className={`flex flex-col items-center text-[11px] ${tab==="home"?"font-black":"text-black/40"}`}>홈</button>
          <button onClick={()=>{setTab("diag"); if(auth){setForm(prev=>({...prev, name:auth.name})); setStep(2);} else setStep(1);}} className={`flex flex-col items-center text-[11px] ${tab==="diag"?"font-black":"text-black/40"}`}>진단</button>
          <button onClick={()=>setTab("saving")} className={`flex flex-col items-center text-[11px] ${tab==="saving"?"font-black":"text-black/40"}`}>절약</button>
          <button onClick={()=>setTab("my")} className={`flex flex-col items-center text-[11px] ${tab==="my"?"font-black":"text-black/40"}`}>내정보</button>
        </div>
      </div>
    </div>
  );
}
