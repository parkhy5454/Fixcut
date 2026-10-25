
export async function POST(req){
  try{
    const {type}=await req.json();
    // MVP: MyData 시뮬레이션 - 실제로는 쿠콘/뱅크샐러드 API 연동
    const mockData={
      telecom: {carrier:'SKT', fee:89000, dataUsed: 18.5, plan:'5G 100GB'},
      ott: [
        {name:'Netflix', fee:17000, lastUsed:'2일 전'},
        {name:'YouTube Premium', fee:14900, lastUsed:'어제'},
        {name:'Tving', fee:13900, lastUsed:'30일 전 - 해지 추천!'},
      ],
      loans: [
        {bank:'카카오뱅크', balance:30000000, rate:4.8, monthly: 340000},
        {bank:'토스뱅크', balance:10000000, rate:5.2, monthly: 120000},
      ],
      totalFixed: 670000
    };
    return Response.json({success:true, data: mockData, notice: 'MyData 연동 MVP - 실제로는 금융결제원 MyData API 연동 필요'});
  }catch(e){
    return Response.json({error:e.message},{status:500});
  }
}
