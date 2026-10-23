
import { neon } from "@neondatabase/serverless";
import { hashPassword, makeSessionToken } from "../password.js";
import { allowRequest } from "../ratelimit.js";
import { ensureTables, ensureReferralCode, createReferral } from "../referral.js";
export async function POST(req){
  try{
    const {name,phone,email,password,referralCode} = await req.json();
    const cleanName = (name||"").trim();
    const cleanPhone = (phone||"").trim();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanName || !cleanPhone || !cleanEmail || !password) return Response.json({ok:false, error:"필수 정보 누락"}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true, user:{name:cleanName, phone:cleanPhone, email:cleanEmail}});
    const sql = neon(process.env.DATABASE_URL);
    if(!(await allowRequest(req, sql, "signup", 5, 600))) return Response.json({ok:false,error:"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요"},{status:429});
    await ensureTables(sql);
    const pwHash = hashPassword(password);
    let rows;
    try{
      // 같은 이메일이 있으면 덮어쓰지 않고 거절한다
      rows = await sql`
        INSERT INTO users (name, phone, email, password) VALUES (${cleanName}, ${cleanPhone}, ${cleanEmail}, ${pwHash})
        ON CONFLICT (email) DO NOTHING
        RETURNING id, name, phone, email
      `;
    }catch(e){
      if(String(e).includes("users_phone_key")) return Response.json({ok:false, error:"이미 등록된 핸드폰 번호입니다"}, {status:409});
      throw e;
    }
    if(rows.length === 0) return Response.json({ok:false, error:"이미 가입된 이메일입니다"}, {status:409});
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
      user:{name:user.name, phone:user.phone, email:user.email},
      token: makeSessionToken(cleanEmail, pwHash),
      referral_code: myCode,
      referred
    });
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
