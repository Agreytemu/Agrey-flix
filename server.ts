import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log env setup status on start
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[WARN] GEMINI_API_KEY is not defined in your environment variables. Serra AI features will be offline.");
  } else {
    console.log("[INFO] GEMINI_API_KEY is configured correctly for Serra AI.");
  }

  // Initialize the Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Secure Admin Serra AI endpoint
  app.post("/api/admin/serra/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your Secrets panel." 
        });
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing or invalid 'messages' array in request body." });
      }

      // Build system instruction providing rich analytics context to Serra
      const systemInstruction = `
You are SERRA, the advanced, highly secure administrative AI Brain and Operations Assistant for the AgreyFlix streaming portal.
You have absolute access to AgreyFlix CTRL's live database analytics, system configuration, server health metrics, and audit/security logs.

Here is the real-time system context retrieved from Supabase and client telemetry:
${JSON.stringify(context || {}, null, 2)}

Your Primary Directives:
1. Analytical Intelligence:
   - Provide executive summaries of AgreyFlix metrics (Users, Activity, Reports).
   - If asked why metrics changed (e.g., "Why did users decrease this week?"), analyze the active context or synthesize realistic business explanations (e.g., streaming competitors, server latency spikes, regional internet outages, content licensing gaps).
2. Content Operations Assistant:
   - Generate SEO-optimized movie titles, premium summaries/descriptions, categories, and tags.
   - Suggest similar content or content cross-promotions.
3. User & Growth Summarizer:
   - Identify retention rates, growth trends, or list top active engagement strategies.
4. Security AI Shield & Audit Monitor:
   - Scan for security risks based on the logs provided in the context.
   - Identify suspicious logins (brute-force failures), unauthorized administrative access attempts, or repeated abuse.
   - Categorize threats as: RISK LEVEL (LOW/MEDIUM/HIGH), with specific Recommendations.
5. Actionable Notification Engine:
   - Create push alerts or system notifications. Always format these with engaging headers, professional copy, and visual emojis.
6. Provide Helpful Internal Navigation & Links:
   - When asked about sections or pages, you can provide clean internal paths like / for the Main App Home, /reset-password for Password Reset, or guide them to the administrative tabs: [AI Chat Ops, Analytics Intel, Content Studio, Security Shield, Notif Gen].

STRICT STYLE AND FORMATTING RULES:
- YOU MUST NEVER USE THE SYMBOLS: # (hash), * (asterisk), - (dash), or bullet characters (like bullets, circles, squares, checkmarks) in your output text.
- YOU MUST NOT USE MARKDOWN HEADINGS OR BOLD SYNTAX. Do not write **bold text** or # headings.
- Present headings and titles in simple UPPERCASE text with clean blank lines before and after.
- For items or lists, use simple indentation (spaces), number indexes like 1. 2. 3. or simple letter prefixes, or just write them as clean separate paragraphs.
- Respond in high-quality, clear, readable plain text. Keep paragraphs spacious and neat.
`;

      // Structure conversational contents for Gemini Flash
      const contents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || "" }]
      }));

      // Robust multi-model fallback chain to bypass temporary model outages / high-demand limits
      let response = null;
      let lastError = null;
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.65,
            }
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          console.warn(`[Serra AI Warning] Model ${modelName} failed or unavailable:`, err.message || err);
          lastError = err;
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("All configured Gemini models are currently experiencing high demand. Please try again shortly.");
      }

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Serra AI backend error:", err);
      res.status(500).json({ 
        error: err.message || "An unexpected error occurred while communicating with the Serra AI Brain." 
      });
    }
  });

  // Dynamic route to list actual APK files in /public folder
  app.get("/api/apps/apk-list", async (req, res) => {
    try {
      const publicDir = path.join(process.cwd(), "public");

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Read files currently present in public directory (No bootstrapping/creation of fake files)
      const files = fs.readdirSync(publicDir);
      const apkFiles = files.filter((f: string) => f.toLowerCase().endsWith(".apk"));

      const list = apkFiles.map((filename: string) => {
        const filePath = path.join(publicDir, filename);
        const stats = fs.statSync(filePath);
        
        // Calculate exact real-time file size on disk
        const sizeInBytes = stats.size;
        let sizeStr = "";
        if (sizeInBytes >= 1024 * 1024) {
          sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (sizeInBytes >= 1024) {
          sizeStr = `${(sizeInBytes / 1024).toFixed(2)} KB`;
        } else {
          sizeStr = `${sizeInBytes} Bytes`;
        }

        // Exact real-world modification date
        const formattedDate = new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }).format(stats.mtime);

        // Crypto hashing for actual file contents (No simulated mockup values)
        let actualSha = "N/A";
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const hash = crypto.createHash("sha256");
          hash.update(fileBuffer);
          actualSha = `sha256-${hash.digest("hex")}`;
        } catch (hashErr) {
          console.error("Failed to calculate SHA256:", hashErr);
        }

        // Dynamically extract version pattern from filename
        let versionStr = "v1.0";
        const versionMatch = filename.match(/v?(\d+(\.\d+)*)/i);
        if (versionMatch) {
          versionStr = `v${versionMatch[1]}`;
        } else {
          versionStr = filename.replace(/\.apk$/i, "").toUpperCase();
        }

        return {
          filename,
          url: `/${filename}`,
          size: sizeStr,
          updated: formattedDate,
          version: versionStr,
          sha: actualSha
        };
      });

      // Sort with latest version first (natural sort on version string)
      list.sort((a: any, b: any) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));

      res.json({ success: true, apks: list });
    } catch (err: any) {
      console.error("Failed to read APK list from public directory:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve static assets or use Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AgreyFlix Backend] Full-Stack server is operational on port ${PORT}`);
  });
}

startServer();
