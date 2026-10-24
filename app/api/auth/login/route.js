
import { neon } from "@neondatabase/serverless";
import { hashPassword, verifyPassword, isLegacyPlain, makeSessionToken } from "../password.js";
import { allowRequest } from "../ratelimit.js";
import { ensureTables, ensureReferralCode } from "../referral.js";
export async function POST(req){
  try{
    const {email,password} = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanEmail || !password) return Response.json({ok:false,error:"입력 필요"},{status:400});
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    if(!(await allowRequest(req, sql, "login", 20, 600))) return Response.json({ok:false,error:"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요"},{status:429});
    const rows = await sql`SELECT id, name, phone, email, password FROM users WHERE LOWER(email)=${cleanEmail} LIMIT 1`;
    const row = rows[0];
    if(!row || !verifyPassword(password, row.password)) return Response.json({ok:false,error:"not found"},{status:401});
    let stored = row.password;
    // 예전 평문 비밀번호는 로그인 성공 시 해시로 교체
    if(isLegacyPlain(row.password)){
      stored = hashPassword(password);
      await sql`UPDATE users SET password=${stored} WHERE id=${row.id}`;
    }
    await ensureTables(sql);
    const referral_code = await ensureReferralCode(sql, row.id, row.email);
    const user = {name: row.name, phone: row.phone, email: row.email};
    return Response.json({ok:true, user, token: makeSessionToken(row.email, stored), referral_code});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:"서버 오류가 발생했습니다"},{status:500});
  }
}
