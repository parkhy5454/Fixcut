
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
    } catch (e) { setResult({ name, saving: 194000 }); }
    setLoading(false);
  };
  return (
    <main className="min-h-screen bg-white text-[#111] pb-24 md:pb-0">
      <div className="max-w-6xl mx-auto px-5 md:px-6 py-6">
        {/* HEADER - mobile compact */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm">F</div><span className="text-lg font-black tracking-tight">FIXCUT</span></div>
          <div className="text-[11px] bg-black text-white px-3 py-1 rounded-full">월 19.4만원 절약</div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start mt-8 md:mt-16">
          {/* LEFT - Mobile first big typo */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full text-[11px] font-bold mb-4">🔥 12,341명 절약 시작 · 실시간</div>
            <h1 className="text-[32px] leading-[1.1] md:text-[56px] font-black tracking-tight mb-4">매달 새는<br/><span className="text-black/20">고정비 67만원,</span><br/><span className="text-violet-600">19.4만원</span><br/>찾아드려요</h1>
            <p className="text-black/60 text-[15px] md:text-[17px] mb-6 leading-relaxed">통신·구독·대출 3분 스캔<br/>원클릭으로 바로 실행해요.</p>
            
            {/* Input - Mobile big tap target 56px */}
            <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-black/5 w-full md:w-fit">
              <input value={name} onChange={(e)=>setName(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && handleStart()} placeholder="이름 입력" className="flex-1 bg-transparent px-5 py-3.5 text-[16px] outline-none placeholder:text-black/30" />
              <button onClick={handleStart} disabled={loading} className="bg-black text-white rounded-full px-6 py-3.5 font-bold text-[15px] hover:bg-black/80 active:scale-95 transition disabled:opacity-50 whitespace-nowrap min-h-[48px]">{loading ? "분석중..." : "시작하기 →"}</button>
            </div>
            <div className="text-[11px] text-black/40 ml-1">✔ 카드 연결 없이 · 30초 진단</div>

            {result && (<div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-5 animate-in"><div className="text-emerald-700 font-bold text-[15px]">🎉 {result.name}님, 월 {result.saving.toLocaleString()}원 절약!</div><div className="text-black/60 text-[13px] mt-1">저장 완료 · 카톡으로 리포트 보내드릴게요</div></div>)}

            {/* Mobile 3 cards horizontal scroll */}
            <div className="flex md:grid md:grid-cols-3 gap-3 mt-6 overflow-x-auto md:overflow-visible pb-2 -mx-5 px-5 md:mx-0 md:px-0">
              <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm min-w-[110px]"><div className="text-black/40 text-[11px] mb-1">통신비</div><div className="text-[16px] font-black">-52,000원</div><div className="text-[10px] text-violet-600 font-bold">알뜰폰 전환</div></div>
              <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm min-w-[110px]"><div className="text-black/40 text-[11px] mb-1">구독료</div><div className="text-[16px] font-black">-27,000원</div><div className="text-[10px] text-violet-600 font-bold">2개 해지</div></div>
              <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm min-w-[110px]"><div className="text-black/40 text-[11px] mb-1">대출이자</div><div className="text-[16px] font-black">-89,000원</div><div className="text-[10px] text-violet-600 font-bold">대환대출</div></div>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="relative mt-2 md:mt-0">
            <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-black/5">
              <div className="flex justify-between items-center mb-5"><div className="text-[14px] font-bold">오늘의 절약 리포트</div><div className="text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">+194,000원</div></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4 border border-black/[0.03]"><div className="flex gap-3 items-center"><div className="w-9 h-9 bg-white border rounded-xl flex items-center justify-center text-sm">📱</div><div><div className="font-bold text-[13px]">KT → 알뜰폰</div><div className="text-[11px] text-black/40">데이터 11GB · 2년 약정 끝</div></div></div><div className="text-violet-600 font-black text-[13px]">-38,000원</div></div>
                <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4 border border-black/[0.03]"><div className="flex gap-3 items-center"><div className="w-9 h-9 bg-white border rounded-xl flex items-center justify-center text-sm">🎬</div><div><div className="font-bold text-[13px]">넷플릭스 정리</div><div className="text-[11px] text-black/40">최근 30일 미시청 2개</div></div></div><div className="text-violet-600 font-black text-[13px]">-18,000원</div></div>
                <div className="flex justify-between items-center bg-black rounded-2xl p-4 text-white"><div className="flex gap-3 items-center"><div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-sm">🏦</div><div><div className="font-bold text-[13px]">대환대출</div><div className="text-[11px] text-white/60">4.8% → 3.2% · 월 89,000원↓</div></div></div><div className="font-black text-[13px] text-emerald-400">-89,000원</div></div>
              </div>
              <button onClick={handleStart} className="hidden md:block w-full mt-6 bg-black text-white rounded-full py-4 font-bold text-[15px] active:scale-95">19.4만원 아끼기 실행 →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA - like real app */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/5 p-4 pb-[max(16px,env(safe-area-inset-bottom))] z-50">
        <button onClick={handleStart} className="w-full bg-black text-white rounded-full py-4 font-black text-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] transition">19.4만원 아끼기 실행 →</button>
        <div className="text-[10px] text-black/30 text-center mt-2">평균 3분 · 수수료 없음 · 12,341명 진행중</div>
      </div>
    </main>
  );
}
