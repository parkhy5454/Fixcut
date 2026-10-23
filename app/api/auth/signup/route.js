
import { neon } from "@neondatabase/serverless";
import { hashPassword, makeSessionToken } from "../password.js";
export async function POST(req){
  try{
    const {name,phone,email,password} = await req.json();
    const cleanName = (name||"").trim();
    const cleanPhone = (phone||"").trim();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanName || !cleanPhone || !cleanEmail || !password) return Response.json({ok:false, error:"필수 정보 누락"}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true, user:{name:cleanName, phone:cleanPhone, email:cleanEmail}});
    const sql = neon(process.env.DATABASE_URL);
    // 같은 이메일이 있으면 덮어쓰지 않고 거절한다
    const pwHash = hashPassword(password);
    let rows;
    try{
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
    return Response.json({ok:true, user:rows[0], token: makeSessionToken(cleanEmail, pwHash)});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
