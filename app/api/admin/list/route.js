import { verifyAdmin } from "../../auth/admin.js";
import { neon } from "@neondatabase/serverless";
export async function GET(req){
  try{
    const v = await verifyAdmin(req);
    if(!v.ok) return Response.json({ok:false, error:"관리자만 접근할 수 있습니다"}, {status:v.status});
    const sql = neon(process.env.DATABASE_URL);
    const users=await sql`SELECT id, name, phone, email, created_at FROM users ORDER BY id DESC LIMIT 100`;
    let savings=[];
    try{
      savings=await sql`SELECT id, name, phone, total, details, inputs, carrier, phone_fee, data_usage, ott, loans, created_at FROM savings ORDER BY id DESC LIMIT 100`;
    }catch(e){
      savings=await sql`SELECT * FROM savings ORDER BY id DESC LIMIT 100`;
    }
    return Response.json({ok:true, users, savings});
  }catch(e){
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"},{status:500});
  }
}
