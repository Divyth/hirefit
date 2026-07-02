import request from 'supertest';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { setDatabase } from '../src/database/client.js';
import { createMockDb } from './helpers/mockDb.js';

function seedResume(db, userId) {
  return db.stores.resumes.push({
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    originalName: 'resume.pdf',
    parsedText: 'React Node.js MongoDB Bachelor of Science 3 years experience',
    extractedSkills: ['react', 'node.js', 'mongodb'],
    extractedTechnologies: ['react', 'node.js', 'mongodb'],
    experience: { terms: ['developer'], years: 3, summary: 'developer' },
    education: { terms: ['bachelor', 'computer science'], summary: 'bachelor' },
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

function seedJob(db, userId) {
  return db.stores.jobdescriptions.push({
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    title: 'Full Stack Engineer',
    description: 'React Node.js MongoDB TypeScript SQL',
    parsedSkills: ['react', 'node.js', 'mongodb', 'typescript', 'sql'],
    parsedTechnologies: ['react', 'node.js', 'mongodb', 'typescript', 'sql'],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

describe('HireFit API', () => {
  let app;
  let db;

  beforeEach(() => {
    db = createMockDb();
    setDatabase(db);
    app = createApp();
  });

  test('registers a user and returns a JWT', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student', email: 'student@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('student@example.com');
  });

  test('creates and lists jobs for the authenticated user', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student', email: 'student@example.com', password: 'password123' });
    const token = register.body.token;

    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Backend Engineer',
        company: 'Acme',
        location: 'Remote',
        description: 'Build APIs with Node.js, Express, and MongoDB.'
      })
      .expect(201);

    const list = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.jobs).toHaveLength(1);
    expect(list.body.jobs[0].title).toBe('Backend Engineer');
  });

  test('generates match analysis and interview questions', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student', email: 'student@example.com', password: 'password123' });
    const token = register.body.token;
    const userId = register.body.user.id;
    seedResume(db, userId);
    seedJob(db, userId);
    const resume = db.stores.resumes[0];
    const job = db.stores.jobdescriptions[0];

    const match = await request(app)
      .post('/api/ai/match')
      .set('Authorization', `Bearer ${token}`)
      .send({ resumeId: String(resume._id), jobId: String(job._id) })
      .expect(200);

    expect(match.body.analysis.overallScore).toBeGreaterThan(0);
    expect(match.body.analysis.matchedSkills.length).toBeGreaterThan(0);

    const questions = await request(app)
      .post('/api/ai/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ resumeId: String(resume._id), jobId: String(job._id) })
      .expect(200);

    expect(questions.body.questions.technicalQuestions).toHaveLength(10);
    expect(questions.body.questions.behaviouralQuestions).toHaveLength(5);
    expect(questions.body.questions.projectDeepDiveQuestions).toHaveLength(5);
  });

  test('enhances a resume bullet', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student', email: 'student@example.com', password: 'password123' });
    const token = register.body.token;

    const response = await request(app)
      .post('/api/ai/enhance')
      .set('Authorization', `Bearer ${token}`)
      .send({ bullet: 'Built a project tracker with React and Node.js for student applications' })
      .expect(200);

    expect(response.body.enhancedBullet).toBeTruthy();
    expect(response.body.enhancedBullet.split(' ').length).toBeLessThanOrEqual(30);
  });

  test('generates role-specific interview questions for a genai job description', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student', email: 'student@example.com', password: 'password123' });
    const token = register.body.token;
    const userId = register.body.user.id;

    db.stores.resumes.push({
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      originalName: 'resume.pdf',
      parsedText: 'Built Python and Node.js services with Docker and Kubernetes. Worked on vector databases and RAG.',
      extractedSkills: ['python', 'node.js', 'docker', 'kubernetes'],
      extractedTechnologies: ['python', 'node.js', 'docker', 'kubernetes'],
      experience: { terms: ['engineer'], years: 3, summary: 'engineer' },
      education: { terms: ['bachelor'], summary: 'bachelor' },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    db.stores.jobdescriptions.push({
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      title: 'Software Engineering III',
      description: 'Build autonomous systems, agent orchestration, guardrails, RAG, tool calling, distributed data flows, Python, FastAPI, Docker and Kubernetes.',
      parsedSkills: ['python', 'fastapi', 'docker', 'kubernetes', 'rag', 'tool calling'],
      parsedTechnologies: ['python', 'fastapi', 'docker', 'kubernetes', 'rag', 'tool calling'],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const resume = db.stores.resumes[0];
    const job = db.stores.jobdescriptions[0];

    const response = await request(app)
      .post('/api/ai/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ resumeId: String(resume._id), jobId: String(job._id) })
      .expect(200);

    expect(response.body.questions.technicalQuestions[0].toLowerCase()).toContain('agent');
    expect(response.body.questions.technicalQuestions.join(' ').toLowerCase()).toContain('rag');
    expect(response.body.questions.technicalQuestions.join(' ').toLowerCase()).toContain('guardrails');
    expect(response.body.questions.behaviouralQuestions.length).toBe(5);
    expect(response.body.questions.projectDeepDiveQuestions.length).toBe(5);
  });
});
