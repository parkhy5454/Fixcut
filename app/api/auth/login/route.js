
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const {email, password} = await req.json();
    if(!process.env.DATABASE_URL){
      return Response.json({success:true, user:{email, name:"테스트유저"}});
    }
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS members (id SERIAL PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    const rows = await sql`SELECT email, name FROM members WHERE email=${email} AND password=${password}`;
    if(rows.length===0) return Response.json({success:false, error:"이메일 또는 비밀번호가 틀렸어요"}, {status:401});
    return Response.json({success:true, user:rows[0]});
  }catch(e){ return Response.json({success:false, error:e.message}, {status:500}); }
}
