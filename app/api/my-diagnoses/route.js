import { neon } from "@neondatabase/serverless";
import { checkSession } from "../auth/password.js";
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email")||"").trim().toLowerCase();
    if(!email) return Response.json({ok:false, error:"email 필요"},{status:400});
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:true, savings:[]});
    const sql = neon(process.env.DATABASE_URL);
    const users = await sql`SELECT password FROM users WHERE LOWER(email)=${email} LIMIT 1`;
    // 토큰이 맞는 회원만 본인 기록을 볼 수 있다
    if(users.length === 0 || !checkSession(req, email, users[0].password)){
      return Response.json({ok:false, error:"로그인이 필요합니다"},{status:401});
    }
    let savings = [];
    try{
      savings = await sql`SELECT id, name, total, details, inputs, created_at FROM savings WHERE LOWER(email)=${email} ORDER BY id DESC LIMIT 50`;
    }catch(e){
      // savings 테이블이나 email 컬럼이 아직 없으면 기록이 없는 것으로 본다
      console.error("my-diagnoses query", e);
    }
    return Response.json({ok:true, savings});
  }catch(e){
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"},{status:500});
  }
}
