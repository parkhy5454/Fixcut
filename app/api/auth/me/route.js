import { neon } from "@neondatabase/serverless";
import { openPhone, ensureUserColumns } from "../crypto.js";
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email")||"").trim().toLowerCase();
    if(!email) return Response.json({ok:false},{status:400});
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:false, mock:true},{status:503});
    const sql = neon(process.env.DATABASE_URL);
    await ensureUserColumns(sql);
    const rows = await sql`SELECT id, name, phone, phone_enc, email FROM users WHERE LOWER(email)=LOWER(${email}) LIMIT 1`;
    if(rows.length===0) return Response.json({ok:false},{status:404});
    const r = rows[0];
    return Response.json({ok:true, user:{name:r.name, phone:openPhone(r), email:r.email}});
  }catch(e){ return Response.json({ok:false, error:"서버 오류가 발생했습니다"},{status:500}); }
}
// 예전의 인증 없는 POST(이름·번호 변경)는 제거했다. 정보 수정은 /api/auth/update 를 사용한다.
