const L = require("./_lib");
const { sql } = L;
const KB = require("./_kb");
const PREF = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant", "openai/gpt-oss-20b", "meta-llama/llama-4-scout-17b-16e-instruct", "qwen/qwen3-32b"];
let MC = { t: 0, m: null };
async function pickModel(key) {
  if (process.env.GROQ_MODEL) return process.env.GROQ_MODEL;
  if (MC.m && Date.now() - MC.t < 36e5) return MC.m;
  const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: "Bearer " + key } });
  if (!r.ok) throw new Error("models");
  const ids = ((await r.json()).data || []).filter((m) => m.active !== false).map((m) => m.id);
  const m = PREF.find((p) => ids.includes(p)) || ids.find((i) => !/whisper|guard|tts|orpheus|playai|safeguard/i.test(i));
  if (!m) throw new Error("nomodel");
  MC = { t: Date.now(), m };
  return m;
}
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    await L.ensure();
    const u = await L.getUser(req);
    if (!u) return res.status(401).json({ error: "Faça login para continuar." });
    if (req.method === "GET") {
      const r = await sql`SELECT role,content FROM messages WHERE user_id=${u.id} ORDER BY id DESC LIMIT 60`;
      return res.json({ messages: r.reverse() });
    }
    if (req.method === "DELETE") { await sql`DELETE FROM messages WHERE user_id=${u.id}`; return res.json({ ok: true }); }
    if (req.method !== "POST") return res.status(405).end();
    const text = String((req.body || {}).message || "").trim().slice(0, 2000);
    if (!text) return res.status(400).json({ error: "Digite uma mensagem." });
    const key = process.env.GROQ_API_KEY;
    if (!key) return res.status(503).json({ error: "O assistente ainda não foi configurado." });
    const recent = await sql`SELECT count(*)::int AS n FROM messages WHERE user_id=${u.id} AND role='user' AND created_at > now() - interval '1 minute'`;
    if (recent[0].n >= 15) return res.status(429).json({ error: "Muitas mensagens seguidas. Aguarde um instante." });
    const hist = (await sql`SELECT role,content FROM messages WHERE user_id=${u.id} ORDER BY id DESC LIMIT 20`).reverse();
    const model = await pickModel(key);
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.4, max_tokens: 700, messages: [{ role: "system", content: KB + `\nA pessoa que está conversando se chama ${u.name.split(" ")[0]}.` }, ...hist, { role: "user", content: text }] }),
    });
    if (!r.ok) { MC = { t: 0, m: null }; return res.status(502).json({ error: "O assistente não conseguiu responder agora. Tente de novo." }); }
    let reply = (((await r.json()).choices || [])[0] || {}).message?.content || "";
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (!reply) return res.status(502).json({ error: "Resposta vazia. Tente de novo." });
    await sql`INSERT INTO messages (user_id,role,content) VALUES (${u.id},'user',${text}),(${u.id},'assistant',${reply})`;
    return res.json({ reply });
  } catch (e) { return res.status(500).json({ error: "Erro no servidor. Tente novamente." }); }
};
