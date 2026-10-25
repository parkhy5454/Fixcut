// 메일 발송 (Resend API). 환경 변수 RESEND_API_KEY, MAIL_FROM 이 필요하다.
// MAIL_FROM 은 Resend에서 인증한 본인 도메인 주소여야 실제 회원에게 발송된다.
export async function sendMail({to, subject, html}){
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if(!key || !from) throw new Error("RESEND_API_KEY 또는 MAIL_FROM 이 설정되지 않았습니다");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if(!res.ok){
    const detail = await res.text().catch(() => "");
    throw new Error("메일 발송 실패 " + res.status + " " + detail.slice(0, 200));
  }
}
