"use client";
import { useState, useEffect } from "react";

const Icons = {
  home: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-black text-white":"bg-black/5")}><span className="text-[14px]">⌂</span></div>,
  diag: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-black text-white":"bg-black/5")}><span className="text-[14px]">◍</span></div>,
  saving: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-violet-600 text-white":"bg-black/5")}><span className="text-[12px]">₩</span></div>,
  my: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-full "+(a?"bg-black text-white":"bg-black/5")}><span className="text-[12px]">☺</span></div>,
  admin: (a)=> <div className={"w-6 h-6 flex items-center justify-center rounded-lg "+(a?"bg-red-500 text-white":"bg-red-50 text-red-500")}><span className="text-[12px]">⚑</span></div>,
};

export default function Page(){
  const [tab,setTab]=useState("home");
  const [auth,setAuth]=useState(null);
  const [showAuth,setShowAuth]=useState(null);
  const [authForm,setAuthForm]=useState({name:"",phone:"",email:"",password:""});
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:"",carrier:"KT",phoneFee:69000,dataUsage:11,ott:{netflix:false,youtube:false,disney:false,wavve:false,tving:false},loanAmount:30000000,loanRate:4.8});
  const [result,setResult]=useState(null);
  const [adminData,setAdminData]=useState({users:[],savings:[]});
  const [editMode,setEditMode]=useState(false);
  const [editForm,setEditForm]=useState({name:"",phone:"",email:"",password:"",newPassword:""});

  useEffect(()=>{
    try{
      const s=localStorage.getItem("fixcut_auth");
      if(s){
        const u=JSON.parse(s);
        setAuth(u);
        setEditForm({name:u.name||"",phone:u.phone||"",email:u.email||"",password:"",newPassword:""});
      }
    }catch(e){}
  },[]);

  const isAdmin = auth && (
    auth.email === "parkhy5454@gmail.com" ||
    auth.email === "admin@fixcut.com" ||
    auth.email?.includes("parkhy") ||
    auth.name === "관리자"
  );

  const loadAdmin = () => {
    fetch("/api/admin/list").then(r=>r.json()).then(d=>setAdminData(d)).catch(()=>{});
  };

  const handleUpdate = async () => {
    if(!editForm.name || !editForm.phone || !editForm.email){
      alert("이름, 핸드폰, 이메일은 필수입니다");
      return;
    }
    const newAuth = {name:editForm.name, phone:editForm.phone, email:editForm.email};
    localStorage.setItem("fixcut_auth", JSON.stringify(newAuth));
    setAuth(newAuth);
    try{
      await fetch("/api/auth/update", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({oldEmail:auth.email, ...editForm})});
    }catch(e){}
    alert("정보가 변경되었습니다");
    setEditMode(false);
  };

  const calc=()=>{
    let t=0; let d=[];
    if(form.carrier!=="알뜰폰" && form.phoneFee>30000){
      const tar=form.dataUsage<=15?19900:29700;
      const sv=form.phoneFee-tar;
      if(sv>0){t+=sv; d.push({title:form.carrier+" "+form.phoneFee.toLocaleString()+"원 알뜰폰 절약",save:sv});}
    }
    const fees={netflix:17000,youtube:14900,disney:9900,wavve:13900,tving:13900};
    Object.keys(form.ott).forEach(k=>{
      if(form.ott[k]){ t+=fees[k]; d.push({title:k.toUpperCase(),save:fees[k]}); }
    });
    if(form.loanAmount>=5000000 && form.loanRate>3.5){
      const ms=Math.round(form.loanAmount*(form.loanRate-3.2)/100/12);
      if(ms>0){t+=ms; d.push({title:"대출 금리 절약",save:ms});}
    }
    return {total:t,details:d};
  };
  const widthPercent = step * 25 + "%";

  return (
    <main className="min-h-screen bg-white pb-[96px]">
      <div className="max-w-[480px] mx-auto px-5 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black">F</div><span className="font-black">FIXCUT</span>{isAdmin && <span className="ml-1 text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full">ADMIN</span>}</div>
          <div className="flex gap-2">{auth ? <><span className="text-[12px] font-bold">{auth.name}님</span><button onClick={()=>{localStorage.removeItem("fixcut_auth"); setAuth(null); setTab("home");}} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">로그아웃</button></> : <><button onClick={()=>setShowAuth("login")} className="text-[12px] font-bold">로그인</button><button onClick={()=>setShowAuth("signup")} className="text-[12px] bg-black text-white px-4 py-1.5 rounded-full font-bold">회원가입</button></>}</div>
        </div>

        {tab==="home" && <div className="mt-8"><div className="bg-black text-white rounded-[28px] p-7"><h1 className="text-[30px] font-black leading-[1.1]">매달 새는<br/>고정비 67만원,<br/><span className="text-violet-400">19.4만원 찾아드려요</span></h1><button onClick={()=>{setTab("diag"); setStep(1);}} className="mt-6 bg-white text-black rounded-full px-6 py-3.5 font-black w-full">무료 진단 시작하기</button></div></div>}

        {tab==="diag" && <div className="mt-6"><div className="w-full h-1.5 bg-black/5 rounded-full"><div className="h-full bg-black" style={{width: widthPercent}}></div></div>
          {step===1 && <div className="mt-8"><h2 className="text-[26px] font-black">이름</h2><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="박현용" className="mt-4 w-full bg-gray-50 border rounded-2xl px-6 py-5 text-[18px]"/><button onClick={()=>setStep(2)} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold">다음</button></div>}
          {step===2 && <div className="mt-8"><h2 className="text-[26px] font-black">요금제</h2><div className="mt-4 grid grid-cols-4 gap-2">{["SKT","KT","LGU+","알뜰폰"].map(c=><button key={c} onClick={()=>setForm({...form,carrier:c})} className={"py-3 rounded-xl border font-bold "+(form.carrier===c?"bg-black text-white":"bg-white")}>{c}</button>)}</div><input type="number" value={form.phoneFee} onChange={e=>setForm({...form,phoneFee:Number(e.target.value)})} className="mt-4 w-full bg-gray-50 border rounded-2xl px-5 py-4"/><button onClick={()=>setStep(3)} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold">다음</button></div>}
          {step===3 && <div className="mt-8"><h2 className="text-[26px] font-black">OTT</h2><div className="mt-4 space-y-2">{["netflix","youtube","disney","tving","wavve"].map(k=><label key={k} className="flex items-center gap-3 p-4 border rounded-2xl"><input type="checkbox" checked={form.ott[k]} onChange={e=>setForm({...form,ott:{...form.ott,[k]:e.target.checked}})} className="w-5 h-5"/><span className="font-bold">{k}</span></label>)}</div><button onClick={()=>setStep(4)} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold">다음</button></div>}
          {step===4 && <div className="mt-8"><h2 className="text-[26px] font-black">대출</h2><input type="number" value={form.loanAmount} onChange={e=>setForm({...form,loanAmount:Number(e.target.value)})} className="mt-4 w-full bg-gray-50 border rounded-2xl px-5 py-4"/><button onClick={()=>{const r=calc(); setResult(r); setTab("saving");}} className="mt-6 w-full bg-black text-white rounded-full py-4 font-bold">결과 보기</button></div>}
        </div>}

        {tab==="saving" && <div className="mt-6">{!result ? <div className="text-center py-20">진단 먼저</div> : <div><h2 className="text-[26px] font-black">월 {result.total.toLocaleString()}원 절약</h2><div className="mt-4 space-y-2">{result.details.map((d,i)=><div key={i} className="border rounded-2xl p-4 flex justify-between"><span>{d.title}</span><span className="font-black text-violet-600">{d.save.toLocaleString()}원</span></div>)}</div></div>}</div>}

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

            {editMode && <div className="mt-6 bg-gray-50 rounded-[24px] p-6 border">
              <h3 className="font-black text-[16px]">내 정보 수정</h3>
              <div className="mt-4 space-y-3">
                <div><div className="text-[11px] font-bold text-black/50 mb-1">이름</div><input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">핸드폰</div><input value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})} className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">이메일</div><input value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div className="pt-3 border-t mt-3"><div className="text-[11px] font-bold text-black/50 mb-1">현재 비밀번호 (변경 시 필수)</div><input value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})} type="password" placeholder="현재 비밀번호 입력" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <div><div className="text-[11px] font-bold text-black/50 mb-1">새 비밀번호 (변경 원할 때만)</div><input value={editForm.newPassword} onChange={e=>setEditForm({...editForm,newPassword:e.target.value})} type="password" placeholder="새 비밀번호" className="w-full bg-white border rounded-xl px-4 py-3 text-[14px]"/></div>
                <button onClick={handleUpdate} className="mt-4 w-full bg-black text-white rounded-full py-4 font-bold">저장하기</button>
                <button onClick={()=>{if(confirm("정말 탈퇴하시겠습니까?")){localStorage.removeItem("fixcut_auth"); setAuth(null); setTab("home"); alert("탈퇴되었습니다");}}} className="w-full text-[12px] text-red-500 py-2">회원 탈퇴</button>
              </div>
            </div>}

            {!editMode && <div className="mt-6 space-y-3">
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center"><div><div className="text-[11px] text-black/40">이름</div><div className="font-bold text-[14px]">{auth.name}</div></div><span className="text-black/20">›</span></div>
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center"><div><div className="text-[11px] text-black/40">핸드폰</div><div className="font-bold text-[14px]">{auth.phone}</div></div><span className="text-black/20">›</span></div>
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center"><div><div className="text-[11px] text-black/40">이메일</div><div className="font-bold text-[14px]">{auth.email}</div></div><span className="text-black/20">›</span></div>
              {isAdmin && <div className="mt-4 bg-black text-white rounded-2xl p-5"><div className="font-bold">관리자 계정</div><button onClick={()=>{setTab("admin"); loadAdmin();}} className="mt-3 bg-white text-black rounded-full px-4 py-2 text-[12px] font-bold">관리 페이지로 이동</button></div>}
            </div>}
          </div>}
        </div>}

        {tab==="admin" && <div className="mt-6">
          {!isAdmin ? <div className="text-center py-20"><div className="font-black">관리자만 접근 가능</div></div> :
          <div><h2 className="text-[26px] font-black">관리자 대시보드</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="bg-black text-white rounded-2xl p-5"><div className="text-[12px] text-white/60">총 회원</div><div className="text-[28px] font-black">{adminData.users.length}명</div></div><div className="bg-violet-600 text-white rounded-2xl p-5"><div className="text-[12px] text-white/60">절약 진단</div><div className="text-[28px] font-black">{adminData.savings.length}건</div></div></div><div className="mt-6"><div className="flex justify-between"><h3 className="font-black">회원 목록</h3><button onClick={loadAdmin} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">새로고침</button></div><div className="mt-3 space-y-2">{adminData.users.map(u=><div key={u.id} className="border rounded-2xl p-4"><div className="flex justify-between"><span className="font-bold">{u.name}</span><span className="text-[11px] text-black/40">{u.created_at?.slice(0,10)}</span></div><div className="text-[12px] text-black/50 mt-1">{u.phone} | {u.email}</div></div>)}</div></div></div>}
        </div>}
      </div>

      {showAuth && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center p-4"><div className="bg-white rounded-[28px] w-full max-w-[400px] p-7"><div className="flex justify-between"><h3 className="text-[20px] font-black">{showAuth==="signup"?"회원가입":"로그인"}</h3><button onClick={()=>setShowAuth(null)} className="w-8 h-8 bg-black/5 rounded-full">X</button></div><div className="mt-6 space-y-3"><input value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="이름" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><input value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:e.target.value})} placeholder="핸드폰" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><input value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="이메일 (관리자는 admin@fixcut.com)" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><input value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="비밀번호" type="password" className="w-full bg-gray-50 border rounded-2xl px-5 py-4"/><button onClick={()=>{const user={name:authForm.name||authForm.email,phone:authForm.phone,email:authForm.email}; localStorage.setItem("fixcut_auth",JSON.stringify(user)); setAuth(user); setShowAuth(null); if(user.email==="admin@fixcut.com"||user.email?.includes("parkhy")){ setTimeout(()=>{setTab("admin"); loadAdmin();},500);} }} className="w-full bg-black text-white rounded-full py-4 font-bold">{showAuth==="signup"?"가입하기":"로그인"}</button></div></div></div>}

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t z-50"><div className="max-w-[480px] mx-auto px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"><div className={"grid gap-1 "+(isAdmin?"grid-cols-5":"grid-cols-4")}>
        <button onClick={()=>setTab("home")} className="flex flex-col items-center py-1.5 gap-1">{Icons.home(tab==="home")}<span className={"text-[10px] font-bold "+(tab==="home"?"text-black":"text-black/40")}>홈</span></button>
        <button onClick={()=>setTab("diag")} className="flex flex-col items-center py-1.5 gap-1">{Icons.diag(tab==="diag")}<span className={"text-[10px] font-bold "+(tab==="diag"?"text-black":"text-black/40")}>진단</span></button>
        <button onClick={()=>setTab("saving")} className="flex flex-col items-center py-1.5 gap-1">{Icons.saving(tab==="saving")}<span className={"text-[10px] font-bold "+(tab==="saving"?"text-violet-600":"text-black/40")}>절약</span></button>
        <button onClick={()=>setTab("my")} className="flex flex-col items-center py-1.5 gap-1">{Icons.my(tab==="my")}<span className={"text-[10px] font-bold "+(tab==="my"?"text-black":"text-black/40")}>내정보</span></button>
        {isAdmin && <button onClick={()=>{setTab("admin"); loadAdmin();}} className="flex flex-col items-center py-1.5 gap-1">{Icons.admin(tab==="admin")}<span className={"text-[10px] font-bold "+(tab==="admin"?"text-red-500":"text-red-500/50")}>관리</span></button>}
      </div></div></div>
    </main>
  );
}
