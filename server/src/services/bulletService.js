import { geminiService } from './geminiService.js';
import { incrementMetric } from '../utils/metrics.js';

class BulletService {
  async enhance(bullet) {
    try {
      const prompt = `Rewrite this resume bullet.\n\nRequirements:\n- Maximum 30 words.\n- Use a strong action verb.\n- Mention technologies if already present.\n- Keep everything truthful.\n- Do not invent achievements or numbers.\n- Avoid repeating the original wording.\n- Return only the rewritten bullet.\n\nOriginal bullet:\n${bullet}`;
      const text = await geminiService.generateText({ prompt });
      const cleaned = this.cleanOutput(text);
      if (!cleaned || this.isTooSimilar(cleaned, bullet)) {
        incrementMetric('fallbackCount');
        return this.fallbackEnhancement(bullet);
      }
      return cleaned;
    } catch {
      incrementMetric('fallbackCount');
      return this.fallbackEnhancement(bullet);
    }
  }

  cleanOutput(text = '') {
    return text
      .replace(/^[-•]\s*/, '')
      .replace(/^improved\s+/i, '')
      .replace(/^enhanced\s+/i, '')
      .replace(/^rewrote\s+/i, '')
      .replace(/^rewritten\s+/i, '')
      .trim();
  }

  isTooSimilar(candidate, original) {
    const normalize = (value) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const a = normalize(candidate);
    const b = normalize(original);
    if (!a || !b) return true;
    if (a === b) return true;
    if (a.startsWith(b.slice(0, Math.max(20, Math.floor(b.length * 0.35))))) return true;
    return false;
  }

  fallbackEnhancement(bullet) {
    const text = bullet.trim().replace(/\s+/g, ' ');
    const techHints = [];
    for (const term of ['Angular', 'TypeScript', 'Django REST Framework', 'PostgreSQL', 'React', 'Node.js', 'MongoDB', 'SQL']) {
      if (new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)) {
        techHints.push(term);
      }
    }

    const verb = /^(delivered|built|implemented|designed|developed|created|optimized|led|shipped|reduced|improved)/i.test(text)
      ? ''
      : 'Delivered ';

    const transformed = `${verb}${text}`
      .replace(/\breducing\b/i, 'while reducing')
      .replace(/\bwith\b/i, 'using')
      .replace(/\bmodule\b/i, 'feature')
      .replace(/\bworkflow\b/i, 'workflow');

    const techSuffix = techHints.length ? ` using ${techHints.join(', ')}` : '';
    const result = `${transformed}${techSuffix}`.replace(/\s+/g, ' ').trim();
    return result.split(' ').slice(0, 30).join(' ');
  }
}

export const bulletService = new BulletService();
