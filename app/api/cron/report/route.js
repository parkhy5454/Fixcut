
import { getDb } from '@/lib/db';
export async function GET(req){
  try{
    const sql=getDb();
    // 실제로는 Vercel Cron으로 매달 1일 실행
    const report={
      month: new Date().getMonth()+1,
      totalSaved: 194000,
      breakdown: {
        telecom: 69100,
        ott: 25000,
        loan: 100000
      },
      newDeals: [
        {title:'KT M모바일 11GB 1만원 인하', save:10000},
        {title:'케이뱅크 대환 금리 0.2%p 하락', save:15000}
      ],
      message: '이번 달에도 고정지출 체크! 새로운 절약 기회 2건이 있어요.'
    };
    return Response.json(report);
  }catch(e){
    return Response.json({error:e.message},{status:500});
  }
}
