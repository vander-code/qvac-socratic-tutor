// Socratic Tutor - a tiny local web server that runs AI on YOUR machine with QVAC.
// No API key, no cloud. Open http://localhost:3000 after starting.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadModel, completion, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The "personality" of the tutor. Change these rules to change how it teaches.
const SYSTEM_PROMPT = `You are a friendly Socratic tutor for a beginner.
Rules:
1. NEVER explain or give the answer, even if the student asks for it.
2. Reply with ONE short question only (maximum 25 words), in very simple words.
3. Start with an easy question. Make each new question a little deeper, based on the student's last answer.
4. If the student is right, praise them in 3-5 words, then ask the next question.
5. If the student is wrong or unsure, do not say the answer. Ask an easier question that gives a small hint.
The student's first message tells you the topic.`;

// ---- Step 1: load the AI model (downloads the first time, then it's cached) ----
let modelId = null;
const status = { ready: false, message: "Starting...", percent: null, error: null };

async function startModel() {
  try {
    status.message = "Loading the AI model (first run downloads it, please wait)...";
    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0, // a small model, fine for laptops
      modelType: "llm",
      onProgress: (p) => {
        const value = typeof p === "number" ? p : p?.percentage;
        if (typeof value === "number") status.percent = Math.round(value);
      },
    });
    status.ready = true;
    status.message = "Model ready";
    console.log("Model loaded. Open http://localhost:" + PORT);
  } catch (err) {
    status.error = String(err?.message || err);
    console.error("Could not load model:", err);
  }
}

// ---- Step 2: a small web server ----
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // The web page
  if (req.method === "GET" && req.url === "/") {
    const html = await readFile(path.join(__dirname, "public", "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  // The page asks: "is the model ready yet?"
  if (req.method === "GET" && req.url === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(status));
  }

  // The page sends the conversation, we stream back the tutor's next question
  if (req.method === "POST" && req.url === "/api/chat") {
    if (!status.ready) {
      res.writeHead(503);
      return res.end("Model is not ready yet.");
    }
    try {
      const { messages } = JSON.parse(await readBody(req));
      const history = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-12), // keep only the recent turns
      ];

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });

      // This is the QVAC call that runs the AI on-device
      const run = completion({ modelId, history, stream: true });
      for await (const token of run.tokenStream) {
        res.write(token);
      }
      return res.end();
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.writeHead(500);
      return res.end("\n[Something went wrong: " + (err?.message || err) + "]");
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => console.log("Server running at http://localhost:" + PORT));
startModel();
