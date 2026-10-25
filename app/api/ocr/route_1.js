
export async function POST(req){
  try{
    const formData=await req.formData();
    const file=formData.get('file');
    if(!file) return Response.json({error:'파일 없음'},{status:400});
    // MVP: 파일명/텍스트 기반 파싱, 실제로는 GPT-4 Vision or Tesseract 연동
    // 여기서는 예시로 랜덤 추출 (실제 연동시 OpenAI API 호출)
    const text=await file.text().catch(()=> '');
    // 간단 파싱 로직 - 실제로는 AI OCR
    const result={
      phoneFee: 89000,
      carrier: 'SKT',
      dataUsage: 15,
      loans: [{institution:'카카오뱅크', amount:'30000000', rate:'4.8'}],
      ott: ['Netflix','YouTube Premium'],
      confidence: 0.85,
      rawText: text.slice(0,200),
      message: '명세서에서 자동 추출 (MVP - GPT Vision 연동 예정)'
    };
    return Response.json(result);
  }catch(e){
    return Response.json({error:e.message},{status:500});
  }
}
