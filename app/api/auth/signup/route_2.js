
import { getDb, initTables } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
export async function POST(req){
  try{
    const {name,email,phone,password,referralCode}=await req.json();
    if(!name||!email||!password) return Response.json({error:'필수 정보 없음'},{status:400});
    if(name.includes('@')||!/[가-힣]/.test(name)) return Response.json({error:'이름을 한글 실명으로 입력해주세요'},{status:400});
    const cleanEmail=email.trim().toLowerCase();
    const cleanName=name.trim();
    const cleanPhone=(phone||'').trim();
    const sql=getDb();
    if(!sql){
      const user={id:Date.now(),name:cleanName,email:cleanEmail,phone:cleanPhone};
      const token=signToken({id:user.id,email:cleanEmail});
      return Response.json({user,token,mode:'local'});
    }
    await initTables();
    const hash=await hashPassword(password);
    const myCode='FIXCUT-'+Math.random().toString(36).substring(2,8).toUpperCase();
    const rows=await sql`
      INSERT INTO users (email,name,phone,password_hash,referral_code,referred_by)
      VALUES (${cleanEmail},${cleanName},${cleanPhone},${hash},${myCode},${referralCode||''})
      ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, password_hash=EXCLUDED.password_hash
      RETURNING id,email,name,phone,referral_code
    `;
    const user=rows[0];
    const token=signToken({id:user.id,email:user.email});
    return Response.json({user,token});
  }catch(e){ console.error(e); return Response.json({error:'서버 오류: '+e.message},{status:500}); }
}
