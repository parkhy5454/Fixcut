
import { neon } from "@neondatabase/serverless";
import { hashPassword, makeSessionToken, validatePassword } from "../password.js";
import { allowRequest } from "../ratelimit.js";
import { ensureTables, ensureReferralCode, createReferral } from "../referral.js";
import { encryptField, phoneHash } from "../crypto.js";
export async function POST(req){
  try{
    const {name,phone,email,password,referralCode,agreeTerms} = await req.json();
    const cleanName = (name||"").trim();
    const cleanPhone = (phone||"").trim();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanName || !cleanPhone || !cleanEmail || !password) return Response.json({ok:false, error:"필수 정보 누락"}, {status:400});
    const pwErr = validatePassword(password);
    if(pwErr) return Response.json({ok:false, error:pwErr}, {status:400});
    if(agreeTerms !== true) return Response.json({ok:false, error:"필수 약관에 동의해 주세요"}, {status:400});
    const TERMS_VERSION = "2026-10-24";
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true, user:{name:cleanName, phone:cleanPhone, email:cleanEmail}});
    const sql = neon(process.env.DATABASE_URL);
    if(!(await allowRequest(req, sql, "signup", 5, 600))) return Response.json({ok:false,error:"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요"},{status:429});
    await ensureTables(sql);
    const pwHash = hashPassword(password);
    let rows;
    try{
      // 같은 이메일이 있으면 덮어쓰지 않고 거절한다
      rows = await sql`
        INSERT INTO users (name, phone_enc, phone_hash, email, password, terms_version, terms_agreed_at) VALUES (${cleanName}, ${encryptField(cleanPhone)}, ${phoneHash(cleanPhone)}, ${cleanEmail}, ${pwHash}, ${TERMS_VERSION}, NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id, name, email
      `;
    }catch(e){
      if(String(e).includes("users_phone_hash_key") || String(e).includes("users_phone_key")) return Response.json({ok:false, error:"입력하신 정보로 가입할 수 없습니다. 이미 가입된 정보가 있는지 확인해 주세요"}, {status:409});
      throw e;
    }
    if(rows.length === 0) return Response.json({ok:false, error:"입력하신 정보로 가입할 수 없습니다. 이미 가입된 정보가 있는지 확인해 주세요"}, {status:409});
    const user = rows[0];

    // 추천 코드로 가입한 경우 추천 관계와 대기 포인트를 서버에서 만든다
    let referred = false;
    const refCode = (referralCode||"").trim().toUpperCase();
    if(refCode){
      try{
        const r = await createReferral(sql, refCode, cleanName, cleanEmail);
        referred = r.ok === true;
      }catch(e){ console.error("referral create failed", e); }
    }

    const myCode = await ensureReferralCode(sql, user.id, cleanEmail);
    return Response.json({
      ok:true,
      user:{name:user.name, phone:cleanPhone, email:user.email, verified:false},
      token: makeSessionToken(cleanEmail, pwHash),
      referral_code: myCode,
      referred
    });
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:"서버 오류가 발생했습니다"},{status:500});
  }
}
