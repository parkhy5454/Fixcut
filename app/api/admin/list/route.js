
import { neon } from "@neondatabase/serverless";
export async function GET(){
  try{
    if(!process.env.DATABASE_URL){
      return Response.json({members:[{name:"테스트", phone:"010-1234-5678", email:"test@test.com", created_at:new Date()}], saves:[{data:{name:"테스트", carrier:"KT", phoneFee:69000, total:52000}, created_at:new Date()}]});
    }
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS members (id SERIAL PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, phone TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, data JSONB, created_at TIMESTAMP DEFAULT NOW())`;
    try{ await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS phone TEXT`; }catch(e){}
    const members = await sql`SELECT name, phone, email, created_at FROM members ORDER BY created_at DESC LIMIT 100`;
    const saves = await sql`SELECT data, created_at FROM users ORDER BY created_at DESC LIMIT 100`;
    return Response.json({members, saves});
  }catch(e){
    return Response.json({members:[], saves:[], error:e.message});
  }
}
