
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default function Home(){
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [telecom, setTelecom] = useState({ provider: 'SKT', fee: 69000, dataUsage: 11 })
  const [subs, setSubs] = useState({ youtube: true, netflix: true, melon: false, coupang: true })
  const [loan, setLoan] = useState({ balance: 200000000, rate: 5.2, months: 240 })
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const calculate = async () => {
    setSaving(true)
    // Telecom saving: if usage <20GB and fee >30k
    const telecomSaving = telecom.dataUsage < 20 ? telecom.fee - 17000 : 0
    const recommendedTelecom = telecom.dataUsage < 20 ? '리브엠 (LGU+망)' : telecom.provider

    // Subscription saving
    let subFee = 0
    if(subs.youtube) subFee += 14900
    if(subs.netflix) subFee += 13500
    if(subs.coupang) subFee += 4990
    const subSaving = Math.floor(subFee * 0.65) // 65% saving via family share

    // Loan saving: monthly interest diff
    const currentMonthly = loan.balance * (loan.rate/100) / 12
    const newRate = 3.9
    const newMonthly = loan.balance * (newRate/100) / 12
    const loanSaving = Math.floor(currentMonthly - newMonthly)

    const total = telecomSaving + subSaving + loanSaving

    const res = {
      telecomSaving, recommendedTelecom, subSaving, loanSaving, total,
      newRate, currentMonthly: Math.floor(currentMonthly), newMonthly: Math.floor(newMonthly)
    }
    setResult(res)

    // Save to Supabase if available
    if(supabase){
      try{
        const { data: user } = await supabase.from('users').insert({ name: name || '테스트유저' }).select().single()
        const userId = user?.id
        if(userId){
          await supabase.from('fixed_costs').insert({
            user_id: userId,
            telecom_provider: telecom.provider,
            telecom_monthly_fee: telecom.fee,
            telecom_data_usage: telecom.dataUsage,
            subscriptions: subs,
            loan_balance: loan.balance,
            loan_rate: loan.rate,
            loan_remaining_months: loan.months,
            total_fixed_cost: telecom.fee + subFee + Math.floor(currentMonthly)
          })
          await supabase.from('recommendations').insert({
            user_id: userId,
            recommended_telecom: recommendedTelecom,
            telecom_saving: telecomSaving,
            subscription_saving: subSaving,
            recommended_loan_rate: newRate,
            loan_saving: loanSaving,
            total_monthly_saving: total,
            total_yearly_saving: total*12
          })
        }
      }catch(e){ console.log('supabase error', e) }
    }
    setTimeout(()=> setSaving(false), 800)
  }

  return (
    <div className="min-h-screen bg-white text-black max-w-[480px] mx-auto">
      <header className="sticky top-0 z-10 bg-black text-white p-4 flex justify-between items-center">
        <div className="font-black text-xl">FIXCUT</div>
        <div className="text-xs bg-[#D6FF4D] text-black px-2 py-1 rounded-full font-bold">월 19.4만원 절약</div>
      </header>

      {step===1 && (
        <div className="p-6">
          <h1 className="text-3xl font-black leading-tight">매달 새는<br/>고정비 67만원<br/><span className="bg-[#D6FF4D]">19.4만원</span> 찾아드려요</h1>
          <p className="mt-4 text-gray-600">통신·구독·대출 3분 스캔 → 원클릭 실행</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름 입력 (박현용)" className="mt-8 w-full border-2 border-black p-4 rounded-xl text-lg" />
          <button onClick={()=>setStep(2)} className="mt-4 w-full bg-black text-white p-4 rounded-xl font-bold text-lg">시작하기 →</button>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="border p-3 rounded-xl"><div className="font-bold">통신</div><div className="text-xs text-gray-500">-52,000원</div></div>
            <div className="border p-3 rounded-xl"><div className="font-bold">구독</div><div className="text-xs text-gray-500">-27,000원</div></div>
            <div className="border p-3 rounded-xl"><div className="font-bold">대출</div><div className="text-xs text-gray-500">-89,000원</div></div>
          </div>
        </div>
      )}

      {step===2 && (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-black">고정비 스캔</h2>
          
          <div className="border-2 border-black rounded-2xl p-4">
            <div className="font-bold mb-3">📱 통신</div>
            <select value={telecom.provider} onChange={e=>setTelecom({...telecom, provider: e.target.value})} className="w-full border p-3 rounded-xl">
              <option>SKT</option><option>KT</option><option>LG U+</option><option>알뜰폰</option>
            </select>
            <div className="mt-3 flex gap-2">
              <input type="number" value={telecom.fee} onChange={e=>setTelecom({...telecom, fee: Number(e.target.value)})} className="flex-1 border p-3 rounded-xl" placeholder="요금" />
              <input type="range" min="1" max="200" value={telecom.dataUsage} onChange={e=>setTelecom({...telecom, dataUsage: Number(e.target.value)})} className="flex-1" />
              <span className="text-sm font-bold">{telecom.dataUsage}GB</span>
            </div>
          </div>

          <div className="border-2 border-black rounded-2xl p-4">
            <div className="font-bold mb-3">📺 구독</div>
            <label className="flex gap-2 py-2"><input type="checkbox" checked={subs.youtube} onChange={e=>setSubs({...subs, youtube: e.target.checked})} /> 유튜브 프리미엄 14,900원</label>
            <label className="flex gap-2 py-2"><input type="checkbox" checked={subs.netflix} onChange={e=>setSubs({...subs, netflix: e.target.checked})} /> 넷플릭스 13,500원</label>
            <label className="flex gap-2 py-2"><input type="checkbox" checked={subs.coupang} onChange={e=>setSubs({...subs, coupang: e.target.checked})} /> 쿠팡 와우 4,990원</label>
          </div>

          <div className="border-2 border-black rounded-2xl p-4">
            <div className="font-bold mb-3">🏦 대출</div>
            <input type="number" value={loan.balance} onChange={e=>setLoan({...loan, balance: Number(e.target.value)})} className="w-full border p-3 rounded-xl mb-2" placeholder="잔액" />
            <div className="flex gap-2 items-center">
              <span>금리</span>
              <input type="range" min="2" max="8" step="0.1" value={loan.rate} onChange={e=>setLoan({...loan, rate: Number(e.target.value)})} className="flex-1" />
              <span className="font-bold">{loan.rate}%</span>
            </div>
          </div>

          <button onClick={()=>{calculate(); setStep(3)}} className="w-full bg-[#D6FF4D] text-black p-4 rounded-xl font-black text-lg border-2 border-black">내 고정비 분석하기 → {saving && '저장중...'}</button>
        </div>
      )}

      {step===3 && result && (
        <div className="p-6">
          <div className="bg-black text-white rounded-[24px] p-6 text-center">
            <div className="text-sm opacity-60">{name || '박현용'}님의 월 절약액</div>
            <div className="text-5xl font-black text-[#D6FF4D] mt-2">-{result.total.toLocaleString()}원</div>
            <div className="text-sm mt-2">연간 -{(result.total*12).toLocaleString()}원 = 제주도 왕복 6번</div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="border-2 border-black rounded-2xl p-4">
              <div className="flex justify-between"><span className="font-bold">통신: {result.recommendedTelecom}</span><span className="font-black text-green-600">-{result.telecomSaving.toLocaleString()}원</span></div>
              <div className="text-xs text-gray-500 mt-1">SKT망 그대로, 데이터 동일</div>
              <button className="mt-3 w-full bg-black text-white p-3 rounded-xl font-bold">eSIM 즉시 개통 → 30,000원 수익</button>
            </div>
            <div className="border-2 border-black rounded-2xl p-4">
              <div className="flex justify-between"><span className="font-bold">구독: 가족 파티</span><span className="font-black text-green-600">-{result.subSaving.toLocaleString()}원</span></div>
              <div className="text-xs text-gray-500 mt-1">현재 247명 대기중, 평균 매칭 2.3시간</div>
              <button className="mt-3 w-full bg-black text-white p-3 rounded-xl font-bold">파티 참여하기</button>
            </div>
            <div className="border-2 border-black rounded-2xl p-4">
              <div className="flex justify-between"><span className="font-bold">대출: {result.newRate}% 대환</span><span className="font-black text-green-600">-{result.loanSaving.toLocaleString()}원</span></div>
              <div className="text-xs text-gray-500 mt-1">{result.currentMonthly.toLocaleString()}원 → {result.newMonthly.toLocaleString()}원, 손익분기 7개월</div>
              <button className="mt-3 w-full bg-[#D6FF4D] text-black p-3 rounded-xl font-black border-2 border-black">대환 상담 받기 → 140만원 수익</button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-xs">
            <div className="font-bold">수익 구조 (관리자용)</div>
            <div>통신 CPA: 30,000원 / 대출 중개: 1,400,000원 / 프리미엄: 월 3,900원</div>
            <div className="mt-2 text-[10px] text-gray-400">Supabase 연결: {supabase ? '연결됨' : 'ENV 미설정 - .env.example 참고'}</div>
          </div>

          <button onClick={()=>setStep(2)} className="mt-6 w-full border-2 border-black p-3 rounded-xl">다시 계산</button>
        </div>
      )}
    </div>
  )
}
