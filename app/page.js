
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

const TabIcon = ({active, color, children}) => (
  <div className={"w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 "+(active?"-translate-y-0.5":"")}
       style={{backgroundColor: active ? color+"1F" : "transparent"}}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? color : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  </div>
);

const NAV = [
  {key:"home", label:"홈", color:"#111111", icon:<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>},
  {key:"diag", label:"진단", color:"#7C3AED", icon:<><path d="M4 19V5"/><path d="M4 19h16"/><path d="m8 15 3-4 3 2 5-6"/></>},
  {key:"saving", label:"절약", color:"#10B981", icon:<><circle cx="12" cy="12" r="9"/><path d="M9 9h4.5a1.5 1.5 0 0 1 0 3h-2.5a1.5 1.5 0 0 0 0 3H15"/><path d="M12 7v10"/></>},
  {key:"records", label:"기록", color:"#0EA5E9", icon:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>},
  {key:"referral", label:"추천", color:"#F59E0B", icon:<path d="M12 20s-7.5-4.4-7.5-9.5A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5C19.5 15.6 12 20 12 20z"/>},
  {key:"my", label:"설정", color:"#64748B", icon:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></>},
];

export default function Page(){
  const [tab,setTab]=useState("home");
  const [auth,setAuth]=useState(null);
  const [showAuth,setShowAuth]=useState(null);
  const [authForm,setAuthForm]=useState({name:"",phone:"",email:"",password:"",referralCode:"",agree:false});
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({
    name:"", carrier:"KT", phoneFee:"69,000", dataUsage:"11",
    ott:{netflix:false,youtube:false,disney:false,wavve:false,tving:false},
    loans:[{institution:"", amount:"30,000,000", rate:"4.8"}]
  });
  const [result,setResult]=useState(null);
  const [adminData,setAdminData]=useState({users:[],savings:[],referrals:[]});
  const [editMode,setEditMode]=useState(false);
  const [rateInfo,setRateInfo]=useState(null);
  const [creditInfo,setCreditInfo]=useState(null);
  const [jeonseInfo,setJeonseInfo]=useState(null);
  const [verifyCode,setVerifyCode]=useState("");
  const [resetStep,setResetStep]=useState(null);
  const [resetEmail,setResetEmail]=useState("");
  const [resetCode,setResetCode]=useState("");
  const [resetPw,setResetPw]=useState("");
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
      }
      const saved=localStorage.getItem("fixcut_my_diagnoses");
      if(saved){ try{ setMyDiagnoses(JSON.parse(saved)); }catch(e){} }
    }catch(e){}
  },[]);

  useEffect(()=>{
    if(auth){
      setEditForm({name:auth.name||"", phone:auth.phone||"", email:auth.email||"", password:"", newPassword:""});
    }
  }, [auth]);
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
          if(!d.ok||!d.user||d.mock) return;
          const fresh={name:d.user.name, phone:d.user.phone, email:d.user.email, verified:d.user.verified===true};
          localStorage.setItem("fixcut_auth", JSON.stringify(fresh));
          setAuth(fresh);
          setEditForm(prev=>({...prev, name:fresh.name, phone:fresh.phone, email:fresh.email}));
        })
        .catch(()=>{});
    }catch(e){}
  },[]);

  // 로그인한 회원의 이름을 진단 폼에 자동으로 채운다 (입력값이 있으면 유지)
  useEffect(()=>{
    if(auth?.name){
      setForm(prev => prev.name ? prev : {...prev, name: auth.name});
    }
  }, [auth]);

  // 진단 입력값, 결과, 현재 탭을 브라우저에 저장해 새로고침해도 유지한다
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{
    try{
      const f=localStorage.getItem("fixcut_diag_form");
      if(f) setForm(JSON.parse(f));
      const r=localStorage.getItem("fixcut_diag_result");
      if(r) setResult(JSON.parse(r));
      const st=localStorage.getItem("fixcut_diag_step");
      if(st) setStep(Number(st));
      const t=localStorage.getItem("fixcut_tab");
      if(t && t!=="admin") setTab(t);
    }catch(e){}
    setHydrated(true);
  },[]);
  useEffect(()=>{
    if(!hydrated) return;
    try{
      localStorage.setItem("fixcut_diag_form", JSON.stringify(form));
      localStorage.setItem("fixcut_diag_step", String(step));
      if(tab!=="admin") localStorage.setItem("fixcut_tab", tab);
      if(result) localStorage.setItem("fixcut_diag_result", JSON.stringify(result));
      else localStorage.removeItem("fixcut_diag_result");
    }catch(e){}
  },[hydrated, form, step, tab, result]);

  // 로그인 토큰 헤더 (기록 저장/조회용)
  const authHeaders = () => {
    try{
      const t = localStorage.getItem("fixcut_token");
      const a = JSON.parse(localStorage.getItem("fixcut_auth") || "null");
      const h = {};
      if(t) h.Authorization = "Bearer " + t;
      if(a?.email) h["X-User-Email"] = a.email;
      return h;
    }catch(e){ return {}; }
  };
  const [myRecords,setMyRecords]=useState([]);
  useEffect(()=>{
    if(tab!=="records" || !auth?.email) return;
    fetch("/api/my-diagnoses?email="+encodeURIComponent(auth.email), {headers: authHeaders()})
      .then(async r=>{ const d = await r.json().catch(()=>({})); if(r.status===401){ setMyRecords(null); return; } setMyRecords(d.ok ? (d.savings||[]) : "error"); })
      .catch(()=>setMyRecords("error"));
  },[tab, auth]);

  // 절약 탭을 열었는데 이 브라우저에 결과가 없으면, DB의 최근 진단 기록을 불러온다
  useEffect(()=>{
    if(tab!=="saving" || !auth?.email || result) return;
    fetch("/api/my-diagnoses?email="+encodeURIComponent(auth.email), {headers: authHeaders()})
      .then(r=>r.json())
      .then(d=>{
        const latest = d.ok && d.savings && d.savings[0];
        if(!latest) return;
        setResult({total: latest.total, details: latest.details || []});
        const inp = latest.inputs;
        if(inp && inp.carrier){
          setForm(prev=>({
            ...prev,
            carrier: inp.carrier,
            phoneFee: inp.phoneFee || prev.phoneFee,
            dataUsage: inp.dataUsage || prev.dataUsage,
            ott: inp.ott || prev.ott,
            loans: (inp.loans && inp.loans.length) ? inp.loans : prev.loans
          }));
        }
      })
      .catch(()=>{});
  },[tab, auth, result]);

  // 포인트, 추천 코드, 추천 현황을 서버에서 불러온다
  const [points,setPoints]=useState({code:"",balance:0,pending:0,items:[],referrals:[]});
  useEffect(()=>{
    if(!auth?.email){ setPoints({code:"",balance:0,pending:0,items:[],referrals:[]}); return; }
    fetch("/api/points?email="+encodeURIComponent(auth.email), {headers: authHeaders()})
      .then(r=>r.json())
      .then(d=>{
        if(!d.ok) return;
        setPoints({code:d.code||"", balance:d.balance||0, pending:d.pending||0, items:d.items||[], referrals:d.referrals||[]});
        if(d.code) setReferralCode(d.code);
      })
      .catch(()=>{});
  },[auth, tab]);

  // 관리자 여부는 서버(DB의 is_admin)가 판단한다
  const [isAdminUser,setIsAdminUser]=useState(false);
  useEffect(()=>{
    if(!auth){ setIsAdminUser(false); return; }
    fetch("/api/admin/check", {headers: authHeaders()})
      .then(r=>r.json())
      .then(d=>setIsAdminUser(d.isAdmin===true))
      .catch(()=>setIsAdminUser(false));
  },[auth]);
  const isAdmin = isAdminUser;

  const loadAdmin = () => {
    fetch("/api/admin/list", {headers: authHeaders()}).then(r=>r.json()).then(d=>setAdminData(prev=>({...prev, ...d}))).catch(()=>{});
    fetch("/api/referral?all=1", {headers: authHeaders()}).then(r=>r.json()).then(d=>setAdminData(prev=>({...prev, referrals:d.referrals||[]}))).catch(()=>{});
  };

  const handleUpdate = async () => {
    const name = editForm.name.trim();
    const phone = editForm.phone.trim();
    const email = editForm.email.trim().toLowerCase();
    if(!name || !phone || !email){
      alert("이름, 핸드폰, 이메일은 필수입니다");
      return;
    }
    if(!editForm.password){
      alert("정보를 수정하려면 현재 비밀번호를 입력해 주세요");
      return;
    }
    try{
      const res = await fetch("/api/auth/update", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({oldEmail:auth.email, currentPassword:editForm.password, name, phone, email, newPassword:editForm.newPassword})});
      const data = await res.json().catch(()=>({}));
      if(!res.ok || !data.ok){
        alert("정보 변경 실패: "+(data.error||"다시 시도해 주세요"));
        return;
      }
      if(data.token) localStorage.setItem("fixcut_token", data.token);
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
    if(isSignup && !authForm.agree){
      alert("필수 약관에 동의해 주세요");
      return;
    }
    const incomingRef = localStorage.getItem("fixcut_incoming_ref") || authForm.referralCode;
    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const body = isSignup
      ? {name:authForm.name.trim(), phone:authForm.phone.trim(), email:authForm.email.trim(), password:authForm.password, referralCode:incomingRef||"", agreeTerms:authForm.agree===true}
      : {email:authForm.email.trim(), password:authForm.password};
    let data;
    try{
      const res = await fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
      data = await res.json().catch(()=>({}));
      if(!res.ok || !data.ok){
        alert(isSignup ? "회원가입 실패: "+(data.error||"다시 시도해 주세요") : (res.status===403 ? data.error : "이메일 또는 비밀번호가 올바르지 않습니다"));
        return;
      }
    }catch(e){
      alert("네트워크 오류입니다. 다시 시도해 주세요");
      return;
    }
    // DB가 설정되지 않은 환경(mock)의 응답은 저장하지 않고, 입력값을 사용한다
    if(data.token) localStorage.setItem("fixcut_token", data.token);
    const srv = data.mock ? null : data.user;
    const user = {
      name: srv?.name ?? (isSignup ? authForm.name.trim() : authForm.email.trim().split("@")[0]),
      phone: srv?.phone ?? authForm.phone.trim(),
      email: srv?.email ?? authForm.email.trim().toLowerCase(),
      verified: srv?.verified === true,
    };
    localStorage.setItem("fixcut_auth", JSON.stringify(user));
    // 추천 코드는 서버가 발급한 값을 사용한다
    setReferralCode(data.referral_code || "");
    if(isSignup){ localStorage.removeItem("fixcut_incoming_ref"); }
    setAuth(user);
    setEditForm({name:user.name, phone:user.phone, email:user.email, password:"", newPassword:""});
    setShowAuth(null);
  };

  const saveDiagnosis = async (r) => {
    try{
      const res = await fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json", ...authHeaders()},body:JSON.stringify({name:form.name,phone:auth?.phone||"",email:auth?.email||"",total:r.total,details:r.details,inputs:{carrier:form.carrier,phoneFee:form.phoneFee,dataUsage:form.dataUsage,ott:form.ott,loans:form.loans}})});
      const d = await res.json().catch(()=>({}));
      if(!res.ok){ alert(d.error || "진단 기록을 저장하지 못했습니다"); return; }
      if(!auth) alert("로그인하지 않아서 이 기록은 내 기록에 저장되지 않았어요");
    }catch(e){ alert("네트워크 오류로 진단 기록을 저장하지 못했습니다"); }
  };
  // 신용점수 -> 금감원 공시 구간 (900 초과, 801~900, 701~800, 601~700, 501~600, 401~500, 301~400, 300 이하)
  const creditBand=s=>{ const n=Number(s); if(!(n>=0)) return null; if(n>900) return "1"; if(n>=801) return "4"; if(n>=701) return "5"; if(n>=601) return "6"; if(n>=501) return "10"; if(n>=401) return "11"; if(n>=301) return "12"; return "13"; };
  const benchTextOf=(m,c,j)=>"주택담보 "+(m? m.benchmarkRate+"%" : "3.2%(고정값)")+", 신용 "+(c&&c.byCb? "신용점수·CB 구간별 금감원 공시 값" : "3.2%(고정값)")+", 전세 "+(j? j.benchmarkRate+"%" : "3.2%(고정값)")+" (상품별 평균금리 최저값)";
  const calc=(bench)=>{
    const bm = bench || {};
    const pick = k => (typeof bm[k] === "number" && bm[k] > 0) ? bm[k] : 3.2;
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
      const B = loan.kind==="mortgage" ? pick("mortgage") : loan.kind==="credit" ? ((bm.creditByCb?.[loan.cb] || bm.creditByCb?.ALL)?.[creditBand(loan.score)]?.rate ?? 3.2) : loan.kind==="jeonse" ? pick("jeonse") : 3.2;
      if(amt>=1000000 && rate>B){
        const ms=Math.round(amt*(rate-B)/100/12);
        if(ms>0){t+=ms; d.push({title:`${loan.institution||"대출"+(idx+1)} ${rate}% → ${B}% 대환`,save:ms, desc:`${loan.institution||"대출"} ${formatComma(amt)}원 기준`});}
      }
    });
    return {total:t,details:d};
  };

  useEffect(()=>{
    fetch("/api/rates?type=mortgage").then(r=>r.json()).then(d=>{ if(d.ok && d.summary) setRateInfo(d.summary); }).catch(()=>{});
  },[]);


  useEffect(()=>{
    fetch("/api/rates?type=credit").then(r=>r.json()).then(d=>{ if(d.ok && d.summary) setCreditInfo(d.summary); }).catch(()=>{});
  },[]);

  useEffect(()=>{
    fetch("/api/rates?type=jeonse").then(r=>r.json()).then(d=>{ if(d.ok && d.summary) setJeonseInfo(d.summary); }).catch(()=>{});
  },[]);

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
          <div className="flex gap-2">{auth ? <><span className="text-[12px] font-bold">{auth.name}님</span><button onClick={()=>{localStorage.removeItem("fixcut_auth"); localStorage.removeItem("fixcut_token"); setAuth(null); setMyRecords([]); setTab("home");}} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">로그아웃</button></> : <><button onClick={()=>setShowAuth("login")} className="text-[12px] font-bold">로그인</button><button onClick={()=>setShowAuth("signup")} className="text-[12px] bg-black text-white px-4 py-1.5 rounded-full font-bold">회원가입</button></>}</div>
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
                    <select value={loan.kind||""} onChange={e=>{const nl=[...form.loans]; nl[idx].kind=e.target.value; setForm({...form, loans:nl});}} className="w-full bg-white border rounded-xl px-4 py-3.5 text-[14px] font-bold">
                      <option value="">대출 종류 선택</option>
                      <option value="mortgage">주택담보대출</option>
                      <option value="credit">신용대출</option>
                      <option value="jeonse">전세자금대출</option>
                      <option value="other">기타</option>
                    </select>
                    {loan.kind==="credit" && <div className="space-y-2"><select value={loan.cb||""} onChange={e=>{const nl=[...form.loans]; nl[idx].cb=e.target.value; setForm({...form, loans:nl});}} className="w-full bg-white border rounded-xl px-4 py-3.5 text-[14px] font-bold"><option value="">CB 선택 (KCB / NICE)</option><option value="KCB">KCB</option><option value="NICE">NICE</option></select><input value={loan.score||""} onChange={e=>{const nl=[...form.loans]; nl[idx].score=e.target.value.replace(/[^0-9]/g,"").slice(0,4); setForm({...form, loans:nl});}} inputMode="numeric" placeholder="신용점수 (0~1000)" className="w-full bg-white border rounded-xl px-4 py-3.5 text-[14px] font-bold"/></div>}
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
            <div className="mt-6 flex gap-2"><button onClick={()=>setStep(3)} className="flex-1 bg-black/5 rounded-full py-4 font-bold">이전</button><button onClick={()=>{if(form.loans.some(l=>(!l.kind && (l.amount || l.rate)) || (l.kind==="credit" && (l.score===""||l.score===undefined||!l.cb)))){alert("대출 종류를 선택해 주세요. 신용대출은 신용점수와 CB(KCB/NICE)도 입력해 주세요"); return;} const r={...calc({mortgage: rateInfo?.benchmarkRate ?? null, credit: creditInfo?.benchmarkRate ?? null, creditByCb: creditInfo?.byCb ?? null, jeonse: jeonseInfo?.benchmarkRate ?? null}), benchText: benchTextOf(rateInfo, creditInfo, jeonseInfo), asOf: rateInfo?.asOf || creditInfo?.asOf || jeonseInfo?.asOf || null}; setResult(r); setTab("saving"); saveDiagnosis(r);}} className="flex-[2] bg-black text-white rounded-full py-4 font-bold">결과 보기 ({form.loans.length}건 계산)</button></div>
          </div>}
        </div>}

        {tab==="saving" && <div className="mt-6">{!result ? <div className="text-center py-20"><div className="text-[14px] font-bold">진단 먼저 해주세요</div><button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-4 bg-black text-white rounded-full px-6 py-2 text-[13px]">진단하기</button></div> : <div><h2 className="text-[26px] font-black">월 약 {formatComma(result.total)}원 절약 <span className="text-[13px] font-bold text-black/40">(추정)</span></h2><p className="text-[13px] text-black/50 mt-1">아래 방법으로 절약할 수 있어요</p><div className="mt-6 space-y-3">{result.details.map((d,i)=><div key={i} className="border rounded-2xl p-4 flex justify-between items-center"><div><div className="font-bold text-[14px]">{d.title}</div><div className="text-[11px] text-black/40 mt-0.5">{d.desc}</div></div><div className="font-black text-violet-600 text-[15px]">{formatComma(d.save)}원</div></div>)}</div>{result.details.length===0 && <div className="text-center py-10 bg-gray-50 rounded-2xl mt-4"><div className="text-[13px] font-bold">절약할 항목이 없어요!</div><div className="text-[11px] text-black/40 mt-1">이미 알뜰하게 관리 중이시네요</div></div>}<div className="mt-4 text-[11px] text-black/40 leading-relaxed">※ 추정치입니다. 알뜰폰 요금은 데이터 15GB 이하 기준 19,900원(초과 29,700원), 대환 기준금리는 {result.benchText ?? "3.2%(고정값)"}로 가정하고, 대출 원금 전체를 금리 차이만큼 낮춘다고 계산했습니다. {result.asOf ? "금감원 공시 기준 "+result.asOf+", " : ""}실제 조건과 결과는 다를 수 있습니다.</div><div className="mt-2 text-[11px] text-black/40 leading-relaxed">대환 기준금리는 금융감독원 '금융상품 한눈에'의 주택담보·신용·전세자금대출 상품별 평균금리 중 최저값이며, 우대 조건이 적용된 상품을 포함합니다. 실제 적용 금리는 개인의 신용도, 담보, 조건에 따라 달라질 수 있습니다. 신용대출 금리는 CB사(NICE·KCB) 신용점수 구간별로 공시된 직전월 신규 취급 대출의 가중평균금리입니다.</div>
                <div className="mt-6 bg-gray-50 rounded-2xl p-4"><div className="text-[11px] font-bold text-black/50">입력한 정보</div><div className="text-[12px] mt-2 space-y-1"><div>통신사: {form.carrier} / {formatComma(parseNumber(form.phoneFee))}원 / {form.dataUsage}GB</div><div>대출: {form.loans.length}건 {form.loans.map(l=> (l.institution||"대출")+" "+(l.amount?formatComma(parseNumber(l.amount))+"원 ":"")+ (l.rate?l.rate+"% ":"")).join(", ")}</div></div></div></div>}</div>}

        {tab==="records" && <div className="mt-6">
          {!auth ? <div className="text-center py-20"><div className="font-bold">로그인이 필요해요</div><button onClick={()=>setShowAuth("login")} className="mt-4 bg-black text-white rounded-full px-6 py-2">로그인</button></div> :
          <>
            <div className="mt-6">
              <h3 className="font-black text-[16px]">내 진단 기록</h3>
              {myRecords===null ? <p className="text-[12px] text-black/50 mt-2">기록을 보려면 다시 로그인해 주세요</p>
                : myRecords==="error" ? <p className="text-[12px] text-red-500 mt-2">기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요</p>
                : myRecords.length===0 ? <p className="text-[12px] text-black/50 mt-2">아직 저장된 진단 기록이 없어요</p>
                : <div className="mt-3 space-y-2">{myRecords.map(r=><div key={r.id} className="border rounded-2xl p-4">
                    <div className="flex justify-between"><span className="font-bold text-[14px]">{formatComma(r.total||0)}원 절약</span><span className="text-[11px] text-black/40">{String(r.created_at).slice(0,10)}</span></div>
                    {(() => {
                      const items = r.details || [];
                      const carrier = items.filter(d=>d.title.includes("알뜰폰"));
                      const others = items.filter(d=>!d.title.includes("알뜰폰"));
                      return <div className="text-[12px] text-black/50 mt-1 space-y-1">
                        {carrier.length>0 && <div>{carrier.map(d=>d.title).join(" / ")}</div>}
                        {others.length>0 && <div>{others.map(d=>d.title).join(" / ")}</div>}
                      </div>;
                    })()}
                  </div>)}</div>}
            </div>

          </>}
        </div>}

        {tab==="referral" && <div className="mt-6">
          <h2 className="text-[26px] font-black leading-tight">친구 추천하면<br/><span className="text-amber-500">둘 다 1만 포인트!</span></h2>
          {!auth ? <div className="text-center py-16"><div className="font-bold">로그인이 필요해요</div><button onClick={()=>setShowAuth("login")} className="mt-4 bg-black text-white rounded-full px-6 py-2">로그인</button></div> : <>
          <div className="mt-6 bg-black text-white rounded-[24px] p-6">
            <div className="text-[11px] text-white/50">내 추천 코드</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-[24px] font-black tracking-widest break-all">{referralCode||"발급 중"}</div>
              <button onClick={copyLink} className="bg-white text-black rounded-full px-4 py-2 text-[12px] font-bold">{copied?"복사됨!":"복사"}</button>
            </div>
            <div className="mt-4 bg-white/10 rounded-xl p-3 text-[11px] break-all">{shareLink}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={shareKakao} className="bg-[#FEE500] text-black rounded-full py-3 font-bold text-[13px]">카톡 공유</button>
              <button onClick={copyLink} className="bg-white text-black rounded-full py-3 font-bold text-[13px]">링크 복사</button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center"><div className="text-[20px] font-black">{formatComma(points.balance)}원</div><div className="text-[11px] text-black/50">사용 가능 포인트</div></div>
            <div className="bg-gray-50 border rounded-2xl p-4 text-center"><div className="text-[20px] font-black">{formatComma(points.pending)}원</div><div className="text-[11px] text-black/50">적립 대기</div></div>
          </div>
          <div className="mt-3 text-[11px] text-black/40 leading-relaxed">※ 포인트는 본인 인증과 첫 진단을 마친 뒤 적립됩니다. 적립 포인트는 적립일부터 12개월 동안 유효하며, 사용처는 추후 안내됩니다.</div>
          <div className="mt-8"><h3 className="font-black">추천 현황</h3>
            <div className="mt-3 space-y-2">
              {points.referrals.length===0 ? <div className="text-center py-8 bg-gray-50 rounded-2xl"><div className="text-[13px] font-bold">아직 추천한 친구가 없어요</div><div className="text-[11px] text-black/40 mt-1">친구에게 링크를 공유해 보세요</div></div> :
              points.referrals.map(r=><div key={r.id} className="border rounded-2xl p-4 flex justify-between items-center"><div><div className="font-bold text-[14px]">{r.referred_name||"친구"}</div><div className="text-[11px] text-black/40">{String(r.created_at).slice(0,10)} 가입</div></div><span className={"text-[11px] font-bold px-2 py-1 rounded-full "+(r.done?"bg-emerald-50 text-emerald-600":"bg-gray-100 text-black/50")}>{r.done?"적립 완료":"인증·진단 대기"}</span></div>)}
            </div>
          </div>
          <div className="mt-8"><h3 className="font-black">포인트 내역</h3>
            <div className="mt-3 space-y-2">
              {points.items.length===0 ? <div className="text-[12px] text-black/40 py-4 text-center">아직 포인트 내역이 없어요</div> :
              points.items.map(it=><div key={it.id} className="border rounded-2xl p-4 flex justify-between items-center">
                <div><div className="font-bold text-[13px]">{it.reason==="referral_referrer"?"친구 추천 적립":"추천 가입 혜택"}</div><div className="text-[11px] text-black/40">{String(it.created_at).slice(0,10)}{it.expires_at ? " · "+String(it.expires_at).slice(0,10)+"까지" : ""}</div></div>
                <div className="text-right"><div className="font-black text-[14px]">+{formatComma(it.amount)}원</div><div className="text-[11px] text-black/40">{it.status==="confirmed"?"적립 완료":"대기"}</div></div>
              </div>)}
            </div>
          </div>
          </>}
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


            <div className="mt-8"><h3 className="font-black text-[15px]">계정</h3>
              <div className="mt-3 border rounded-2xl divide-y">
                <button onClick={()=>{setEditMode(true); setEditForm({name:auth.name,phone:auth.phone,email:auth.email,password:"",newPassword:""});}} className="w-full flex justify-between items-center px-4 py-3 text-[13px]"><span>내 정보 수정</span><span className="text-black/30">›</span></button>
                <button onClick={()=>{setEditMode(true); setEditForm({name:auth.name,phone:auth.phone,email:auth.email,password:"",newPassword:""});}} className="w-full flex justify-between items-center px-4 py-3 text-[13px]"><span>비밀번호 변경</span><span className="text-black/30">›</span></button>
                <div className="w-full px-4 py-3 text-[13px]">
                  <div className="flex justify-between items-center"><span>이메일 인증</span><span className={auth.verified?"text-emerald-600 font-bold":"text-amber-600 font-bold"}>{auth.verified?"인증 완료":"인증 필요"}</span></div>
                  {!auth.verified && <div className="mt-1 text-[11px] text-black/50">인증해야 추천 포인트가 적립됩니다. 인증번호는 10분 동안 유효합니다.</div>}
                  {!auth.verified && <div className="mt-3 flex gap-2">
                    <button onClick={async()=>{
                      try{
                        const r=await fetch("/api/auth/verify/send",{method:"POST",headers:{"Content-Type":"application/json", ...authHeaders()},body:JSON.stringify({email:auth.email})});
                        const d=await r.json().catch(()=>({}));
                        if(d.verified){ const u={...auth, verified:true}; localStorage.setItem("fixcut_auth", JSON.stringify(u)); setAuth(u); return; }
                        alert(r.ok ? "인증번호를 보냈습니다. 메일함을 확인해 주세요" : (d.error||"발송에 실패했습니다"));
                      }catch(e){ alert("네트워크 오류입니다. 다시 시도해 주세요"); }
                    }} className="bg-black/5 px-4 py-2 rounded-full text-[12px] font-bold">인증번호 받기</button>
                    <input value={verifyCode} onChange={e=>setVerifyCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6자리" inputMode="numeric" className="flex-1 min-w-0 bg-gray-50 border rounded-full px-4 py-2 text-[13px]"/>
                    <button onClick={async()=>{
                      try{
                        const r=await fetch("/api/auth/verify/confirm",{method:"POST",headers:{"Content-Type":"application/json", ...authHeaders()},body:JSON.stringify({email:auth.email, code:verifyCode})});
                        const d=await r.json().catch(()=>({}));
                        if(r.ok && d.verified){ const u={...auth, verified:true}; localStorage.setItem("fixcut_auth", JSON.stringify(u)); setAuth(u); setVerifyCode(""); alert("인증이 완료되었습니다"); }
                        else alert(d.error||"인증에 실패했습니다");
                      }catch(e){ alert("네트워크 오류입니다. 다시 시도해 주세요"); }
                    }} className="bg-black text-white px-4 py-2 rounded-full text-[12px] font-bold">확인</button>
                  </div>}
                </div>
                <button onClick={async()=>{ try{ const r=await fetch("/api/auth/export",{headers:authHeaders()}); if(!r.ok){ const d=await r.json().catch(()=>({})); alert(d.error||"내려받기에 실패했습니다"); return; } const blob=await r.blob(); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="fixcut-my-data.json"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }catch(e){ alert("네트워크 오류입니다. 다시 시도해 주세요"); } }} className="w-full flex justify-between items-center px-4 py-3 text-[13px]"><span>내 정보 내려받기 (JSON)</span><span className="text-black/30">›</span></button>
                <button onClick={()=>{localStorage.removeItem("fixcut_auth"); localStorage.removeItem("fixcut_token"); setAuth(null); setMyRecords([]); setTab("home");}} className="w-full flex justify-between items-center px-4 py-3 text-[13px]"><span>로그아웃</span><span className="text-black/30">›</span></button>
                <button onClick={async()=>{
                if(!confirm("정말 탈퇴하시겠어요?\n회원 정보와 진단 기록이 모두 삭제되며 되돌릴 수 없습니다.")) return;
                const pw = prompt("확인을 위해 현재 비밀번호를 입력해 주세요");
                if(!pw) return;
                try{
                  const res = await fetch("/api/auth/withdraw", {method:"POST", headers:{"Content-Type":"application/json", ...authHeaders()}, body:JSON.stringify({currentPassword:pw})});
                  const data = await res.json().catch(()=>({}));
                  if(!res.ok || !data.ok){ alert("탈퇴 실패: "+(data.error||"다시 시도해 주세요")); return; }
                }catch(e){ alert("네트워크 오류로 탈퇴하지 못했습니다"); return; }
                ["fixcut_auth","fixcut_token","fixcut_ref_code","fixcut_diag_form","fixcut_diag_result","fixcut_diag_step","fixcut_tab"].forEach(k=>localStorage.removeItem(k));
                setAuth(null); setMyRecords([]); setResult(null); setEditMode(false); setTab("home");
                alert("탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
              }} className="w-full flex justify-between items-center px-4 py-3 text-[13px] text-red-500"><span>회원 탈퇴</span><span>›</span></button>
              </div>
            </div>
            <div className="mt-8"><h3 className="font-black text-[15px]">약관 및 정책</h3>
              <div className="mt-3 border rounded-2xl divide-y">
                {["이용약관","개인정보 처리방침","추천·혜택 약관","마케팅 정보 수신 동의"].map(t=>
                  <div key={t} className="flex justify-between items-center px-4 py-3 text-[13px]"><span>{t}</span><span className="text-[11px] text-black/40">준비 중</span></div>)}
              </div>
              <h3 className="font-black text-[15px] mt-6">고객 지원</h3>
              <div className="mt-3 border rounded-2xl divide-y">
                <div className="flex justify-between items-center px-4 py-3 text-[13px]"><span>문의하기</span><span className="text-[11px] text-black/40">준비 중</span></div>
                <div className="flex justify-between items-center px-4 py-3 text-[13px]"><span>앱 버전</span><span className="text-[11px] text-black/40">1.0.0</span></div>
              </div>
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
          <div><h2 className="text-[26px] font-black">관리자 대시보드</h2><div className="mt-4 grid grid-cols-3 gap-2"><div className="bg-black text-white rounded-2xl p-4"><div className="text-[11px] text-white/60">총 회원</div><div className="text-[22px] font-black">{adminData.users.length}명</div></div><div className="bg-violet-600 text-white rounded-2xl p-4"><div className="text-[11px] text-white/60">절약 진단</div><div className="text-[22px] font-black">{adminData.savings.length}건</div></div><div className="bg-amber-400 text-black rounded-2xl p-4"><div className="text-[11px]">추천</div><div className="text-[22px] font-black">{adminData.referrals?.length||0}건</div></div></div><div className="mt-6"><div className="flex justify-between"><h3 className="font-black">회원 목록</h3><button onClick={loadAdmin} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">새로고침</button></div><div className="mt-3 space-y-2">{adminData.users.map(u=><div key={u.id} className="border rounded-2xl p-4"><div className="flex justify-between items-center"><span className="font-bold">{u.name} {u.suspended && <span className="text-[11px] text-red-500">[정지]</span>}</span><span className="text-[11px] text-black/40">{u.created_at?.slice(0,10)}</span></div><div className="text-[12px] text-black/50 mt-1">{u.phone} | {u.email}</div><div className="mt-2 flex justify-end"><button onClick={async()=>{ if(!confirm((u.suspended?"정지를 해제":"정지")+"할까요?\n"+u.email)) return; try{ const r=await fetch("/api/admin/users/suspend",{method:"POST",headers:{"Content-Type":"application/json", ...authHeaders()},body:JSON.stringify({id:u.id, suspend:!u.suspended})}); const d=await r.json().catch(()=>({})); if(r.ok) loadAdmin(); else alert(d.error||"처리에 실패했습니다"); }catch(e){ alert("네트워크 오류입니다. 다시 시도해 주세요"); } }} className={"text-[11px] px-3 py-1 rounded-full font-bold "+(u.suspended?"bg-black/5":"bg-red-50 text-red-600")}>{u.suspended?"정지 해제":"정지"}</button></div></div>)}</div></div></div>}
        </div>}
      </div>

      {showAuth && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center p-4"><div className="bg-white rounded-[28px] w-full max-w-[400px] p-7 max-h-[90vh] overflow-auto"><div className="flex justify-between"><h3 className="text-[20px] font-black">{showAuth==="signup"?"회원가입":"로그인"}</h3><button onClick={()=>setShowAuth(null)} className="w-8 h-8 bg-black/5 rounded-full">X</button></div>
        <div className="mt-6 space-y-3">
          {showAuth==="signup" && <><input value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="이름" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><div><div className="text-[11px] font-bold text-black/50 mb-1">핸드폰 번호 (숫자만 입력)</div><input value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:formatPhone(e.target.value)})} inputMode="numeric" placeholder="010-1234-5678" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/></div></>}
          <input value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="이메일" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
          <input value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="비밀번호" type="password" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
          {showAuth==="signup" && <div><div className="text-[11px] font-bold text-black/50 mb-1">친구 추천 코드 (선택)</div><input value={authForm.referralCode} onChange={e=>setAuthForm({...authForm,referralCode:e.target.value})} placeholder="추천 코드 있으면 입력" className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-[14px]"/><div className="text-[10px] text-amber-600 mt-1">추천 코드 입력하면 1만원 혜택!</div></div>}
          {showAuth==="signup" && <label className="flex items-start gap-2 text-[12px] text-black/60"><input type="checkbox" checked={authForm.agree} onChange={e=>setAuthForm({...authForm,agree:e.target.checked})} className="mt-0.5"/><span>[필수] 이용약관 및 개인정보 처리방침에 동의합니다</span></label>}
          <button onClick={submitAuth} className="w-full bg-black text-white rounded-full py-4 font-bold">{showAuth==="signup"?"가입하기 (1만원 혜택)":"로그인"}</button>
          {showAuth==="login" && <button onClick={()=>{setResetStep("request"); setResetEmail(authForm.email); setResetCode(""); setResetPw("");}} className="w-full text-[12px] text-black/50 underline">비밀번호를 잊으셨나요?</button>}
        </div>
      </div></div>}
      {resetStep && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-end justify-center p-4"><div className="bg-white rounded-[28px] w-full max-w-[400px] p-7 max-h-[90vh] overflow-auto">
        <div className="flex justify-between"><h3 className="text-[20px] font-black">비밀번호 재설정</h3><button onClick={()=>setResetStep(null)} className="w-8 h-8 bg-black/5 rounded-full">✕</button></div>
        <div className="mt-6 space-y-3">
          <input value={resetEmail} onChange={e=>setResetEmail(e.target.value)} disabled={resetStep==="confirm"} placeholder="가입한 이메일" className="w-full bg-gray-50 border rounded-2xl px-5 py-4 disabled:opacity-60"/>
          {resetStep==="request" && <button onClick={async()=>{
            try{
              const r=await fetch("/api/auth/reset/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:resetEmail})});
              const d=await r.json().catch(()=>({}));
              if(r.ok){ setResetStep("confirm"); alert(d.message||"인증번호를 보냈습니다"); }
              else alert(d.error||"요청에 실패했습니다");
            }catch(e){ alert("네트워크 오류입니다. 다시 시도해 주세요"); }
          }} className="w-full bg-black text-white rounded-full py-4 font-bold">인증번호 받기</button>}
          {resetStep==="confirm" && <>
            <input value={resetCode} onChange={e=>setResetCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="인증번호 6자리" inputMode="numeric" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
            <input value={resetPw} onChange={e=>setResetPw(e.target.value)} type="password" placeholder="새 비밀번호 (8자 이상, 영문+숫자)" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/>
            <button onClick={async()=>{
              try{
                const r=await fetch("/api/auth/reset/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:resetEmail, code:resetCode, newPassword:resetPw})});
                const d=await r.json().catch(()=>({}));
                if(r.ok && d.ok){
                  alert("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요");
                  setResetStep(null);
                  setAuthForm(prev=>({...prev, email:resetEmail, password:""}));
                  setShowAuth("login");
                } else alert(d.error||"변경에 실패했습니다");
              }catch(e){ alert("네트워크 오류입니다. 다시 시도해 주세요"); }
            }} className="w-full bg-black text-white rounded-full py-4 font-bold">비밀번호 변경</button>
            <button onClick={()=>setResetStep("request")} className="w-full text-[12px] text-black/50 underline">인증번호 다시 받기</button>
          </>}
        </div>
      </div></div>}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t z-50 shadow-[0_-6px_24px_rgba(0,0,0,0.05)]"><div className="max-w-[480px] mx-auto px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2"><div className="grid grid-cols-6 gap-0.5">
        {NAV.map(n=>{const on=tab===n.key; return (
          <button key={n.key} onClick={()=>setTab(n.key)} className="flex flex-col items-center pt-1 gap-0.5 relative">
            <TabIcon active={on} color={n.color}>{n.icon}</TabIcon>
            <span className="text-[12px] font-bold transition-colors" style={{color: on ? n.color : "#9CA3AF"}}>{n.label}</span>
            {n.key==="referral" && auth && myReferrals.length>0 && <span className="absolute top-0 right-3 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>
        ); })}
      </div>
      {isAdmin && <div className="border-t mt-1 pt-1 flex justify-center"><button onClick={()=>{setTab("admin"); loadAdmin();}} className={"flex flex-col items-center py-1 gap-0.5 "+(tab==="admin"?"text-red-500":"text-red-500/50")}><div className={"w-5 h-5 flex items-center justify-center rounded-md "+(tab==="admin"?"bg-red-500 text-white":"bg-red-50")}><span className="text-[10px]">⚑</span></div><span className="text-[9px] font-bold">관리</span></button></div>}
      </div></div>
    </main>
  );
}
