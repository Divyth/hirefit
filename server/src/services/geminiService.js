import { env } from '../config/env.js';

class GeminiService {
  stripCodeFences(text) {
    return text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }

  async generateJson({ systemInstruction, prompt, schemaDescription }) {
    if (!env.geminiApiKey || process.env.NODE_ENV === 'test') {
      return null;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${prompt}\n\nReturn JSON only. ${schemaDescription}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${body}`);
    }

    const data = await response.json();
    const text = this.stripCodeFences(data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const jsonText = jsonStart >= 0 && jsonEnd >= jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text;
    return JSON.parse(jsonText);
  }

  async generateText({ prompt }) {
    if (!env.geminiApiKey || process.env.NODE_ENV === 'test') {
      return '';
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 }
        })
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${body}`);
    }

    const data = await response.json();
    const text = this.stripCodeFences(data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    return text.split('\n').map((line) => line.trim()).filter(Boolean)[0] || '';
  }
}

export const geminiService = new GeminiService();
