
export async function POST(req){
  try{
    const {familyCount, carrier, currentFees}=await req.json();
    const count=familyCount||4;
    const feePerPerson=currentFees||89000;
    // 결합 할인 계산 (SKT/KT/LG 기준)
    const bundleDiscounts={
      'SKT': [0, 0, 10000, 20000, 30000], // 2명~5명
      'KT': [0, 0, 12000, 22000, 32000],
      'LGU+': [0, 0, 8000, 18000, 28000],
    };
    const discount=(bundleDiscounts[carrier]||bundleDiscounts['SKT'])[Math.min(count,5)-1]||0;
    const totalCurrent=feePerPerson*count;
    const totalWithBundle=totalCurrent - discount*count;
    const mvnoTotal=19900*count;
    return Response.json({
      familyCount: count,
      currentTotal: totalCurrent,
      withBundle: totalWithBundle,
      mvnoTotal: mvnoTotal,
      saveBundle: totalCurrent - totalWithBundle,
      saveMvno: totalCurrent - mvnoTotal,
      recommendation: mvnoTotal < totalWithBundle ? '가족 전체 알뜰폰이 더 저렴' : '현재 통신사 결합 유지가 유리',
      details: `${carrier} ${count}인 결합 시 인당 ${discount.toLocaleString()}원 할인`
    });
  }catch(e){
    return Response.json({error:e.message},{status:500});
  }
}
