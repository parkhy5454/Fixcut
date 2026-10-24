import { verifyAdmin } from "../../../auth/admin.js";
import { writeAudit } from "../../../auth/audit.js";
import { ensureUserColumns } from "../../../auth/crypto.js";
// 회원 정지 / 정지 해제 (관리자만 가능, 모든 작업은 감사 로그에 남는다)
export async function POST(req){
  try{
    const v = await verifyAdmin(req);
    if(!v.ok) return Response.json({ok:false, error:"관리자만 접근할 수 있습니다"}, {status:v.status});
    const { id, suspend } = await req.json();
    if(!/^[0-9a-f-]{36}$/i.test(String(id||""))) return Response.json({ok:false, error:"잘못된 회원 번호입니다"}, {status:400});
    const adminEmail = (req.headers.get("x-user-email") || "").trim().toLowerCase();
    await ensureUserColumns(v.sql);
    const rows = await v.sql`SELECT email FROM users WHERE id=${id} LIMIT 1`;
    if(rows.length === 0) return Response.json({ok:false, error:"회원을 찾을 수 없습니다"}, {status:404});
    const targetEmail = rows[0].email;
    if(targetEmail === adminEmail) return Response.json({ok:false, error:"본인 계정은 정지할 수 없습니다"}, {status:400});
    const action = suspend ? "suspend" : "unsuspend";
    await writeAudit(v.sql, adminEmail, action, targetEmail, null);
    if(suspend){
      await v.sql`UPDATE users SET suspended_at = NOW() WHERE id=${id}`;
    }else{
      await v.sql`UPDATE users SET suspended_at = NULL WHERE id=${id}`;
    }
    return Response.json({ok:true});
  }catch(e){
    console.error("suspend", e);
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"}, {status:500});
  }
}
