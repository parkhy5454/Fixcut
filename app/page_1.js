
"use client";
import { useState } from "react";

export default function Page() {
  const [name, setName] = useState("");
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-16">
          <div className="text-xl font-black tracking-widest">FIXCUT</div>
          <div className="text-sm text-white/60">월 19.4만원 절약</div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.1] mb-6">
              매달 새는<br/>
              <span className="text-white/40">고정비 67만원</span><br/>
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                19.4만원 찾아드려요
              </span>
            </h1>
            <p className="text-white/60 text-lg mb-8">통신·구독·대출 3분 스캔 → 원클릭 실행</p>
            
            <div className="flex gap-2 mb-12">
              <input 
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="이름 입력 (박현용)"
                className="bg-white/10 border border-white/20 rounded-full px-6 py-3 w-64 outline-none focus:border-violet-500"
              />
              <button className="bg-white text-black rounded-full px-8 py-3 font-bold hover:bg-white/90 transition">
                시작하기 →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
                <div className="text-white/40 text-sm">통신</div>
                <div className="text-xl font-bold text-emerald-400">-52,000원</div>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
                <div className="text-white/40 text-sm">구독</div>
                <div className="text-xl font-bold text-emerald-400">-27,000원</div>
              </div>
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
                <div className="text-white/40 text-sm">대출</div>
                <div className="text-xl font-bold text-emerald-400">-89,000원</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-white/10 rounded-[2rem] p-8 backdrop-blur">
              <div className="text-sm text-white/40 mb-4">오늘의 절약 리포트</div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-black/40 rounded-xl p-4">
                  <div>
                    <div className="font-bold">KT → 알뜰폰</div>
                    <div className="text-xs text-white/40">데이터 11GB 사용중</div>
                  </div>
                  <div className="text-emerald-400 font-bold">-38,000원</div>
                </div>
                <div className="flex justify-between items-center bg-black/40 rounded-xl p-4">
                  <div>
                    <div className="font-bold">넷플릭스 정리</div>
                    <div className="text-xs text-white/40">안 보는 구독 2개</div>
                  </div>
                  <div className="text-emerald-400 font-bold">-18,000원</div>
                </div>
                <div className="flex justify-between items-center bg-black/40 rounded-xl p-4">
                  <div>
                    <div className="font-bold">대환대출</div>
                    <div className="text-xs text-white/40">4.8% → 3.2%</div>
                  </div>
                  <div className="text-emerald-400 font-bold">-89,000원</div>
                </div>
              </div>
              <button className="w-full mt-6 bg-white text-black rounded-full py-4 font-black">
                19.4만원 아끼기 실행 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
