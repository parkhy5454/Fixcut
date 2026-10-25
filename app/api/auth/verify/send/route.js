import { neon } from "@neondatabase/serverless";
import { randomInt } from "crypto";
import { checkSession } from "../../password.js";
import { allowRequest } from "../../ratelimit.js";
import { sendMail } from "../../mail.js";
import { codeHash, ensureVerifyTable } from "../../verify-common.js";
export async function POST(req){
  try{
    const { email } = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanEmail) return Response.json({ok:false, error:"email 필요"}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    const sql = neon(process.env.DATABASE_URL);
    const users = await sql`SELECT password, verified_at FROM users WHERE LOWER(email)=${cleanEmail} LIMIT 1`;
    // 로그인한 본인만 인증 메일을 받을 수 있다
    if(users.length === 0 || !checkSession(req, cleanEmail, users[0].password)){
      return Response.json({ok:false, error:"로그인이 필요합니다"}, {status:401});
    }
    if(users[0].verified_at) return Response.json({ok:true, verified:true});
    if(!(await allowRequest(req, sql, "verify_send", 5, 600))){
      return Response.json({ok:false, error:"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요"}, {status:429});
    }
    await ensureVerifyTable(sql);
    const recent = await sql`SELECT 1 FROM email_verifications WHERE email=${cleanEmail} AND sent_at > NOW() - INTERVAL '60 seconds'`;
    if(recent.length > 0) return Response.json({ok:false, error:"인증번호는 1분에 한 번만 받을 수 있습니다"}, {status:429});

    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await sql`INSERT INTO email_verifications (email, code_hash, expires_at, attempts, sent_at)
      VALUES (${cleanEmail}, ${codeHash(cleanEmail, code)}, NOW() + INTERVAL '10 minutes', 0, NOW())
      ON CONFLICT (email) DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, attempts=0, sent_at=EXCLUDED.sent_at`;
    await sendMail({
      to: cleanEmail,
      subject: "[Fixcut] 이메일 인증번호",
      html: `<p>Fixcut 이메일 인증번호는 <b style="font-size:18px">${code}</b> 입니다.</p><p>10분 안에 입력해 주세요. 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>`,
    });
    return Response.json({ok:true});
  }catch(e){
    console.error("verify send", e);
    return Response.json({ok:false, error:"인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요"}, {status:500});
  }
}
