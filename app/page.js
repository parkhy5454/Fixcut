
"use client";
import { useState, useEffect } from "react";

const formatPhone = (value) => {
  const numbers = value.replace(/[^0-9]/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return numbers.slice(0,3) + "-" + numbers.slice(3);
  return numbers.slice(0,3) + "-" + numbers.slice(3,7) + "-" + numbers.slice(7,11);
};

const formatComma = (num) => {
  if (num === "" || num === null || num === undefined) return "";
  const n = Number(String(num).replace(/[^0-9]/g, ""));
  if (isNaN(n)) return "";
  if (n === 0) return "0";
  return n.toLocaleString();
};

const parseNumber = (str) => {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9]/g, "");
  if (cleaned === "") return 0;
  return Number(cleaned);
};

const Icons = {
  home: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-black text-white":"bg-black/5")}><span className="text-[14px]">⌂</span></div>,
  diag: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-black text-white":"bg-black/5")}><span className="text-[14px]">◍</span></div>,
  saving: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-violet-600 text-white":"bg-black/5")}><span className="text-[12px]">₩</span></div>,
  my: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-full "+(a?"bg-black text-white":"bg-black/5")}><span className="text-[12px]">☺</span></div>,
  referral: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-amber-400 text-black":"bg-amber-50")}><span className="text-[12px]">♥</span></div>,
};

export default function Page(){
  const [tab,setTab]=useState("home");
  const [auth,setAuth]=useState(null);
  const [showAuth,setShowAuth]=useState(null);
  const [authForm,setAuthForm]=useState({name:"",phone:"",email:"",password:"",referralCode:""});
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({
    name:"", carrier:"KT", phoneFee:"69,000", dataUsage:"11",
    ott:{netflix:false,youtube:false,disney:false,wavve:false,tving:false},
    loans:[{institution:"", amount:"30,000,000", rate:"4.8"}]
  });
  const [result,setResult]=useState(null);
  const [adminData,setAdminData]=useState({users:[],savings:[],referrals:[]});
  const [editMode,setEditMode]=useState(false);
  const [editForm,setEditForm]=useState({name:"",phone:"",email:"",password:"",newPassword:""});
  const [referralCode,setReferralCode]=useState("");
  const [myReferrals,setMyReferrals]=useState([]);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    try{
      const s=localStorage.getItem("fixcut_auth");
      if(s){
        const u=JSON.parse(s);
        setAuth(u);
        setEditForm({name:u.name||"",phone:u.phone||"",email:u.email||"",password:"",newPassword:""});
        const code = (u.email?.split("@")[0]||"fixcut").toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
        setReferralCode(localStorage.getItem("fixcut_ref_code")||code);
        if(!localStorage.getItem("fixcut_ref_code")) localStorage.setItem("fixcut_ref_code", code);
      }
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if(ref){
        setAuthForm(prev=>({...prev, referralCode:ref}));
        localStorage.setItem("fixcut_incoming_ref", ref);
      }
    }catch(e){}
  },[]);

  useEffect(()=>{
    if(referralCode && auth){
      fetch("/api/referral?code="+referralCode).then(r=>r.json()).then(d=>setMyReferrals(d.referrals||[])).catch(()=>{});
    }
  },[referralCode, auth]);

  useEffect(()=>{
    try{
      const s=localStorage.getItem("fixcut_auth");
      if(!s) return;
      const saved=JSON.parse(s);
      if(!saved.email) return;
      fetch("/api/auth/me?email="+encodeURIComponent(saved.email))
        .then(r=>r.json())
        .then(d=>{
          if(!d.ok||!d.user) return;
          const fresh={name:d.user.name, phone:d.user.phone, email:d.user.email};
          localStorage.setItem("fixcut_auth", JSON.stringify(fresh));
          setAuth(fresh);
          setEditForm(prev=>({...prev, name:fresh.name, phone:fresh.phone, email:fresh.email}));
        })
        .catch(()=>{});
    }catch(e){}
  },[]);

  const isAdmin = auth && (
    auth.email === "parkhy5454@gmail.com" ||
    auth.email === "admin@fixcut.com" ||
    auth.email?.includes("parkhy") ||
    auth.name === "관리자"
  );

  const loadAdmin = () => {
    fetch("/api/admin/list").then(r=>r.json()).then(d=>setAdminData(prev=>({...prev, ...d}))).catch(()=>{});
    fetch("/api/referral?all=1").then(r=>r.json()).then(d=>setAdminData(prev=>({...prev, referrals:d.referrals||[]}))).catch(()=>{});
  };

  const handleUpdate = async () => {
    const name = editForm.name.trim();
    const phone = editForm.phone.trim();
    const email = editForm.email.trim().toLowerCase();
    if(!name || !phone || !email){
      alert("이름, 핸드폰, 이메일은 필수입니다");
      return;
    }
    try{
      const res = await fetch("/api/auth/update", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({oldEmail:auth.email, name, phone, email, newPassword:editForm.newPassword})});
      const data = await res.json().catch(()=>({}));
      if(!res.ok || !data.ok){
        alert("정보 변경 실패: "+(data.error||"다시 시도해 주세요"));
        return;
      }
    }catch(e){
      alert("네트워크 오류로 저장하지 못했습니다");
      return;
    }
    const newAuth = {name, phone, email};
    localStorage.setItem("fixcut_auth", JSON.stringify(newAuth));
    setAuth(newAuth);
    setEditForm({name, phone, email, password:"", newPassword:""});
    alert("정보가 변경되었습니다");
    setEditMode(false);
  };

  // 회원가입/로그인: 서버 응답을 확인한 뒤, 서버가 돌려준 회원 정보를 저장한다.
  const submitAuth = async () => {
    const isSignup = showAuth === "signup";
    if(isSignup && (!authForm.name.trim() || !authForm.phone.trim() || !authForm.email.trim() || !authForm.password)){
      alert("모두 입력해 주세요");
      return;
    }
    if(!isSignup && (!authForm.email.trim() || !authForm.password)){
      alert("이메일과 비밀번호를 입력해 주세요");
      return;
    }
    const incomingRef = localStorage.getItem("fixcut_incoming_ref") || authForm.referralCode;
    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const body = isSignup
      ? {name:authForm.name.trim(), phone:authForm.phone.trim(), email:authForm.email.trim(), password:authForm.password}
      : {email:authForm.email.trim(), password:authForm.password};
    let data;
    try{
      const res = await fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
      data = await res.json().catch(()=>({}));
      if(!res.ok || !data.ok){
        alert(isSignup ? "회원가입 실패: "+(data.error||"다시 시도해 주세요") : "이메일 또는 비밀번호가 올바르지 않습니다");
        return;
      }
    }catch(e){
      alert("네트워크 오류입니다. 다시 시도해 주세요");
      return;
    }
    const user = {
      name: data.user?.name ?? authForm.name.trim(),
      phone: data.user?.phone ?? authForm.phone.trim(),
      email: data.user?.email ?? authForm.email.trim().toLowerCase(),
    };
    localStorage.setItem("fixcut_auth", JSON.stringify(user));
    // 로그인 시에는 기존 추천 코드를 유지해야 추천 내역이 끊기지 않는다
    const existingCode = localStorage.getItem("fixcut_ref_code");
    const code = (!isSignup && existingCode) ? existingCode
      : (user.email.split("@")[0]||"fixcut").toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
    localStorage.setItem("fixcut_ref_code", code);
    setReferralCode(code);
    setAuth(user);
    setEditForm({name:user.name, phone:user.phone, email:user.email, password:"", newPassword:""});
    setShowAuth(null);
    if(isSignup && incomingRef){
      try{
        await fetch("/api/referral", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({referrerCode:incomingRef, referredName:user.name, referredEmail:user.email})});
        localStorage.removeItem("fixcut_incoming_ref");
      }catch(e){}
    }
    if(user.email==="admin@fixcut.com"||user.email.includes("parkhy")){ setTimeout(()=>{setTab("admin"); loadAdmin();},500);}
  };

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
    form.loans.forEach((loan, idx)=>{
      const amt = parseNumber(loan.amount);
      const rate = parseFloat(loan.rate) || 0;
      if(amt>=1000000 && rate>3.2){
        const ms=Math.round(amt*(rate-3.2)/100/12);
        if(ms>0){t+=ms; d.push({title:`${loan.institution||"대출"+(idx+1)} ${rate}% → 3.2% 대환`,save:ms, desc:`${loan.institution||"대출"} ${formatComma(amt)}원 기준`});}
      }
    });
    return {total:t,details:d};
  };

  const widthPercent = step * 25 + "%";
  const shareLink = typeof window !== "undefined" ? window.location.origin + "?ref=" + referralCode : "?ref=" + referralCode;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  };

  const shareKakao = () => {
    if(navigator.share){
      navigator.share({title:"FIXCUT - 고정비 19.4만원 절약", text:"친구 추천으로 함께 절약해요! 내 코드: "+referralCode, url:shareLink});
    } else {
      copyLink();
      alert("링크가 복사되었습니다! 카톡에 붙여넣기 하세요");
    }
  };

  return (
    <main className="min-h-screen bg-white pb-[96px]">
      <div className="max-w-[480px] mx-auto px-5 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black">F</div><span className="font-black">FIXCUT</span>{isAdmin && <span className="ml-1 text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full">ADMIN</span>}</div>
          <div className="flex gap-2">{auth ? <><span className="text-[12px] font-bold">{auth.name}님</span><button onClick={()=>{localStorage.removeItem("fixcut_auth"); setAuth(null); setTab("home");}} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">로그아웃</button></> : <><button onClick={()=>setShowAuth("login")} className="text-[12px] font-bold">로그인</button><button onClick={()=>setShowAuth("signup")} className="text-[12px] bg-black text-white px-4 py-1.5 rounded-full font-bold">회원가입</button></>}</div>
        </div>

        {tab==="home" && <div className="mt-8">
          <div className="bg-black text-white rounded-[28px] p-7"><h1 className="text-[30px] font-black leading-[1.1]">매달 새는<br/>고정비 67만원,<br/><span className="text-violet-400">19.4만원 찾아드려요</span></h1><button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-6 bg-white text-black rounded-full px-6 py-3.5 font-black w-full">무료 진단 시작하기</button></div>
          {auth && <div className="mt-4 bg-gradient-to-br from-amber-300 to-orange-400 rounded-[24px] p-5 flex justify-between items-center"><div><div className="text-[11px] font-black bg-black text-white px-2 py-0.5 rounded-full inline-block">친구 추천 이벤트</div><div className="font-black text-[16px] mt-2 leading-tight">친구 추천하면<br/>둘 다 1만원 지급!</div><div className="text-[11px] mt-1 opacity-70">내 코드: {referralCode}</div></div><button onClick={()=>setTab("referral")} className="bg-black text-white rounded-full px-4 py-2.5 text-[12px] font-black">공유하기</button></div>}
        </div>}

        {tab==="diag" && <div className="mt-6">
          <div className="w-full h-1.5 bg-black/5 rounded-full"><div className="h-full bg-black transition-all" style={{width: widthPercent}}></div></div>
          <div className="mt-2 flex justify-between text-[10px] text-black/40"><span className={step>=1?"text-black font-bold":""}>이름</span><span className={step>=2?"text-black font-bold":""}>통신비</span><span className={step>=3?"text-black font-bold":""}>구독</span><span className={step>=4?"text-black font-bold":""}>대출</span></div>
          
          {step===1 && <div className="mt-8"><h2 className="text-[26px] font-black">이름을 알려주세요</h2><p className="text-[13px] text-black/50 mt-1">절약 결과를 저장할 때 필요해요</p><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="박현용" className="mt-4 w-full bg-gray-50 border rounded-2xl px-6 py-5 text-[18px] font-bold"/><button onClick={()=>{if(!form.name) return alert("이름 입력"); setStep(2);}} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold">다음</button></div>}

          {step===2 && <div className="mt-8">
            <h2 className="text-[26px] font-black leading-tight">통신비 정보를<br/>입력해주세요</h2>
            <div className="mt-6 space-y-5">
              <div>
                <div className="text-[12px] font-bold mb-2">통신사</div>
                <div className="grid grid-cols-4 gap-2">{["SKT","KT","LGU+","알뜰폰"].map(c=><button key={c} onClick={()=>setForm({...form,carrier:c})} className={"py-3 rounded-xl border font-bold text-[14px] "+(form.carrier===c?"bg-black text-white border-black":"bg-white")}>{c}</button>)}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold mb-2">현재 요금제 금액</div>
                <div className="relative">
                  <input value={form.phoneFee} onChange={e=>{const raw=e.target.value.replace(/[^0-9]/g,""); if(raw===""){setForm({...form,phoneFee:""}); return;} const num=Number(raw); setForm({...form,phoneFee:formatComma(num)});}} placeholder="69,000" inputMode="numeric" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 pr-12 text-[18px] font-bold"/>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-black/40">원</span>
                </div>
                <div className="text-[11px] text-black/40 mt-1">숫자만 입력하면 천단위 자동 표시, 0까지 모두 삭제 가능</div>
              </div>
              <div>
                <div className="text-[12px] font-bold mb-2">월 데이터 사용량</div>
                <div className="relative">
                  <input value={form.dataUsage} onChange={e=>{const raw=e.target.value.replace(/[^0-9]/g,""); if(raw===""){setForm({...form,dataUsage:""}); return;} setForm({...form,dataUsage:raw});}} placeholder="11" inputMode="numeric" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 pr-12 text-[18px] font-bold"/>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-black/40">GB</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setStep(1)} className="flex-1 bg-black/5 rounded-full py-4 font-bold">이전</button><button onClick={()=>setStep(3)} className="flex-[2] bg-black text-white rounded-full py-4 font-bold">다음</button></div>
          </div>}

          {step===3 && <div className="mt-8"><h2 className="text-[26px] font-black">구독 중인 OTT</h2><p className="text-[13px] text-black/50 mt-1">해당하는 항목을 모두 선택하세요</p><div className="mt-6 space-y-2">{[
            {key:"netflix",name:"넷플릭스",price:"17,000원"},
            {key:"youtube",name:"유튜브 프리미엄",price:"14,900원"},
            {key:"disney",name:"디즈니+",price:"9,900원"},
            {key:"tving",name:"티빙",price:"13,900원"},
            {key:"wavve",name:"웨이브",price:"13,900원"},
          ].map(k=><label key={k.key} className={"flex items-center justify-between p-4 border rounded-2xl cursor-pointer "+(form.ott[k.key]?"bg-black text-white border-black":"bg-white")}><div className="flex items-center gap-3"><input type="checkbox" checked={form.ott[k.key]} onChange={e=>setForm({...form,ott:{...form.ott,[k.key]:e.target.checked}})} className="w-5 h-5"/><span className="font-bold text-[14px]">{k.name}</span></div><span className={"text-[12px] "+(form.ott[k.key]?"text-white/60":"text-black/40")}>{k.price}</span></label>)}</div><div className="mt-6 flex gap-2"><button onClick={()=>setStep(2)} className="flex-1 bg-black/5 rounded-full py-4 font-bold">이전</button><button onClick={()=>setStep(4)} className="flex-[2] bg-black text-white rounded-full py-4 font-bold">다음</button></div></div>}

          {step===4 && <div className="mt-8">
            <h2 className="text-[26px] font-black leading-tight">대출 정보를<br/>입력해주세요</h2>
            <p className="text-[13px] text-black/50 mt-1">여러 건이면 + 버튼으로 추가 (없으면 비워두고 결과 보기)</p>
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
              <button onClick={()=>setForm({...form, loans:[...form.loans, {institution:"", amount:"", rate:""}]})} className="w-full border-2 border-dashed rounded-2xl py-4 font-bold text-[14px] text-black/50 hover:bg-gray-50">+ 대출 추가하기</button>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setStep(3)} className="flex-1 bg-black/5 rounded-full py-4 font-bold">이전</button><button onClick={()=>{const r=calc(); setResult(r); setTab("saving"); try{fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.name,phone:auth?.phone||"",total:r.total,details:r.details})});}catch(e){}}} className="flex-[2] bg-black text-white rounded-full py-4 font-bold">결과 보기 ({form.loans.length}건 계산)</button></div>
          </div>}
        </div>}

        {tab==="saving" && <div className="mt-6">{!result ? <div className="text-center py-20"><div className="text-[14px] font-bold">진단 먼저 해주세요</div><button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-4 bg-black text-white rounded-full px-6 py-2 text-[13px]">진단하기</button></div> : <div><h2 className="text-[26px] font-black">월 {formatComma(result.total)}원 절약</h2><p className="text-[13px] text-black/50 mt-1">아래 방법으로 절약할 수 있어요</p><div className="mt-6 space-y-3">{result.details.map((d,i)=><div key={i} className="border rounded-2xl p-4 flex justify-between items-center"><div><div className="font-bold text-[14px]">{d.title}</div><div className="text-[11px] text-black/40 mt-0.5">{d.desc}</div></div><div className="font-black text-violet-600 text-[15px]">{formatComma(d.save)}원</div></div>)}</div>{result.details.length===0 && <div className="text-center py-10 bg-gray-50 rounded-2xl mt-4"><div className="text-[13px] font-bold">절약할 항목이 없어요!</div><div className="text-[11px] text-black/40 mt-1">이미 알뜰하게 관리 중이시네요</div></div>}<div className="mt-6 bg-gray-50 rounded-2xl p-4"><div className="text-[11px] font-bold text-black/50">입력한 정보</div><div className="text-[12px] mt-2 space-y-1"><div>통신사: {form.carrier} / {formatComma(parseNumber(form.phoneFee))}원 / {form.dataUsage}GB</div><div>대출: {form.loans.length}건 {form.loans.map(l=> (l.institution||"대출")+" "+(l.amount?formatComma(parseNumber(l.amount))+"원 ":"")+ (l.rate?l.rate+"% ":"")).join(", ")}</div></div></div></div>}</div>}

        {tab==="referral" && <div className="mt-6">
          <h2 className="text-[26px] font-black leading-tight">친구 추천하면<br/><span className="text-amber-500">둘 다 1만원!</span></h2>
          <div className="mt-6 bg-black text-white rounded-[24px] p-6">
            <div className="text-[11px] text-white/50">내 추천 코드</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-[28px] font-black tracking-widest">{referralCode||"로그인 필요"}</div>
              <button onClick={copyLink} className="bg-white text-black rounded-full px-4 py-2 text-[12px] font-bold">{copied?"복사됨!":"복사"}</button>
            </div>
            <div className="mt-4 bg-white/10 rounded-xl p-3 text-[11px] break-all">{shareLink}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={shareKakao} className="bg-[#FEE500] text-black rounded-full py-3 font-bold text-[13px]">카톡 공유</button>
              <button onClick={copyLink} className="bg-white text-black rounded-full py-3 font-bold text-[13px]">링크 복사</button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center"><div className="text-[22px] font-black">{myReferrals.length}</div><div className="text-[11px] text-black/50">추천한 친구</div></div>
            <div className="bg-gray-50 border rounded-2xl p-4 text-center"><div className="text-[22px] font-black">{(myReferrals.length*10000).toLocaleString()}</div><div className="text-[11px] text-black/50">적립금</div></div>
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-center"><div className="text-[22px] font-black">1만</div><div className="text-[11px] text-black/50">친구 혜택</div></div>
          </div>
          <div className="mt-8"><h3 className="font-black">추천 현황</h3>
            <div className="mt-3 space-y-2">
              {myReferrals.length===0 ? <div className="text-center py-10 bg-gray-50 rounded-2xl"><div className="text-[40px]">🎁</div><div className="text-[13px] font-bold mt-2">아직 추천한 친구가 없어요</div><div className="text-[11px] text-black/40 mt-1">친구에게 링크를 공유해보세요!</div></div> :
              myReferrals.map((r,i)=><div key={i} className="border rounded-2xl p-4 flex justify-between items-center"><div><div className="font-bold text-[14px]">{r.referred_name||"친구"}</div><div className="text-[11px] text-black/40">{r.created_at?.slice(0,10)} 가입</div></div><div className="bg-amber-400 text-black text-[11px] font-bold px-3 py-1 rounded-full">+1만원</div></div>)}
            </div>
          </div>
        </div>}

        {tab==="my" && <div className="mt-8">
          {!auth ? <div className="text-center py-20"><div className="font-bold mt-2">로그인 필요</div><button onClick={()=>setShowAuth("signup")} className="mt-4 bg-black text-white rounded-full px-6 py-2">회원가입</button></div> :
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black rounded-[20px] flex items-center justify-center text-white font-black text-[22px]">{auth.name[0]}</div>
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

            {editMode && <div className="mt-6 bg-gray-50 rounded-[24px] p-6 border">
              <h3 className="font-black text-[16px]">내 정보 수정</h3>
              <div className="mt-4 space-y-3">
                <div><div className="text-[11px] font-bold text-black/50 mb-1">이름</div><input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">핸드폰 (숫자만 입력, 자동 하이픈)</div><input value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:formatPhone(e.target.value)})} inputMode="numeric" placeholder="010-1234-5678" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">이메일</div><input value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div className="pt-3 border-t mt-3"><div className="text-[11px] font-bold text-black/50 mb-1">현재 비밀번호</div><input value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})} type="password" placeholder="현재 비밀번호" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">새 비밀번호</div><input value={editForm.newPassword} onChange={e=>setEditForm({...editForm,newPassword:e.target.value})} type="password" placeholder="새 비밀번호" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <button onClick={handleUpdate} className="mt-4 w-full bg-black text-white rounded-full py-4 font-bold">저장하기</button>
              </div>
            </div>}
          </div>}
        </div>}

        {tab==="admin" && <div className="mt-6">
          {!isAdmin ? <div className="text-center py-20"><div className="font-black">관리자만 접근 가능</div></div> :
          <div><h2 className="text-[26px] font-black">관리자 대시보드</h2><div className="mt-4 grid grid-cols-3 gap-2"><div className="bg-black text-white rounded-2xl p-4"><div className="text-[11px] text-white/60">총 회원</div><div className="text-[22px] font-black">{adminData.users.length}명</div></div><div className="bg-violet-600 text-white rounded-2xl p-4"><div className="text-[11px] text-white/60">절약 진단</div><div className="text-[22px] font-black">{adminData.savings.length}건</div></div><div className="bg-amber-400 text-black rounded-2xl p-4"><div className="text-[11px]">추천</div><div className="text-[22px] font-black">{adminData.referrals?.length||0}건</div></div></div><div className="mt-6"><div className="flex justify-between"><h3 className="font-black">회원 목록</h3><button onClick={loadAdmin} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">새로고침</button></div><div className="mt-3 space-y-2">{adminData.users.map(u=><div key={u.id} className="border rounded-2xl p-4"><div className="flex justify-between"><span className="font-bold">{u.name}</span><span className="text-[11px] text-black/40">{u.created_at?.slice(0,10)}</span></div><div className="text-[12px] text-black/50 mt-1">{u.phone} | {u.email}</div></div>)}</div></div></div>}
        </div>}
      </div>

      {showAuth && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center p-4"><div className="bg-white rounded-[28px] w-full max-w-[400px] p-7 max-h-[90vh] overflow-auto"><div className="flex justify-between"><h3 className="text-[20px] font-black">{showAuth==="signup"?"회원가입":"로그인"}</h3><button onClick={()=>setShowAuth(null)} className="w-8 h-8 bg-black/5 rounded-full">X</button></div>
        <div className="mt-6 space-y-3">
          {showAuth==="signup" && <><input value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="이름" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><div><div className="text-[11px] font-bold text-black/50 mb-1">핸드폰 번호 (숫자만 입력)</div><input value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:formatPhone(e.target.value)})} inputMode="numeric" placeholder="010-1234-5678" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/></div></>}
          <input value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="이메일" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
          <input value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="비밀번호" type="password" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
          {showAuth==="signup" && <div><div className="text-[11px] font-bold text-black/50 mb-1">친구 추천 코드 (선택)</div><input value={authForm.referralCode} onChange={e=>setAuthForm({...authForm,referralCode:e.target.value})} placeholder="추천 코드 있으면 입력" className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-[14px]"/><div className="text-[10px] text-amber-600 mt-1">추천 코드 입력하면 1만원 혜택!</div></div>}
          <button onClick={submitAuth} className="w-full bg-black text-white rounded-full py-4 font-bold">{showAuth==="signup"?"가입하기 (1만원 혜택)":"로그인"}</button>
        </div>
      </div></div>}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t z-50"><div className="max-w-[480px] mx-auto px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"><div className="grid grid-cols-5 gap-1">
        <button onClick={()=>setTab("home")} className="flex flex-col items-center py-1.5 gap-1">{Icons.home(tab==="home")}<span className={"text-[10px] font-bold "+(tab==="home"?"text-black":"text-black/40")}>홈</span></button>
        <button onClick={()=>setTab("diag")} className="flex flex-col items-center py-1.5 gap-1">{Icons.diag(tab==="diag")}<span className={"text-[10px] font-bold "+(tab==="diag"?"text-black":"text-black/40")}>진단</span></button>
        <button onClick={()=>setTab("saving")} className="flex flex-col items-center py-1.5 gap-1">{Icons.saving(tab==="saving")}<span className={"text-[10px] font-bold "+(tab==="saving"?"text-violet-600":"text-black/40")}>절약</span></button>
        <button onClick={()=>setTab("referral")} className="flex flex-col items-center py-1.5 gap-1 relative">{Icons.referral(tab==="referral")}<span className={"text-[10px] font-bold "+(tab==="referral"?"text-amber-600":"text-black/40")}>추천</span>{auth && myReferrals.length>0 && <span className="absolute -top-0.5 right-3 w-2 h-2 bg-red-500 rounded-full"></span>}</button>
        <button onClick={()=>setTab("my")} className="flex flex-col items-center py-1.5 gap-1">{Icons.my(tab==="my")}<span className={"text-[10px] font-bold "+(tab==="my"?"text-black":"text-black/40")}>내정보</span></button>
      </div>
      {isAdmin && <div className="border-t mt-1 pt-1 flex justify-center"><button onClick={()=>{setTab("admin"); loadAdmin();}} className={"flex flex-col items-center py-1 gap-0.5 "+(tab==="admin"?"text-red-500":"text-red-500/50")}><div className={"w-5 h-5 flex items-center justify-center rounded-md "+(tab==="admin"?"bg-red-500 text-white":"bg-red-50")}><span className="text-[10px]">⚑</span></div><span className="text-[9px] font-bold">관리</span></button></div>}
      </div></div>
    </main>
  );
}
