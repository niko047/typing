import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system:
        "You are a helpful writing assistant. Complete the text with 1-2 sentences that naturally continue the user's writing. Be concise and match their writing style.",
      prompt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI completion API error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
