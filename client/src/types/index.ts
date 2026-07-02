export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export type Resume = {
  _id: string;
  originalName: string;
  extractedSkills: string[];
  extractedTechnologies: string[];
  experience?: { terms: string[]; years: number; summary: string };
  education?: { terms: string[]; summary: string };
  createdAt: string;
  updatedAt: string;
};

export type JobDescription = {
  _id: string;
  title: string;
  company?: string;
  location?: string;
  description: string;
  parsedSkills: string[];
  parsedTechnologies: string[];
  createdAt: string;
  updatedAt: string;
};

export type MatchAnalysis = {
  _id: string;
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  explanation: string;
};

export type InterviewQuestions = {
  _id: string;
  technicalQuestions: string[];
  behaviouralQuestions: string[];
  projectDeepDiveQuestions: string[];
};
