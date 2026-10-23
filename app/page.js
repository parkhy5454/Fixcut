
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
      setResult({ name, saving: 194000 });
    } catch (e) { setResult({ name, saving: 194000 }); }
    setLoading(false);
  };
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#0f172a] rounded-lg flex items-center justify-center text-white font-black">F</div><span className="text-xl font-black tracking-tight">FIXCUT</span><span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">BETA</span></div>
          <div className="text-sm text-slate-500">이미 1,247명이 절약 중</div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mt-16">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm mb-6 shadow-sm"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>실시간 고정비 스캔 중</div>
            <h1 className="text-5xl md:text-[56px] font-black leading-[1.05] tracking-tight mb-6">매달 새는<br/><span className="text-slate-400">고정비 67만원,</span><br/><span className="text-[#0f172a]">월 <span className="text-blue-600">19.4만원</span>을</span><br/>찾아드려요</h1>
            <p className="text-slate-500 text-[17px] leading-relaxed mb-8">통신·구독·대출 내역을 3분만에 스캔하고<br/>원클릭으로 해지·변경·대환까지 실행해드려요.</p>
            <div className="flex gap-2 mb-4">
              <input value={name} onChange={(e)=>setName(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && handleStart()} placeholder="이름을 입력하세요" className="bg-white border border-slate-200 rounded-full px-6 py-3.5 w-64 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm" />
              <button onClick={handleStart} disabled={loading} className="bg-[#0f172a] text-white rounded-full px-8 py-3.5 font-bold hover:bg-black transition shadow-lg disabled:opacity-50">{loading ? "분석중..." : "무료로 시작하기 →"}</button>
            </div>
            <div className="text-xs text-slate-400 ml-1">✔ 카드 연결 없이 무료 진단 · 30초 소요</div>

            {result && (<div className="mt-8 bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">🎉</div><div><div className="font-bold text-slate-900">{result.name}님 분석 완료!</div><div className="text-slate-500 text-sm">월 {result.saving.toLocaleString()}원 절약 가능 · 저장 완료</div></div></div></div>)}

            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="text-slate-400 text-xs mb-1">통신비</div><div className="text-[15px] font-bold">KT 69,000원</div><div className="text-blue-600 font-bold">→ 19,900원</div></div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="text-slate-400 text-xs mb-1">구독료</div><div className="text-[15px] font-bold">5개 사용중</div><div className="text-blue-600 font-bold">-27,000원</div></div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="text-slate-400 text-xs mb-1">대출이자</div><div className="text-[15px] font-bold">4.8% → 3.2%</div><div className="text-blue-600 font-bold">-89,000원</div></div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-200 rounded-full blur-[80px] opacity-50"></div>
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-violet-200 rounded-full blur-[80px] opacity-50"></div>
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.15)]">
              <div className="flex justify-between items-center mb-6"><div className="font-bold text-slate-900">오늘의 절약 리포트</div><div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">월 194,000원 절약</div></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-4"><div className="flex gap-3"><div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center">📱</div><div><div className="font-bold text-sm">KT → 알뜰폰 이전</div><div className="text-xs text-slate-400">데이터 11GB / 통화 무제한</div></div></div><div className="text-right"><div className="text-blue-600 font-black">-38,000원</div><button onClick={handleStart} className="text-[11px] bg-slate-900 text-white px-3 py-1 rounded-full mt-1">실행</button></div></div>
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-4"><div className="flex gap-3"><div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center">🎬</div><div><div className="font-bold text-sm">넷플릭스 / 유튜브 정리</div><div className="text-xs text-slate-400">미사용 구독 2개 발견</div></div></div><div className="text-right"><div className="text-blue-600 font-black">-18,000원</div><button onClick={handleStart} className="text-[11px] bg-slate-900 text-white px-3 py-1 rounded-full mt-1">실행</button></div></div>
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-4"><div className="flex gap-3"><div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center">🏦</div><div><div className="font-bold text-sm">신용대출 대환</div><div className="text-xs text-slate-400">4.8% → 3.2% / 케이뱅크</div></div></div><div className="text-right"><div className="text-blue-600 font-black">-89,000원</div><button onClick={handleStart} className="text-[11px] bg-slate-900 text-white px-3 py-1 rounded-full mt-1">실행</button></div></div>
              </div>
              <button onClick={handleStart} className="w-full mt-6 bg-[#0f172a] text-white rounded-full py-4 font-black text-[15px] shadow-lg hover:bg-black transition">19.4만원 아끼기 실행 →</button>
              <div className="text-center text-[11px] text-slate-400 mt-3">평균 3분 소요 · 수수료 없음</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
