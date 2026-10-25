
import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const body = await req.json();
    const email = (body.email || body.inputs?.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const name = (body.name || "").trim();
    const total = body.total || 0;
    const details = body.details || [];
    const inputs = body.inputs || {};
    const carrier = body.carrier || inputs.carrier || "";
    const phoneFee = body.phoneFee || inputs.phoneFee || "";
    const dataUsage = body.dataUsage || inputs.dataUsage || "";
    const ott = inputs.ott || body.ott || {};
    const loans = inputs.loans || body.loans || [];
    
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS savings (
      id SERIAL PRIMARY KEY,
      email TEXT,
      phone TEXT,
      name TEXT,
      total INTEGER,
      details JSONB,
      carrier TEXT,
      phone_fee TEXT,
      data_usage TEXT,
      ott JSONB,
      loans JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
    // Add email column if not exists (for old DB)
    try{ await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS email TEXT`; }catch(e){}
    
    await sql`INSERT INTO savings (email, phone, name, total, details, carrier, phone_fee, data_usage, ott, loans) VALUES (${email}, ${phone}, ${name}, ${total}, ${JSON.stringify(details)}, ${carrier}, ${phoneFee}, ${dataUsage}, ${JSON.stringify(ott)}, ${JSON.stringify(loans)})`;
    return Response.json({ok:true});
  }catch(e){
    console.error(e);
    return Response.json({ok:false, error:String(e)}, {status:500});
  }
}
