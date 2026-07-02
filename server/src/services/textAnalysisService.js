import { normalizeText, uniqueValues } from '../utils/string.js';
import { EDUCATION_TERMS, EXPERIENCE_TERMS, SKILLS } from '../utils/skills.js';

class TextAnalysisService {
  extractTerms(text, sourceTerms) {
    const normalized = normalizeText(text);
    return uniqueValues(sourceTerms.filter((term) => normalized.includes(term)));
  }

  extractSkills(text) {
    return this.extractTerms(text, SKILLS);
  }

  extractExperience(text) {
    const normalized = normalizeText(text);
    const terms = this.extractTerms(text, EXPERIENCE_TERMS);
    const yearMatch = normalized.match(/(\d{1,2})(?:\+)?\s+years?/);
    const years = yearMatch ? Number(yearMatch[1]) : 0;
    return {
      terms,
      years,
      summary: terms.length ? terms.join(', ') : 'No clear experience markers detected'
    };
  }

  extractEducation(text) {
    const terms = this.extractTerms(text, EDUCATION_TERMS);
    return {
      terms,
      summary: terms.length ? terms.join(', ') : 'No clear education markers detected'
    };
  }

  parseResume(text) {
    return {
      skills: this.extractSkills(text),
      technologies: this.extractSkills(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text)
    };
  }

  parseJobDescription(text) {
    return {
      skills: this.extractSkills(text),
      technologies: this.extractSkills(text)
    };
  }
}

export const textAnalysisService = new TextAnalysisService();
