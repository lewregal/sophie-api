import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const assistantId = "asst_4Xeiszizc7MG9q2dToC07ReY";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const userMessage = req.body.message;

  try {
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userMessage
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    let status = "queued";
    let attempts = 0;

    while (status !== "completed" && attempts < 10) {
      await new Promise(r => setTimeout(r, 1000));
      const check = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = check.status;
      attempts++;
    }

    if (status === "completed") {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const reply = messages.data?.[0]?.content?.[0]?.text?.value || "No response.";
      return res.status(200).json({ reply });
    } else {
      return res.status(504).json({ reply: "Sophie timed out." });
    }
  } catch (err) {
    console.error("Sophie error:", err);
    return res.status(500).json({ reply: "Something went wrong." });
  }
}
