
import { neon } from "@neondatabase/serverless";
import { hashPassword, verifyPassword, makeSessionToken, validatePassword } from "../password.js";
import { ensureTables } from "../referral.js";
import { encryptField, phoneHash } from "./crypto.js";
export async function POST(req){
  try{
    const {oldEmail, currentPassword, name, phone, email, newPassword} = await req.json();
    const cleanName = (name||"").trim();
    const cleanPhone = (phone||"").trim();
    const cleanEmail = (email||"").trim().toLowerCase();
    const cleanOld = (oldEmail||"").trim().toLowerCase();
    if(!cleanOld || !cleanName || !cleanPhone || !cleanEmail || !currentPassword){
      return Response.json({ok:false, error:"모든 필드 필요"}, {status:400});
    }
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    await ensureTables(sql);
    const found = await sql`SELECT id, password FROM users WHERE LOWER(email)=${cleanOld} LIMIT 1`;
    // 현재 비밀번호가 맞아야만 수정 가능
    if(found.length === 0 || !verifyPassword(currentPassword, found[0].password)){
      return Response.json({ok:false, error:"현재 비밀번호가 일치하지 않습니다"}, {status:401});
    }
    const id = found[0].id;
    const pw = (newPassword||"").trim();
    if(pw){ const pwErr = validatePassword(pw); if(pwErr) return Response.json({ok:false, error:pwErr}, {status:400}); }
    const newHash = pw ? hashPassword(pw) : null;
    try{
      const rows = pw
        ? await sql`UPDATE users SET name=${cleanName}, phone=NULL, phone_enc=${encryptField(cleanPhone)}, phone_hash=${phoneHash(cleanPhone)}, email=${cleanEmail}, password=${newHash} WHERE id=${id} RETURNING id`
        : await sql`UPDATE users SET name=${cleanName}, phone=NULL, phone_enc=${encryptField(cleanPhone)}, phone_hash=${phoneHash(cleanPhone)}, email=${cleanEmail} WHERE id=${id} RETURNING id`;
      if(rows.length === 0) return Response.json({ok:false, error:"회원을 찾을 수 없습니다"}, {status:404});
    }catch(e){
      const msg = String(e);
      if(msg.includes("users_email_key")) return Response.json({ok:false, error:"이미 사용 중인 이메일입니다"}, {status:409});
      if(msg.includes("users_phone_hash_key") || msg.includes("users_phone_key")) return Response.json({ok:false, error:"이미 등록된 핸드폰 번호입니다"}, {status:409});
      throw e;
    }
    return Response.json({ok:true, token: makeSessionToken(cleanEmail, newHash || found[0].password)});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:"서버 오류가 발생했습니다"},{status:500});
  }
}
