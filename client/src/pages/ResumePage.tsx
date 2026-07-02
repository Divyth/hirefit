import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SectionTitle } from '../components/SectionTitle';
import { deleteResume, fetchResumes, uploadResume } from '../services/resumeService';
import type { Resume } from '../types';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';

type FormValues = { resume: FileList; replaceId?: string };

export function ResumePage() {
  const { pushToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReplaceId, setActiveReplaceId] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormValues>();
  const fileName = watch('resume')?.[0]?.name ?? '';

  const load = async () => {
    setLoading(true);
    try {
      const { resumes: items } = await fetchResumes();
      setResumes(items);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Failed to load resumes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: FormValues) => {
    const file = values.resume?.[0];
    if (!file) {
      pushToast('Choose a PDF resume', 'error');
      return;
    }
    try {
      await uploadResume(file, activeReplaceId);
      pushToast(activeReplaceId ? 'Resume replaced' : 'Resume uploaded', 'success');
      reset();
      setActiveReplaceId(null);
      await load();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Upload failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResume(id);
      pushToast('Resume deleted', 'success');
      await load();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Delete failed', 'error');
    }
  };

  return (
    <div>
      <SectionTitle title="Resume Management" subtitle="Upload PDF resumes and keep parsed text for matching and interview generation." />
      <Card className="mb-6">
        <form className="grid gap-4 lg:grid-cols-[1fr_auto]" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">PDF Resume</label>
            <Input type="file" accept="application/pdf" {...register('resume', { required: true })} />
            {fileName ? <p className="mt-2 text-xs text-slate-500">{fileName}</p> : null}
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {activeReplaceId ? 'Replace Resume' : 'Upload Resume'}
            </Button>
            {activeReplaceId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setActiveReplaceId(null);
                  reset();
                }}
              >
                Cancel Replace
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : resumes.length ? (
          resumes.map((resume) => (
            <Card key={resume._id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{resume.originalName}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Skills: {resume.extractedSkills.slice(0, 8).join(', ') || 'None detected'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Education: {resume.education?.summary || 'Not detected'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setActiveReplaceId(resume._id)}>Replace</Button>
                  <Button variant="ghost" onClick={() => handleDelete(resume._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No resumes uploaded yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
