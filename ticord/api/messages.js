const { neon } = require("@neondatabase/serverless");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || (req.body || {}).password !== pw) return res.status(401).json({ error: "unauthorized" });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS contacts (id SERIAL PRIMARY KEY, name TEXT, email TEXT, phone TEXT, sector TEXT, message TEXT, created_at TIMESTAMPTZ DEFAULT now())`;
    const items = await sql`SELECT name,email,phone,sector,message,created_at FROM contacts ORDER BY created_at DESC LIMIT 500`;
    res.status(200).json({ items });
  } catch (e) { res.status(500).json({ error: "server" }); }
};
