
"use client";
import { useState, useEffect } from "react";

export default function AdminPage(){
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState("");
  const [members, setMembers] = useState([]);
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const ADMIN_PW = "fixcut2024";

  const login = () => {
    if(pw === ADMIN_PW){
      setAuth(true);
      localStorage.setItem("fixcut_admin", "true");
    }else{ alert("비밀번호 틀림"); }
  };

  useEffect(()=>{
    if(localStorage.getItem("fixcut_admin")==="true") setAuth(true);
    if(!auth) return;
    const fetchData = async () => {
      setLoading(true);
      try{
        const res = await fetch("/api/admin/list");
        const data = await res.json();
        setMembers(data.members||[]);
        setSaves(data.saves||[]);
      }catch(e){ console.log(e); }
      setLoading(false);
    };
    fetchData();
  },[auth]);

  if(!auth){
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-[360px] bg-white border rounded-[24px] p-8 shadow-sm">
          <h1 className="text-[22px] font-black">🔒 FIXCUT 관리자</h1>
          <p className="text-[13px] text-black/50 mt-2">비밀번호 입력 (기본: fixcut2024)</p>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" className="mt-6 w-full bg-gray-50 border rounded-2xl px-5 py-4 outline-none"/>
          <button onClick={login} className="mt-4 w-full bg-black text-white rounded-full py-4 font-bold">입장 →</button>
          <a href="/" className="block text-center text-[12px] text-black/40 mt-4">← 홈으로</a>
        </div>
      </main>
    );
  }

  const totalSaving = saves.reduce((a,b)=> a + (b.data?.total||0), 0);
  const totalMembers = members.length;

  return (
    <main className="min-h-screen bg-[#f8f8f8] pb-20">
      <div className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-[24px] font-black">📊 FIXCUT 관리자 대시보드</h1>
          <div className="flex gap-2"><a href="/" className="text-[12px] bg-white border px-4 py-2 rounded-full">홈</a><button onClick={()=>{localStorage.removeItem("fixcut_admin"); setAuth(false);}} className="text-[12px] bg-black text-white px-4 py-2 rounded-full">로그아웃</button></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-white border rounded-2xl p-5"><div className="text-[12px] text-black/50">총 회원</div><div className="text-[24px] font-black mt-1">{totalMembers}명</div></div>
          <div className="bg-white border rounded-2xl p-5"><div className="text-[12px] text-black/50">총 진단</div><div className="text-[24px] font-black mt-1">{saves.length}건</div></div>
          <div className="bg-white border rounded-2xl p-5"><div className="text-[12px] text-black/50">총 절약 가능액</div><div className="text-[20px] font-black mt-1 text-violet-600">월 {totalSaving.toLocaleString()}원</div></div>
          <div className="bg-white border rounded-2xl p-5"><div className="text-[12px] text-black/50">예상 연 절약</div><div className="text-[20px] font-black mt-1">연 {(totalSaving*12).toLocaleString()}원</div></div>
        </div>

        <div className="mt-8 bg-white border rounded-[20px] overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center"><h2 className="font-black">👥 회원 목록 ({members.length})</h2><button onClick={()=>window.location.reload()} className="text-[11px] bg-black/5 px-3 py-1 rounded-full">새로고침</button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]"><thead className="bg-gray-50 text-black/50 text-[11px]"><tr><th className="text-left p-3">이름</th><th className="text-left p-3">핸드폰</th><th className="text-left p-3">이메일</th><th className="text-left p-3">가입일</th></tr></thead><tbody>{members.map((m,i)=><tr key={i} className="border-t"><td className="p-3 font-bold">{m.name}</td><td className="p-3">{m.phone||"-"}</td><td className="p-3 text-black/60">{m.email}</td><td className="p-3 text-black/40">{new Date(m.created_at).toLocaleDateString()}</td></tr>)}</tbody></table>
            {members.length===0 && <div className="p-10 text-center text-black/30 text-[13px]">아직 회원이 없어요</div>}
          </div>
        </div>

        <div className="mt-6 bg-white border rounded-[20px] overflow-hidden">
          <div className="p-5 border-b"><h2 className="font-black">💰 절약 진단 내역 ({saves.length})</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]"><thead className="bg-gray-50 text-black/50 text-[11px]"><tr><th className="text-left p-3">이름</th><th className="text-left p-3">통신사</th><th className="text-left p-3">OTT</th><th className="text-left p-3">대출</th><th className="text-left p-3">월 절약</th><th className="text-left p-3">날짜</th></tr></thead><tbody>{saves.map((s,i)=>{const d=s.data||{}; return <tr key={i} className="border-t"><td className="p-3 font-bold">{d.name||d.email||"-"}</td><td className="p-3">{d.carrier||"-"} {d.phoneFee?`(${d.phoneFee.toLocaleString()}원)`:''}</td><td className="p-3">{d.ott?Object.keys(d.ott).filter(k=>d.ott[k]).join(", ")||"없음":"-"}</td><td className="p-3">{d.loanAmount?`${d.loanAmount.toLocaleString()}원 ${d.loanRate}%`:"-"}</td><td className="p-3 font-black text-violet-600">{d.total?`-${d.total.toLocaleString()}원`:"-"}</td><td className="p-3 text-black/40">{s.created_at?new Date(s.created_at).toLocaleDateString():"-"}</td></tr>})}</tbody></table>
            {saves.length===0 && <div className="p-10 text-center text-black/30 text-[13px]">아직 진단 내역이 없어요</div>}
          </div>
        </div>

        {loading && <div className="text-center py-10 text-[13px] text-black/30">불러오는 중...</div>}
      </div>
    </main>
  );
}
