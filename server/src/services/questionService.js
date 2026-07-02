import { ObjectId } from 'mongodb';
import { getDb } from '../database/client.js';
import { COLLECTIONS } from '../database/collections.js';
import { geminiService } from './geminiService.js';
import { HttpError } from '../utils/httpError.js';
import { incrementMetric } from '../utils/metrics.js';

class QuestionService {
  resumeCollection() {
    return getDb().collection(COLLECTIONS.resumes);
  }

  jobCollection() {
    return getDb().collection(COLLECTIONS.jobDescriptions);
  }

  questionCollection() {
    return getDb().collection(COLLECTIONS.interviewQuestions);
  }

  extractFocusAreas(jobText = '') {
    const text = jobText.toLowerCase();
    const candidates = [
      { label: 'agent orchestration', patterns: ['agent orchestration', 'multi-agent', 'agentic workflows', 'agent orchestrations'] },
      { label: 'llm APIs and prompt engineering', patterns: ['llm api', 'prompt engineering', 'chain-of-thought', 'fine-tuning', 'openai', 'anthropic', 'bedrock'] },
      { label: 'memory and RAG', patterns: ['memory', 'vector database', 'pinecone', 'weaviate', 'rag', 'retrieval-augmented generation'] },
      { label: 'tool calling and error handling', patterns: ['tool-calling', 'function calling', 'malformed model outputs', 'external api'] },
      { label: 'distributed data flows', patterns: ['distributed', 'batch', 'real-time', 'data flow', 'scalable', 'reliable data flows'] },
      { label: 'guards and calibration', patterns: ['calibration', 'guardrail', 'accuracy', 'guardrails', 'agent accuracy'] },
      { label: 'production and MLOps', patterns: ['production', 'operationalization', 'mlops', 'containerized', 'docker', 'kubernetes', 'cloud adoption'] },
      { label: 'python backend', patterns: ['python', 'fastapi', 'go', 'node.js', 'node js'] },
      { label: 'cross-functional collaboration', patterns: ['global team', 'india', 'us', 'knowledge-share', 'communication', 'limited or no supervision'] }
    ];

    return candidates
      .filter((item) => item.patterns.some((pattern) => text.includes(pattern)))
      .map((item) => item.label);
  }

  buildQuestionSeed(resume, job) {
    const resumeSkills = [...new Set([...(resume.extractedSkills || []), ...(resume.extractedTechnologies || [])])];
    const jobSkills = [...new Set([...(job.parsedSkills || []), ...(job.parsedTechnologies || [])])];
    const focusAreas = this.extractFocusAreas(job.description);
    const topSkills = [...new Set([...resumeSkills, ...jobSkills])].slice(0, 8);
    return {
      focusAreas,
      topSkills,
      roleLine: job.title || 'the target role'
    };
  }

  async getResume(userId, resumeId) {
    const collection = this.resumeCollection();
    const userObjectId = new ObjectId(userId);
    if (resumeId) {
      const byId = await collection.findOne({ _id: new ObjectId(resumeId), userId: userObjectId });
      if (byId) return byId;
    }
    return collection.find({ userId: userObjectId }).sort({ createdAt: -1 }).toArray().then((items) => items[0] || null);
  }

  async getJob(userId, jobId) {
    const collection = this.jobCollection();
    const userObjectId = new ObjectId(userId);
    if (jobId) {
      const byId = await collection.findOne({ _id: new ObjectId(jobId), userId: userObjectId });
      if (byId) return byId;
    }
    return collection.find({ userId: userObjectId }).sort({ createdAt: -1 }).toArray().then((items) => items[0] || null);
  }

  fallbackQuestions(resume, job) {
    const { focusAreas, topSkills, roleLine } = this.buildQuestionSeed(resume, job);
    const skillHint = topSkills.length ? topSkills.join(', ') : 'the technologies from the resume and job description';
    const focusHint = focusAreas.length ? focusAreas.join(', ') : 'system design, production readiness, and collaboration';
    const normalizedFocusAreas = focusAreas.map((item) => item.toLowerCase());
    const hasAgentFocus = normalizedFocusAreas.some((item) => item.includes('agent orchestration'));
    const hasRagFocus = normalizedFocusAreas.some((item) => item.includes('memory and rag'));
    const hasGuardrailFocus = normalizedFocusAreas.some((item) => item.includes('guards and calibration'));
    return {
      technicalQuestions: [
        hasAgentFocus
          ? 'How would you design an agent orchestration workflow that can reason, call tools, and complete multi-step tasks reliably?'
          : `How have you applied ${skillHint} to solve a problem similar to ${roleLine}?`,
        hasGuardrailFocus
          ? 'How would you build calibration scoring and guardrails so the system can reject low-confidence or unsafe agent output?'
          : `Walk me through how you would design an agent workflow for ${focusHint}.`,
        hasRagFocus
          ? 'How would you implement memory and a RAG pipeline with vector search to keep agent context accurate and retrieval grounded?'
          : 'How would you implement guardrails to keep model outputs accurate and safe?',
        'How do you handle malformed tool outputs or failed function calls in production?',
        'How would you design batch and real-time data flows for an AI agent platform?',
        'How do you evaluate whether a model or prompt change actually improved quality?',
        'How would you deploy and monitor an LLM-backed service with Docker and Kubernetes?',
        'What would you do to make the system resilient when external APIs are slow or unavailable?',
        'How would you coordinate a Python service with a Node.js API gateway in a production system?',
        'What would you use to keep global team handoffs, logs, and observability clear across multiple initiatives?'
      ],
      behaviouralQuestions: [
        'Tell me about a time you had to learn a new framework or API quickly to unblock a project.',
        'Describe a situation where you had to collaborate across distributed teams or time zones.',
        'How do you stay productive when you are working with limited supervision?',
        'Tell me about a time you had to share knowledge with teammates to move a project forward.',
        'How do you explain technical tradeoffs and risk to non-technical stakeholders?'
      ],
      projectDeepDiveQuestions: [
        'What was the hardest technical challenge in your most relevant AI or full-stack project?',
        'Why did you choose that architecture, and what alternatives did you consider?',
        'How did you measure success for the project beyond basic functionality?',
        'What would you change if you rebuilt the project for production today?',
        'How did you manage data flow, retries, and observability across the system?'
      ]
    };
  }

  async generate(userId, resumeId, jobId) {
    const [resume, job] = await Promise.all([this.getResume(userId, resumeId), this.getJob(userId, jobId)]);

    if (!resume || !job) {
      throw new HttpError(404, 'Resume or job description not found');
    }

    const fallback = this.fallbackQuestions(resume, job);
    let normalized = fallback;

    try {
      const seed = this.buildQuestionSeed(resume, job);
      const prompt = `You are a senior software engineering interviewer.

Create interview questions that are specifically tailored to the resume and job description below.

Rules:
- Return JSON only.
- Generate exactly 10 technical questions, 5 behavioural questions, and 5 project deep dive questions.
- Questions must be specific to the role, not generic interview filler.
- Prioritize the job's main themes: ${seed.focusAreas.join(', ') || 'system design, production readiness, and collaboration'}.
- Use the candidate's background and skills where relevant: ${seed.topSkills.join(', ') || 'none detected'}.
- Focus on what this exact role asks for, including practical implementation and decision-making.

Resume:
${resume.parsedText}

Job Description:
${job.description}`;
      const aiResponse = await geminiService.generateJson({
        systemInstruction: 'You are a senior software engineering interviewer.',
        prompt,
        schemaDescription: 'Return JSON with keys technicalQuestions, behaviouralQuestions, and projectDeepDiveQuestions as arrays of strings.'
      });

      const questions = {
        technicalQuestions: Array.isArray(aiResponse?.technicalQuestions) ? aiResponse.technicalQuestions : [],
        behaviouralQuestions: Array.isArray(aiResponse?.behaviouralQuestions) ? aiResponse.behaviouralQuestions : [],
        projectDeepDiveQuestions: Array.isArray(aiResponse?.projectDeepDiveQuestions) ? aiResponse.projectDeepDiveQuestions : []
      };

      if (!questions.technicalQuestions.length || !questions.behaviouralQuestions.length || !questions.projectDeepDiveQuestions.length) {
        incrementMetric('malformedOutputCount');
      }

      normalized = {
        technicalQuestions: this.padQuestions(questions.technicalQuestions, fallback.technicalQuestions, 10),
        behaviouralQuestions: this.padQuestions(questions.behaviouralQuestions, fallback.behaviouralQuestions, 5),
        projectDeepDiveQuestions: this.padQuestions(questions.projectDeepDiveQuestions, fallback.projectDeepDiveQuestions, 5)
      };
    } catch {
      incrementMetric('fallbackCount');
      normalized = fallback;
    }

    const document = {
      userId: new ObjectId(userId),
      resumeId: resume._id,
      jobId: job._id,
      ...normalized,
      createdAt: new Date()
    };
    const result = await this.questionCollection().insertOne(document);
    return this.questionCollection().findOne({ _id: result.insertedId });
  }

  padQuestions(primary, fallback, count) {
    const unique = [];
    for (const question of [...primary, ...fallback]) {
      const normalized = String(question || '').trim();
      if (!normalized) continue;
      if (!unique.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) {
        unique.push(normalized);
      }
      if (unique.length === count) break;
    }
    return unique.slice(0, count);
  }
}

export const questionService = new QuestionService();
