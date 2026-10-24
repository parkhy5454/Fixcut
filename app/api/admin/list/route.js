import { verifyAdmin } from "../../auth/admin.js";
import { neon } from "@neondatabase/serverless";
import { openPhone, openSaving, ensureUserColumns, ensureSavingColumns } from "../../auth/crypto.js";
export async function GET(req){
  try{
    const v = await verifyAdmin(req);
    if(!v.ok) return Response.json({ok:false, error:"관리자만 접근할 수 있습니다"}, {status:v.status});
    const sql = neon(process.env.DATABASE_URL);
    await ensureUserColumns(sql);
    const userRows = await sql`SELECT id, name, phone, phone_enc, email, created_at FROM users ORDER BY id DESC LIMIT 100`;
    const users = userRows.map(r => ({id:r.id, name:r.name, phone:openPhone(r), email:r.email, created_at:r.created_at}));
    let savings=[];
    try{
      await ensureSavingColumns(sql);
      const rows = await sql`SELECT id, name, phone, phone_enc, total, details, details_enc, inputs, inputs_enc, carrier, phone_fee, data_usage, ott, ott_enc, loans, loans_enc, created_at FROM savings ORDER BY id DESC LIMIT 100`;
      savings = rows.map(openSaving);
    }catch(e){
      console.error("admin savings", e);
    }
    return Response.json({ok:true, users, savings});
  }catch(e){
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"},{status:500});
  }
}
