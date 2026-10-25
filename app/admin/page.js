"use client";
// 관리자 기능은 메인 화면의 관리자 탭에서만 제공됩니다 (관리자 계정 로그인 필요).
export default function Admin(){
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full border rounded-2xl p-6 text-center">
        <h1 className="font-black text-xl">관리자</h1>
        <p className="text-[13px] text-black/50 mt-2">관리자 계정으로 로그인한 뒤 메인 화면의 관리자 탭을 이용해 주세요.</p>
        <a href="/" className="mt-4 inline-block bg-black text-white rounded-full px-6 py-2 text-[13px] font-bold">메인으로</a>
      </div>
    </div>
  );
}
