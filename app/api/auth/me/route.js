
import { neon } from "@neondatabase/serverless";
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email")||"").trim().toLowerCase();
    if(!email) return Response.json({ok:false},{status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:true, user:{name:"테스트", email, phone:"010-1234-5678"}});
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, name, phone, email FROM users WHERE LOWER(email)=${email} LIMIT 1`;
    if(rows.length===0) return Response.json({ok:false},{status:404});
    return Response.json({ok:true, user:rows[0]});
  }catch(e){ return Response.json({ok:false, error:String(e)},{status:500}); }
}
export async function POST(req){
  try{
    const {email, name, phone} = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!cleanEmail) return Response.json({ok:false},{status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:true});
    const sql = neon(process.env.DATABASE_URL);
    if(phone){
      await sql`UPDATE users SET name=${name.trim()}, phone=${phone} WHERE LOWER(email)=${cleanEmail}`;
    }else{
      await sql`UPDATE users SET name=${name.trim()} WHERE LOWER(email)=${cleanEmail}`;
    }
    return Response.json({ok:true});
  }catch(e){ return Response.json({ok:false, error:String(e)},{status:500}); }
}
