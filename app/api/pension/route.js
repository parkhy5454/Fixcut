// 연금 비교 데이터 (금감원 연금 공시 엑셀을 data/pension/*.json 으로 옮긴 것)
// 분기마다 엑셀을 받아 JSON 파일을 교체한다. 기준은 5년 장기수익률(연평균).
import savings from "../../../data/pension/savings.json";
import retirement from "../../../data/pension/retirement.json";

const KINDS = ["예금성 원리금보장", "원리금비보장"];
const TOP = 3;

export async function GET(){
  const savingsTop = savings.rows
    .filter(r => r.avg5 != null)
    .sort((a, b) => b.avg5 - a.avg5)
    .slice(0, 5)
    .map(r => ({ company: r.company, avg5: r.avg5, avg3: r.avg3, fee5: r.fee5 }));

  const irp = {};
  for(const kind of KINDS){
    irp[kind] = retirement.rows
      .filter(r => r.kind === kind && r.IRP && r.IRP.avg5 != null)
      .sort((a, b) => b.IRP.avg5 - a.IRP.avg5)
      .slice(0, TOP)
      .map(r => ({ company: r.company, avg5: r.IRP.avg5, avg3: r.IRP.avg3, reserve: r.IRP.reserve }));
  }

  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
  const retCompanies = {};
  for(const kind of KINDS){
    retCompanies[kind] = uniq(retirement.rows.filter(r => r.kind === kind && r.IRP && r.IRP.avg5 != null).map(r => r.company));
  }

  return Response.json({
    ok: true,
    savings: { asOf: savings.asOf, source: savings.source, top: savingsTop, companies: uniq(savings.rows.map(r => r.company)) },
    retirement: { asOf: retirement.asOf, source: retirement.source, irp, companies: retCompanies },
  });
}
