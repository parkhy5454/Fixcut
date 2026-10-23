
import { neon } from "@neondatabase/serverless";
import { hashPassword, verifyPassword, isLegacyPlain } from "../password.js";
export async function POST(req){
  try{
    const {email,password} = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanEmail || !password) return Response.json({ok:false,error:"입력 필요"},{status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, name, phone, email, password FROM users WHERE LOWER(email)=${cleanEmail} LIMIT 1`;
    const row = rows[0];
    if(!row || !verifyPassword(password, row.password)) return Response.json({ok:false,error:"not found"},{status:401});
    // 예전 평문 비밀번호는 로그인 성공 시 해시로 교체
    if(isLegacyPlain(row.password)){
      await sql`UPDATE users SET password=${hashPassword(password)} WHERE id=${row.id}`;
    }
    const {password: _pw, ...user} = row;
    return Response.json({ok:true,user});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
