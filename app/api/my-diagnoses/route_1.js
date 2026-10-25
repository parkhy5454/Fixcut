
import { neon } from "@neondatabase/serverless";
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email")||"").trim().toLowerCase();
    const phone = (searchParams.get("phone")||"").trim();
    if(!process.env.DATABASE_URL) return Response.json({ok:true, savings:[]});
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS savings (id SERIAL PRIMARY KEY, email TEXT, phone TEXT, name TEXT, total INTEGER, details JSONB, carrier TEXT, phone_fee TEXT, data_usage TEXT, ott JSONB, loans JSONB, created_at TIMESTAMP DEFAULT NOW())`;
    try{ await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS email TEXT`; }catch(e){}
    
    let rows = [];
    if(email){
      rows = await sql`SELECT * FROM savings WHERE LOWER(email)=${email} ORDER BY created_at DESC LIMIT 20`;
      // Fallback: if no result with email, try phone
      if(rows.length===0 && phone){
        rows = await sql`SELECT * FROM savings WHERE phone=${phone} ORDER BY created_at DESC LIMIT 20`;
      }
    }else if(phone){
      rows = await sql`SELECT * FROM savings WHERE phone=${phone} ORDER BY created_at DESC LIMIT 20`;
    }
    return Response.json({ok:true, savings:rows});
  }catch(e){
    console.error(e);
    return Response.json({ok:false, error:String(e), savings:[]}, {status:500});
  }
}
