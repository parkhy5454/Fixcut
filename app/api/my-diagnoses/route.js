import { neon } from "@neondatabase/serverless";
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");
    if(!process.env.DATABASE_URL) return Response.json({savings:[]});
    const sql = neon(process.env.DATABASE_URL);
    let savings=[];
    if(phone){
      savings = await sql`SELECT * FROM savings WHERE phone=${phone} ORDER BY id DESC LIMIT 10`;
    } else if(email){
      savings = await sql`SELECT * FROM savings WHERE phone LIKE ${"%"+email+"%"} OR name LIKE ${"%"+email+"%"} ORDER BY id DESC LIMIT 10`;
    }
    return Response.json({savings});
  }catch(e){
    return Response.json({savings:[], error:String(e)});
  }
}
