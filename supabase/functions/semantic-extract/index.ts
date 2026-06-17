import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

const SYSTEM_PROMPT = `
You are an expert semantic extraction agent for Forge OS.
Your task is to extract actionable commitments and actions ONLY from the provided note.

Constraint Rules:
1. Extract ONLY explicit commitments and actions.
2. NEVER infer emotions, personality, intent, purchase probability, conversion likelihood, beliefs, or health status.
3. If the meaning is ambiguous, prefer "Unknown" over speculative inference.
4. Every extracted candidate MUST include an exact 'evidence_span' from the note.

Output format: Return ONLY valid JSON.
{
  "candidates": [
    {
      "type": "string",
      "owner": "advisor|prospect|unknown",
      "action": "string",
      "due": "string|null",
      "quality": "strong|medium|weak",
      "confidence": 0.0,
      "evidence_span": "string",
      "source": "semantic_extractor",
      "model_version": "gemini-1.5-pro-latest",
      "generated_at": "ISO-8601-TIMESTAMP",
      "review_status": "proposed",
      "unknowns": ["string"]
    }
  ],
  "unknowns": ["string"],
  "requiresHumanReview": true
}
`;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { note } = await req.json();

    if (!note) {
      return new Response("Missing note in request body", { status: 400 });
    }

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nNote to analyze: "${note}"` }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(JSON.stringify({ error: "Failed to extract candidates" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
