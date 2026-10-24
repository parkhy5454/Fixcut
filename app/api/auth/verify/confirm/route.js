import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "crypto";
import { checkSession } from "../../password.js";
import { confirmRewards } from "../../referral.js";
import { codeHash, ensureVerifyTable } from "../../verify-common.js";
const MAX_ATTEMPTS = 5;
export async function POST(req){
  try{
    const { email, code } = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    const cleanCode = String(code||"").trim();
    if(!cleanEmail || !cleanCode) return Response.json({ok:false, error:"인증번호를 입력해 주세요"}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    const sql = neon(process.env.DATABASE_URL);
    const users = await sql`SELECT password, verified_at FROM users WHERE LOWER(email)=${cleanEmail} LIMIT 1`;
    if(users.length === 0 || !checkSession(req, cleanEmail, users[0].password)){
      return Response.json({ok:false, error:"로그인이 필요합니다"}, {status:401});
    }
    if(users[0].verified_at) return Response.json({ok:true, verified:true});

    await ensureVerifyTable(sql);
    const rows = await sql`SELECT code_hash, expires_at, attempts FROM email_verifications WHERE email=${cleanEmail} LIMIT 1`;
    const row = rows[0];
    if(!row || new Date(row.expires_at) < new Date()){
      return Response.json({ok:false, error:"인증번호가 없거나 만료되었습니다. 다시 받아 주세요"}, {status:400});
    }
    if(row.attempts >= MAX_ATTEMPTS){
      return Response.json({ok:false, error:"입력 횟수를 초과했습니다. 인증번호를 다시 받아 주세요"}, {status:429});
    }
    const a = Buffer.from(codeHash(cleanEmail, cleanCode), "hex");
    const b = Buffer.from(row.code_hash, "hex");
    const match = a.length === b.length && timingSafeEqual(a, b);
    if(!match){
      await sql`UPDATE email_verifications SET attempts = attempts + 1 WHERE email=${cleanEmail}`;
      return Response.json({ok:false, error:"인증번호가 일치하지 않습니다"}, {status:400});
    }
    await sql`UPDATE users SET verified_at = NOW() WHERE LOWER(email)=${cleanEmail}`;
    await sql`DELETE FROM email_verifications WHERE email=${cleanEmail}`;
    // 인증이 끝나면 대기 중인 추천 포인트를 확정 조건으로 다시 확인한다
    try{ await confirmRewards(sql, cleanEmail); }catch(e){ console.error("confirm rewards after verify", e); }
    return Response.json({ok:true, verified:true});
  }catch(e){
    console.error("verify confirm", e);
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"}, {status:500});
  }
}
