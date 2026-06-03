// 可选：真实 AI 伴学（Netlify Function）
// 启用方式：Netlify 站点 → Site configuration → Environment variables 添加
//   ANTHROPIC_API_KEY = 你的 Anthropic API Key
// 未设置 Key 时本函数返回 503，前端会自动回退到内置的本地伴学逻辑。
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'no-key' }), { status: 503 });

  let body = {};
  try { body = await req.json(); } catch {}
  const message = String(body.message || '').slice(0, 2000);
  const lang = body.lang === 'en' ? 'en' : 'zh';
  const system = lang === 'en'
    ? "You are '小光' (Xiaoguang), a warm, concise study companion inside a focus app. Encourage the user genuinely, give practical study and Pomodoro advice, and keep replies under 80 words."
    : "你是专注自习应用里的伴学搭子‘小光’，温暖、真诚、简洁。请鼓励用户、给出实用的学习与番茄钟建议，回复控制在 80 字以内。";

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',   // 如该模型停用，改成当时可用的型号
        max_tokens: 320,
        system,
        messages: [{ role: 'user', content: message }],
      }),
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'upstream', status: r.status }), { status: 502 });
    const data = await r.json();
    const reply = (data.content && data.content[0] && data.content[0].text) || '';
    return new Response(JSON.stringify({ reply }), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'exception' }), { status: 500 });
  }
};
