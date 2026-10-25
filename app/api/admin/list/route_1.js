import { neon } from "@neondatabase/serverless";
export async function GET(){
  try{
    if(!process.env.DATABASE_URL) return Response.json({users:[],savings:[]});
    const sql=neon(process.env.DATABASE_URL);
    const users=await sql`SELECT id, name, phone, email, created_at FROM users ORDER BY id DESC LIMIT 100`;
    let savings=[];
    try{
      savings=await sql`SELECT id, name, phone, total, details, inputs, carrier, phone_fee, data_usage, ott, loans, created_at FROM savings ORDER BY id DESC LIMIT 100`;
    }catch(e){
      savings=await sql`SELECT * FROM savings ORDER BY id DESC LIMIT 100`;
    }
    return Response.json({users,savings});
  }catch(e){
    return Response.json({users:[],savings:[],error:String(e)});
  }
}
