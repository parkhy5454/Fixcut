import { neon } from "@neondatabase/serverless";
import { randomInt } from "crypto";
import { allowRequest } from "../../ratelimit.js";
import { sendMail } from "../../mail.js";
import { resetCodeHash, ensureResetTable } from "../../verify-common.js";
const GENERIC = "가입된 이메일이라면 인증번호를 보냈습니다. 메일함을 확인해 주세요";
export async function POST(req){
  try{
    const { email } = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanEmail) return Response.json({ok:false, error:"이메일을 입력해 주세요"}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    const sql = neon(process.env.DATABASE_URL);
    if(!(await allowRequest(req, sql, "reset_req", 5, 600))){
      return Response.json({ok:false, error:"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요"}, {status:429});
    }
    await ensureResetTable(sql);
    const users = await sql`SELECT id FROM users WHERE LOWER(email)=${cleanEmail} LIMIT 1`;
    // 가입 여부를 드러내지 않도록 결과 문구는 항상 같다
    if(users.length === 0) return Response.json({ok:true, message:GENERIC});
    const recent = await sql`SELECT 1 FROM password_resets WHERE email=${cleanEmail} AND sent_at > NOW() - INTERVAL '60 seconds'`;
    if(recent.length > 0) return Response.json({ok:true, message:GENERIC});

    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await sql`INSERT INTO password_resets (email, code_hash, expires_at, attempts, sent_at)
      VALUES (${cleanEmail}, ${resetCodeHash(cleanEmail, code)}, NOW() + INTERVAL '10 minutes', 0, NOW())
      ON CONFLICT (email) DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, attempts=0, sent_at=EXCLUDED.sent_at`;
    await sendMail({
      to: cleanEmail,
      subject: "[Fixcut] 비밀번호 재설정 인증번호",
      html: `<p>비밀번호 재설정 인증번호는 <b style="font-size:18px">${code}</b> 입니다.</p><p>10분 안에 입력해 주세요. 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>`,
    });
    return Response.json({ok:true, message:GENERIC});
  }catch(e){
    console.error("reset request", e);
    return Response.json({ok:false, error:"인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요"}, {status:500});
  }
}
