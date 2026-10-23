
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const {email,password} = await req.json();
    const cleanEmail = (email||"").trim().toLowerCase();
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true,user:{name:"테스트",email:cleanEmail,phone:"010-1234-5678"}});
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, name, phone, email FROM users WHERE LOWER(email)=${cleanEmail} AND password=${password} LIMIT 1`;
    if(rows.length===0) return Response.json({ok:false,error:"not found"},{status:401});
    return Response.json({ok:true,user:rows[0]});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
