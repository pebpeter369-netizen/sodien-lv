/**
 * Robustly extract and parse article JSON from Gemini's response.
 * Handles: markdown code fences, text before/after JSON, unescaped quotes in HTML.
 */
export function parseArticleJson(text: string): {
  title: string;
  meta_description: string;
  excerpt: string;
  content: string;
  topic: string;
  suggested_slug: string;
  sources?: string[];
} {
  let jsonText = text.trim();

  // Remove markdown code fences
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
  }

  // Find the JSON object boundaries
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in response");
  }

  jsonText = jsonText.substring(firstBrace, lastBrace + 1);

  // Try parsing directly first
  try {
    return JSON.parse(jsonText);
  } catch {
    // Attempt to fix common issues
  }

  // Fix: unescaped newlines inside string values
  jsonText = jsonText.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n");

  // Fix: unescaped quotes inside HTML content strings
  // This is a heuristic — replace quotes inside HTML tags that break JSON
  jsonText = jsonText.replace(
    /"content"\s*:\s*"([\s\S]*?)"\s*,\s*"topic"/,
    (match, content) => {
      // Escape internal double quotes that aren't already escaped
      const fixed = content
        .replace(/\\"/g, "__ESCAPED_QUOTE__")
        .replace(/"/g, '\\"')
        .replace(/__ESCAPED_QUOTE__/g, '\\"');
      return `"content": "${fixed}", "topic"`;
    }
  );

  try {
    return JSON.parse(jsonText);
  } catch {
    // Last resort: try to extract field by field
  }

  // Field-by-field extraction as last resort
  const extractField = (field: string): string => {
    const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
    const match = jsonText.match(regex);
    return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : "";
  };

  const result = {
    title: extractField("title"),
    meta_description: extractField("meta_description"),
    excerpt: extractField("excerpt"),
    content: extractField("content"),
    topic: extractField("topic"),
    suggested_slug: extractField("suggested_slug"),
  };

  if (!result.title || !result.content) {
    throw new Error("Could not extract required fields from response");
  }

  return result;
}
