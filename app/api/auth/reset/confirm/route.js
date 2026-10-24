import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "crypto";
import { hashPassword, validatePassword } from "../../password.js";
import { resetCodeHash, ensureResetTable } from "../../verify-common.js";
const MAX_ATTEMPTS = 5;
export async function POST(req){
  try{
    const { email, code, newPassword } = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    const cleanCode = String(code||"").trim();
    if(!cleanEmail || !cleanCode || !newPassword) return Response.json({ok:false, error:"모든 항목을 입력해 주세요"}, {status:400});
    const pwErr = validatePassword(newPassword);
    if(pwErr) return Response.json({ok:false, error:pwErr}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    const sql = neon(process.env.DATABASE_URL);
    await ensureResetTable(sql);
    const rows = await sql`SELECT code_hash, expires_at, attempts FROM password_resets WHERE email=${cleanEmail} LIMIT 1`;
    const row = rows[0];
    if(!row || new Date(row.expires_at) < new Date()){
      return Response.json({ok:false, error:"인증번호가 없거나 만료되었습니다. 다시 받아 주세요"}, {status:400});
    }
    if(row.attempts >= MAX_ATTEMPTS){
      return Response.json({ok:false, error:"입력 횟수를 초과했습니다. 인증번호를 다시 받아 주세요"}, {status:429});
    }
    const a = Buffer.from(resetCodeHash(cleanEmail, cleanCode), "hex");
    const b = Buffer.from(row.code_hash, "hex");
    const match = a.length === b.length && timingSafeEqual(a, b);
    if(!match){
      await sql`UPDATE password_resets SET attempts = attempts + 1 WHERE email=${cleanEmail}`;
      return Response.json({ok:false, error:"인증번호가 일치하지 않습니다"}, {status:400});
    }
    const updated = await sql`UPDATE users SET password=${hashPassword(newPassword)} WHERE LOWER(email)=${cleanEmail} RETURNING id`;
    await sql`DELETE FROM password_resets WHERE email=${cleanEmail}`;
    if(updated.length === 0) return Response.json({ok:false, error:"가입된 회원을 찾을 수 없습니다"}, {status:404});
    // 비밀번호가 바뀌었으므로 기존 로그인 토큰은 모두 무효가 된다
    return Response.json({ok:true});
  }catch(e){
    console.error("reset confirm", e);
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"}, {status:500});
  }
}
