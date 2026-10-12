const { neon } = require("@neondatabase/serverless");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const b = req.body || {};
  const c = (v, n) => String(v || "").trim().slice(0, n);
  const d = { name: c(b.name, 120), email: c(b.email, 160), phone: c(b.phone, 40), sector: c(b.sector, 20), message: c(b.message, 3000) };
  if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email) || d.phone.replace(/\D/g, "").length < 8 || !d.message) return res.status(400).json({ error: "invalid" });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS contacts (id SERIAL PRIMARY KEY, name TEXT, email TEXT, phone TEXT, sector TEXT, message TEXT, created_at TIMESTAMPTZ DEFAULT now())`;
    await sql`INSERT INTO contacts (name,email,phone,sector,message) VALUES (${d.name},${d.email},${d.phone},${d.sector},${d.message})`;
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: "server" }); }
};
