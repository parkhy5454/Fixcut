
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const {email, password, name, phone} = await req.json();
    if(!email || !password || !name || !phone) return Response.json({success:false, error:"이름/핸드폰/이메일/비밀번호 모두 입력해주세요"}, {status:400});
    if(!process.env.DATABASE_URL){
      return Response.json({success:true, user:{email, name, phone}});
    }
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS members (id SERIAL PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, phone TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    // Add phone column if not exists (for old table)
    try{ await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS phone TEXT`; }catch(e){}
    const exists = await sql`SELECT id FROM members WHERE email=${email}`;
    if(exists.length>0) return Response.json({success:false, error:"이미 가입된 이메일이에요"}, {status:400});
    await sql`INSERT INTO members (email, password, name, phone) VALUES (${email}, ${password}, ${name}, ${phone})`;
    return Response.json({success:true, user:{email, name, phone}});
  }catch(e){ return Response.json({success:false, error:e.message}, {status:500}); }
}
