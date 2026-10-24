// [임시 진단] 금감원 연금 API 서비스 이름 확인용. 상품명·수익률 같은 공개 값만 돌려주고 인증키는 응답에 넣지 않는다.
// 확인이 끝나면 이 폴더를 지운다.
const NAMES = ["annuitySavingProductsSearch", "savingProductsSearch"];

export async function GET(){
  const auth = process.env.FINLIFE_AUTH_KEY;
  if(!auth) return Response.json({ ok:false, error:"FINLIFE_AUTH_KEY 없음" }, { status:503 });
  const out = {};
  for(const svc of NAMES){
    try{
      const url = `http://finlife.fss.or.kr/finlifeapi/${svc}.json?auth=${auth}&topFinGrpNo=060000&pageNo=1`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const products = Array.isArray(data.products) ? data.products : [];
      const base = Array.isArray(data.baseList) ? data.baseList : products.map(p => p.baseinfo).filter(Boolean);
      out[svc] = {
        status: res.status,
        err_msg: data.err_msg ?? null,
        total_count: data.total_count ?? null,
        topKeys: Object.keys(data).slice(0, 20),
        baseCount: base.length,
        sample: base.slice(0, 5).map(b => ({ kor_co_nm: b.kor_co_nm, fin_prdt_nm: b.fin_prdt_nm, avg_prft_rate: b.avg_prft_rate ?? null, btrm_prft_rate_1: b.btrm_prft_rate_1 ?? null, prdt_type_nm: b.prdt_type_nm ?? null })),
      };
    }catch(e){
      out[svc] = { error: String(e.message || e) };
    }
  }
  return Response.json({ ok:true, result: out });
}
