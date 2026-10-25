
export async function GET(){
  const mvnoRates=[
    {carrier:'U+알뜰모바일', name:'유심 10GB 19,900원', fee:19900, data:10, link:'https://www.lgup.com', isLowest:true},
    {carrier:'KT M모바일', name:'모두다 무제한 33,000원', fee:33000, data:11, link:'https://www.ktmmobile.com'},
    {carrier:'리브모바일', name:'청년 12GB 22,000원', fee:22000, data:12, link:'https://www.livm.co.kr'},
  ];
  const loanRates=[
    {bank:'케이뱅크', name:'신용대출 대환 최저', rate:3.85, link:'https://www.kbanknow.com'},
    {bank:'카카오뱅크', name:'신용대출 대환', rate:4.12, link:'https://www.kakaobank.com'},
  ];
  return Response.json({mvnoRates,loanRates,notice:'2026년 5월 기준 공시 데이터 기반 추정치. 실제 금리는 개인 신용도에 따라 다를 수 있습니다.',updatedAt:new Date().toISOString()});
}
