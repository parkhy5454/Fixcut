
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const body = await req.json();
    const {oldEmail, name, phone, email, password, newPassword} = body;
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    // Always update name/phone/email, password optional
    if(newPassword && newPassword.trim()){
      await sql`UPDATE users SET name=${name.trim()}, phone=${phone}, email=${email.trim()}, password=${newPassword} WHERE email=${oldEmail}`;
    }else{
      await sql`UPDATE users SET name=${name.trim()}, phone=${phone}, email=${email.trim()} WHERE email=${oldEmail}`;
    }
    return Response.json({ok:true});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
