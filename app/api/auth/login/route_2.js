
import { getDb, initTables } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';
export async function POST(req){
  try{
    const {email,password}=await req.json();
    const cleanEmail=email.trim().toLowerCase();
    const sql=getDb();
    if(!sql) return Response.json({error:'DB 미연결 - Vercel Storage에서 Neon 연결 필요'},{status:503});
    await initTables();
    const rows=await sql`SELECT id,email,name,phone,password_hash,referral_code FROM users WHERE LOWER(email)=${cleanEmail}`;
    if(rows.length===0) return Response.json({error:'가입되지 않은 이메일'},{status:404});
    const user=rows[0];
    const ok=await verifyPassword(password,user.password_hash);
    if(!ok) return Response.json({error:'비밀번호 불일치'},{status:401});
    const token=signToken({id:user.id,email:user.email});
    return Response.json({user:{id:user.id,email:user.email,name:user.name,phone:user.phone,referral_code:user.referral_code},token});
  }catch(e){ console.error(e); return Response.json({error:'서버 오류'},{status:500}); }
}
