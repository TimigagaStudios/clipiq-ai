const provider = (process.env.CLIPIQ_AI_PROVIDER || "heuristic").toLowerCase();

export async function rankCandidates({ transcript, candidates }) {
  if (provider === "heuristic") return candidates;
  if (provider === "gemini") return rankWithGemini(transcript, candidates);
  if (["groq", "openrouter"].includes(provider)) return rankWithOpenAICompatible(provider, transcript, candidates);
  throw new Error(`Unsupported CLIPIQ_AI_PROVIDER: ${provider}`);
}

async function rankWithGemini(transcript, candidates) {
  const key = required("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt(transcript, candidates) }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
  const body = await response.json();
  return parseRanked(body.candidates?.[0]?.content?.parts?.[0]?.text, candidates);
}

async function rankWithOpenAICompatible(name, transcript, candidates) {
  const key = required(name === "groq" ? "GROQ_API_KEY" : "OPENROUTER_API_KEY");
  const endpoint = name === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.CLIPIQ_AI_MODEL || (name === "groq" ? "llama-3.3-70b-versatile" : "openai/gpt-4o-mini");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: "user", content: prompt(transcript, candidates) }] }),
  });
  if (!response.ok) throw new Error(`${name} request failed (${response.status})`);
  const body = await response.json();
  return parseRanked(body.choices?.[0]?.message?.content, candidates);
}

function prompt(transcript, candidates) {
  return `Rank these video clip candidates for short-form virality. Return only a JSON array of objects with index and score (0-100). Transcript: ${transcript.slice(0, 12000)} Candidates: ${JSON.stringify(candidates.map(({ start, duration, title }, index) => ({ index, start, duration, title })))}.`;
}

function parseRanked(text, candidates) {
  if (!text) return candidates;
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return candidates;
  try {
    const scores = JSON.parse(match[0]);
    return candidates.map((candidate, index) => ({ ...candidate, score: Number(scores.find((item) => item.index === index)?.score ?? candidate.score) })).sort((a, b) => b.score - a.score);
  } catch {
    return candidates;
  }
}

function required(name) {
  if (!process.env[name]) throw new Error(`${name} is required for CLIPIQ_AI_PROVIDER=${provider}`);
  return process.env[name];
}