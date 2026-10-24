// [임시 진단] 금감원 연금저축 API 응답 구조 확인용. 공개 값만 돌려주고 인증키는 넣지 않는다. 확인 후 이 폴더를 지운다.
export async function GET(){
  const auth = process.env.FINLIFE_AUTH_KEY;
  if(!auth) return Response.json({ ok:false, error:"FINLIFE_AUTH_KEY 없음" }, { status:503 });
  const out = {};
  for(const pageNo of [1, 2]){
    const url = `http://finlife.fss.or.kr/finlifeapi/annuitySavingProductsSearch.json?auth=${auth}&topFinGrpNo=060000&pageNo=${pageNo}`;
    const res = await fetch(url, { cache: "no-store" });
    const raw = await res.json().catch(() => ({}));
    const r = raw.result && typeof raw.result === "object" ? raw.result : raw;
    const base = r.baseList, opt = r.optionList;
    out["page" + pageNo] = {
      total_count: r.total_count ?? null,
      max_page_no: r.max_page_no ?? null,
      now_page_no: r.now_page_no ?? null,
      baseListType: Array.isArray(base) ? "array" : typeof base,
      baseListLen: Array.isArray(base) ? base.length : null,
      optionListType: Array.isArray(opt) ? "array" : typeof opt,
      optionListLen: Array.isArray(opt) ? opt.length : null,
      firstBaseKeys: Array.isArray(base) && base[0] ? Object.keys(base[0]).slice(0, 40) : null,
      firstBase: Array.isArray(base) && base[0] ? { kor_co_nm: base[0].kor_co_nm, fin_prdt_nm: base[0].fin_prdt_nm, dcls_month: base[0].dcls_month, avg_prft_rate: base[0].avg_prft_rate, btrm_prft_rate_1: base[0].btrm_prft_rate_1, btrm_prft_rate_3: base[0].btrm_prft_rate_3 } : null,
      firstOptionKeys: Array.isArray(opt) && opt[0] ? Object.keys(opt[0]).slice(0, 40) : null,
      rawSnippet: JSON.stringify(r).slice(0, 600),
    };
  }
  return Response.json({ ok:true, result: out });
}
