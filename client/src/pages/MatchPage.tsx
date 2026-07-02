import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SectionTitle } from '../components/SectionTitle';
import { matchResume } from '../services/aiService';
import { fetchJobs } from '../services/jobService';
import { fetchResumes } from '../services/resumeService';
import type { JobDescription, MatchAnalysis, Resume } from '../types';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';

type FormValues = { resumeId: string; jobId: string };

export function MatchPage() {
  const { pushToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
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
      const { analysis: result } = await matchResume(values);
      setAnalysis(result);
      pushToast('Match analysis generated', 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Matching failed', 'error');
    }
  };

  return (
    <div>
      <SectionTitle title="Resume Match" subtitle="Compare a resume against a saved job description and calculate fit locally in Node.js." />
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
              <Button type="submit" disabled={isSubmitting}>Analyze</Button>
            </div>
          </form>
        )}
      </Card>

      {analysis ? (
        <div className="grid gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-600">Overall Score</div>
                <div className="text-5xl font-black text-slate-950">{analysis.overallScore}</div>
              </div>
              <div className="max-w-2xl text-sm leading-6 text-slate-600">{analysis.explanation}</div>
            </div>
          </Card>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <h3 className="font-bold text-slate-950">Matched Skills</h3>
              <p className="mt-3 text-sm text-slate-600">{analysis.matchedSkills.join(', ') || 'None'}</p>
            </Card>
            <Card>
              <h3 className="font-bold text-slate-950">Missing Skills</h3>
              <p className="mt-3 text-sm text-slate-600">{analysis.missingSkills.join(', ') || 'None'}</p>
            </Card>
            <Card>
              <h3 className="font-bold text-slate-950">Suggestions</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {analysis.suggestions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Card>
          </div>
          <Card>
            <h3 className="font-bold text-slate-950">Strengths and Weaknesses</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-emerald-700">Strengths</div>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {analysis.strengths.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-rose-700">Weaknesses</div>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {analysis.weaknesses.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
