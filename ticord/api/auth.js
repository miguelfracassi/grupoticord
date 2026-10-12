const L = require("./_lib");
const { sql } = L;
const bad = (res, m, c) => res.status(c || 400).json({ error: m });
module.exports = async (req, res) => {
  const a = req.query.a;
  res.setHeader("Cache-Control", "no-store");
  try {
    await L.ensure();
    if (a === "captcha" && req.method === "GET") return res.json(L.makeCaptcha());
    if (a === "me") { const u = await L.getUser(req); return res.json({ user: u ? L.pub(u) : null }); }
    if (req.method !== "POST") return res.status(405).end();
    const b = req.body || {}, str = (v, n) => String(v || "").trim().slice(0, n);

    if (a === "register") {
      const name = str(b.name, 80), email = str(b.email, 160).toLowerCase(), phone = str(b.phone, 30), pw = String(b.password || "");
      if (!L.checkCaptcha(b.captchaToken, b.captcha)) return bad(res, "Código da imagem incorreto. Tente o novo código.");
      if (name.length < 2) return bad(res, "Digite seu nome.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad(res, "Digite um email válido.");
      if (phone.replace(/\D/g, "").length < 10 || phone.replace(/\D/g, "").length > 13) return bad(res, "Digite um telefone válido com DDD.");
      if (pw.length < 8 || pw.length > 100) return bad(res, "A senha precisa ter de 8 a 100 caracteres.");
      if (!(await L.mailOk(email))) return bad(res, "Esse email não parece existir. Confira o domínio.");
      if ((await sql`SELECT 1 FROM users WHERE email=${email}`).length) return bad(res, "Este email já está cadastrado. Entre na sua conta.", 409);
      const r = await sql`INSERT INTO users (name,email,phone,password_hash) VALUES (${name},${email},${phone},${L.hashPw(pw)}) RETURNING id,name,email,phone,theme,color`;
      L.setSession(res, r[0].id);
      return res.json({ user: L.pub(r[0]) });
    }
    if (a === "login") {
      const email = str(b.email, 160).toLowerCase();
      if (!L.checkCaptcha(b.captchaToken, b.captcha)) return bad(res, "Código da imagem incorreto. Tente o novo código.");
      const r = await sql`SELECT id,name,email,phone,password_hash,theme,color FROM users WHERE email=${email}`;
      if (!r[0] || !L.checkPw(String(b.password || ""), r[0].password_hash)) { await new Promise((k) => setTimeout(k, 600)); return bad(res, "Email ou senha incorretos.", 401); }
      L.setSession(res, r[0].id);
      return res.json({ user: L.pub(r[0]) });
    }
    if (a === "logout") { L.clearSession(res); return res.json({ ok: true }); }

    const u = await L.getUser(req);
    if (!u) return bad(res, "Faça login para continuar.", 401);
    if (a === "prefs") {
      const theme = ["auto", "light", "dark"].includes(b.theme) ? b.theme : u.theme;
      const color = /^#[0-9a-fA-F]{6}$/.test(b.color || "") ? b.color : u.color;
      await sql`UPDATE users SET theme=${theme}, color=${color} WHERE id=${u.id}`;
      return res.json({ ok: true, theme, color });
    }
    if (a === "password") {
      const next = String(b.next || "");
      if (!L.checkPw(String(b.current || ""), u.password_hash)) return bad(res, "Senha atual incorreta.", 401);
      if (next.length < 8 || next.length > 100) return bad(res, "A nova senha precisa ter de 8 a 100 caracteres.");
      await sql`UPDATE users SET password_hash=${L.hashPw(next)} WHERE id=${u.id}`;
      return res.json({ ok: true });
    }
    if (a === "delete") {
      if (!L.checkPw(String(b.password || ""), u.password_hash)) return bad(res, "Senha incorreta.", 401);
      await sql`DELETE FROM users WHERE id=${u.id}`;
      L.clearSession(res);
      return res.json({ ok: true });
    }
    return bad(res, "Ação inválida.", 404);
  } catch (e) { return res.status(500).json({ error: "Erro no servidor. Tente novamente." }); }
};
