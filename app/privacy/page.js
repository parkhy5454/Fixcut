
export default function Privacy(){
  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white p-6 pb-24">
      <h1 className="text-[22px] font-black">개인정보처리방침</h1>
      <div className="mt-6 text-[13px] leading-6 text-black/70 whitespace-pre-wrap">
{`1. 수집: 이름, 이메일, 전화번호, 통신사/요금제, 대출 금액/금리
2. 목적: 고정지출 진단, 절약액 계산, 제휴 상품 추천
3. 저장: Neon DB, 비밀번호 bcrypt 해시, 전화번호 암호화 예정. 회원 탈퇴 시 즉시 삭제
4. 제3자 제공: 없음. 제휴사 링크 클릭 시 해당 사이트로 이동, 이후 처리는 제휴사 방침
5. 권리: 내 정보 탭에서 조회/수정/삭제 가능

문의: parkhy5454@gmail.com
시행일: 2026년 5월 14일`}
      </div>
      <a href="/" className="mt-8 block text-center bg-black text-white rounded-full py-3 font-bold">홈으로</a>
    </div>
  )
}
