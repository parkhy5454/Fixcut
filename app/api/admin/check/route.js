import { verifyAdmin } from "../../auth/admin.js";
// 화면에 관리자 메뉴를 보여줄지 판단하는 용도 (데이터는 반환하지 않음)
export async function GET(req){
  try{
    const v = await verifyAdmin(req);
    return Response.json({ok:true, isAdmin: v.ok === true});
  }catch(e){
    return Response.json({ok:true, isAdmin:false});
  }
}
