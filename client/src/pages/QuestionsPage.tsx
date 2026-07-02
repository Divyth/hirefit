import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { fetchJobs } from '../services/jobService';
import { fetchResumes } from '../services/resumeService';
import { generateQuestions } from '../services/aiService';
import type { JobDescription, InterviewQuestions, Resume } from '../types';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';

type FormValues = { resumeId: string; jobId: string };

export function QuestionsPage() {
  const { pushToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [resumeData, jobData] = await Promise.all([fetchResumes(), fetchJobs()]);
        setResumes(resumeData.resumes);
        setJobs(jobData.jobs);
      } catch (error) {
        pushToast(error instanceof Error ? error.message : 'Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const { questions: result } = await generateQuestions(values);
      setQuestions(result);
      pushToast('Interview questions generated', 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Generation failed', 'error');
    }
  };

  return (
    <div>
      <SectionTitle title="Interview Questions" subtitle="Generate role-specific technical, behavioural, and project deep dive questions." />
      <Card className="mb-6">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Resume</label>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('resumeId', { required: true })}>
                <option value="">Select resume</option>
                {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.originalName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Job Description</label>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('jobId', { required: true })}>
                <option value="">Select job</option>
                {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>Generate</Button>
            </div>
          </form>
        )}
      </Card>

      {questions ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <h3 className="font-bold text-slate-950">Technical Questions</h3>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              {questions.technicalQuestions.map((item, index) => <li key={item}><span className="font-semibold text-slate-900">{index + 1}.</span> {item}</li>)}
            </ol>
          </Card>
          <Card>
            <h3 className="font-bold text-slate-950">Behavioural Questions</h3>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              {questions.behaviouralQuestions.map((item, index) => <li key={item}><span className="font-semibold text-slate-900">{index + 1}.</span> {item}</li>)}
            </ol>
          </Card>
          <Card>
            <h3 className="font-bold text-slate-950">Project Deep Dive Questions</h3>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              {questions.projectDeepDiveQuestions.map((item, index) => <li key={item}><span className="font-semibold text-slate-900">{index + 1}.</span> {item}</li>)}
            </ol>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
