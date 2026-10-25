
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const {name,phone,email,password} = await req.json();
    const cleanName = (name||"").trim();
    const cleanPhone = (phone||"").trim();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanName || !cleanPhone || !cleanEmail || !password) return Response.json({ok:false, error:"필수 정보 누락"}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true, user:{name:cleanName, phone:cleanPhone, email:cleanEmail}});
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`
      INSERT INTO users (name, phone, email, password) VALUES (${cleanName}, ${cleanPhone}, ${cleanEmail}, ${password})
      ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, password=EXCLUDED.password
    `;
    const rows = await sql`SELECT id, name, phone, email FROM users WHERE LOWER(email)=${cleanEmail} LIMIT 1`;
    return Response.json({ok:true, user:rows[0]});
  }catch(e){ console.error(e); return Response.json({ok:false,error:String(e)},{status:500}); }
}
