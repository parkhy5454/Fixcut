
import { getDb, initTables } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
export async function POST(req){
  try{
    const {type, referredEmail} = await req.json();
    const auth=req.headers.get('authorization');
    const token=auth?.replace('Bearer ','');
    const payload=token?verifyToken(token):null;
    const sql=getDb();
    const rewardMap={signup:5000, diagnosis:5000, mvno_change:10000, loan_refi:20000, referral:10000};
    const amount=rewardMap[type]||5000;
    if(sql){
      await initTables();
      await sql`CREATE TABLE IF NOT EXISTS rewards (id SERIAL PRIMARY KEY, user_id INT, type TEXT, amount INT, status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW())`;
      if(payload) await sql`INSERT INTO rewards (user_id, type, amount) VALUES (${payload.id}, ${type}, ${amount})`;
    }
    return Response.json({success:true, amount, message: `\u20a9${amount.toLocaleString()} 리워드 적립! (MVP - 실제 송금은 토스 API 연동 필요)`, nextStep: '친구 초대하면 1만원 추가!'});
  }catch(e){ return Response.json({error:e.message},{status:500}); }
}
export async function GET(req){
  const auth=req.headers.get('authorization');
  const token=auth?.replace('Bearer ','');
  const payload=token?verifyToken(token):null;
  const sql=getDb();
  if(!sql||!payload) return Response.json({rewards:[], total:0});
  const rows=await sql`SELECT * FROM rewards WHERE user_id=${payload.id} ORDER BY created_at DESC`;
  const total=rows.reduce((s,r)=>s+r.amount,0);
  return Response.json({rewards:rows, total});
}
