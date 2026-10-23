
"use client";
import { useState } from "react";
export default function Page() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const handleStart = async () => {
    if (!name.trim()) { alert("이름을 입력해주세요!"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await res.json();
      if (data.success || res.ok) setResult({ name, saving: 194000 });
      else alert("저장 실패: " + data.error);
    } catch (e) { alert("오류: " + e.message); }
    setLoading(false);
  };
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-16">
          <div className="text-xl font-black tracking-widest">FIXCUT</div>
          <div className="text-sm bg-black text-white px-4 py-1.5 rounded-full">월 19.4만원 절약 중</div>
        </div>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold mb-4">🔥 12,341명이 절약 시작</div>
            <h1 className="text-5xl md:text-[56px] font-black leading-[1.05] tracking-tight mb-6">매달 새는<br/><span className="text-black/20">고정비 67만원</span><br/><span className="text-violet-600">19.4만원 찾아드려요</span></h1>
            <p className="text-black/60 text-[17px] mb-8 leading-relaxed">통신·구독·대출 3분 스캔하고, 원클릭으로 바로 실행해요.</p>
            <div className="flex gap-2 mb-4 bg-white p-2 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-black/5 w-fit">
              <input value={name} onChange={(e)=>setName(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && handleStart()} placeholder="이름 입력" className="bg-transparent px-5 py-2.5 w-56 outline-none placeholder:text-black/30" />
              <button onClick={handleStart} disabled={loading} className="bg-black text-white rounded-full px-7 py-2.5 font-bold hover:bg-black/80 transition disabled:opacity-50 whitespace-nowrap">{loading ? "분석중..." : "시작하기 →"}</button>
            </div>
            {result && (<div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 mt-4"><div className="text-emerald-700 font-bold">🎉 {result.name}님, 분석 완료!</div><div className="text-black/70 mt-1 text-sm">월 {result.saving.toLocaleString()}원 절약 가능! DB 저장 완료.</div></div>)}
            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm"><div className="text-black/40 text-xs mb-1">통신비</div><div className="text-lg font-bold">-52,000원</div></div>
              <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm"><div className="text-black/40 text-xs mb-1">구독료</div><div className="text-lg font-bold">-27,000원</div></div>
              <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm"><div className="text-black/40 text-xs mb-1">대출이자</div><div className="text-lg font-bold">-89,000원</div></div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-[2.2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-black/5">
              <div className="flex justify-between items-center mb-6"><div className="text-sm font-bold">오늘의 절약 리포트</div><div className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">+194,000원</div></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4 border border-black/5"><div><div className="font-bold text-sm">KT → 알뜰폰</div><div className="text-xs text-black/40">데이터 11GB 사용중</div></div><div className="text-emerald-600 font-bold text-sm">-38,000원</div></div>
                <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4 border border-black/5"><div><div className="font-bold text-sm">넷플릭스 정리</div><div className="text-xs text-black/40">최근 30일 미시청 2개</div></div><div className="text-emerald-600 font-bold text-sm">-18,000원</div></div>
                <div className="flex justify-between items-center bg-violet-600 rounded-2xl p-4 text-white"><div><div className="font-bold text-sm">대환대출</div><div className="text-xs text-violet-200">4.8% → 3.2%</div></div><div className="font-bold text-sm">-89,000원</div></div>
              </div>
              <button onClick={handleStart} className="w-full mt-6 bg-black text-white rounded-full py-4 font-bold text-[15px]">19.4만원 아끼기 실행 →</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
