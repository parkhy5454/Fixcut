import { neon } from "@neondatabase/serverless";
export async function POST(req){
  try{
    const body = await req.json();
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS savings (
      id SERIAL PRIMARY KEY,
      name TEXT,
      phone TEXT,
      total INT,
      details JSONB,
      inputs JSONB,
      carrier TEXT,
      phone_fee TEXT,
      data_usage TEXT,
      ott JSONB,
      loans JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
    // add columns if old table exists
    try{
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS inputs JSONB`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS carrier TEXT`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS phone_fee TEXT`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS data_usage TEXT`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS ott JSONB`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS loans JSONB`;
    }catch(e){}

    await sql`INSERT INTO savings (name, phone, total, details, inputs, carrier, phone_fee, data_usage, ott, loans)
      VALUES (
        ${body.name||""},
        ${body.phone||""},
        ${body.total||0},
        ${JSON.stringify(body.details||[])},
        ${JSON.stringify(body.inputs||{})},
        ${body.inputs?.carrier||body.carrier||""},
        ${body.inputs?.phoneFee||body.phoneFee||""},
        ${body.inputs?.dataUsage||body.dataUsage||""},
        ${JSON.stringify(body.inputs?.ott||body.ott||{})},
        ${JSON.stringify(body.inputs?.loans||body.loans||[])}
      )`;
    return Response.json({ok:true});
  }catch(e){
    return Response.json({ok:false,error:String(e)},{status:500});
  }
}
