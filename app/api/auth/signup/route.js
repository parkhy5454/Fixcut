
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const {email, password, name} = await req.json();
    if(!email || !password || !name) return Response.json({success:false, error:"모두 입력해주세요"}, {status:400});
    if(!process.env.DATABASE_URL){
      return Response.json({success:true, user:{email, name}});
    }
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS members (id SERIAL PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    const exists = await sql`SELECT id FROM members WHERE email=${email}`;
    if(exists.length>0) return Response.json({success:false, error:"이미 가입된 이메일이에요"}, {status:400});
    await sql`INSERT INTO members (email, password, name) VALUES (${email}, ${password}, ${name})`;
    return Response.json({success:true, user:{email, name}});
  }catch(e){ return Response.json({success:false, error:e.message}, {status:500}); }
}
