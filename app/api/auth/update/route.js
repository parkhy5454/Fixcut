
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const {oldEmail, name, phone, email, newPassword} = await req.json();
    const cleanName = (name||"").trim();
    const cleanPhone = (phone||"").trim();
    const cleanEmail = (email||"").trim().toLowerCase();
    const cleanOld = (oldEmail||"").trim().toLowerCase();
    if(!cleanOld || !cleanName || !cleanPhone || !cleanEmail){
      return Response.json({ok:false, error:"모든 필드 필요"}, {status:400});
    }
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    const rows = newPassword && newPassword.trim()
      ? await sql`UPDATE users SET name=${cleanName}, phone=${cleanPhone}, email=${cleanEmail}, password=${newPassword} WHERE LOWER(email)=${cleanOld} RETURNING id`
      : await sql`UPDATE users SET name=${cleanName}, phone=${cleanPhone}, email=${cleanEmail} WHERE LOWER(email)=${cleanOld} RETURNING id`;
    if(rows.length===0) return Response.json({ok:false, error:"회원을 찾을 수 없습니다"}, {status:404});
    return Response.json({ok:true});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
