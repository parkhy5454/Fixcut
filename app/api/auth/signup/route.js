
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const {name,phone,email,password} = await req.json();
    const cleanName = (name||"").trim();
    const cleanPhone = (phone||"").trim();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanName || !cleanPhone || !cleanEmail || !password){
      return Response.json({ok:false, error:"모든 필드 필요"}, {status:400});
    }
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())`;
    // UPSERT - 같은 이메일이면 이름/폰/비번 덮어쓰기
    await sql`
      INSERT INTO users (name, phone, email, password)
      VALUES (${cleanName}, ${cleanPhone}, ${cleanEmail}, ${password})
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password
    `;
    const rows = await sql`SELECT id, name, phone, email FROM users WHERE email=${cleanEmail} LIMIT 1`;
    return Response.json({ok:true, user:rows[0]});
  }catch(e){
    console.error("signup error", e);
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
