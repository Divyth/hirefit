import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SectionTitle } from '../components/SectionTitle';
import { Textarea } from '../components/Textarea';
import { createJob, deleteJob, fetchJobs, updateJob } from '../services/jobService';
import type { JobDescription } from '../types';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';

type FormValues = {
  title: string;
  company?: string;
  location?: string;
  description: string;
};

export function JobsPage() {
  const { pushToast } = useToast();
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<JobDescription | null>(null);
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<FormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const { jobs: items } = await fetchJobs();
      setJobs(items);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (editing) {
      setValue('title', editing.title);
      setValue('company', editing.company || '');
      setValue('location', editing.location || '');
      setValue('description', editing.description);
    } else {
      reset({ title: '', company: '', location: '', description: '' });
    }
  }, [editing, reset, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await updateJob(editing._id, values);
        pushToast('Job updated', 'success');
      } else {
        await createJob(values);
        pushToast('Job saved', 'success');
      }
      setEditing(null);
      reset();
      await load();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Save failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJob(id);
      pushToast('Job deleted', 'success');
      await load();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Delete failed', 'error');
    }
  };

  return (
    <div>
      <SectionTitle title="Job Descriptions" subtitle="Create, edit, delete, and store multiple job descriptions for matching and prep." />
      <Card className="mb-6">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
              <Input {...register('title', { required: true })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Company</label>
              <Input {...register('company')} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
            <Input {...register('location')} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <Textarea {...register('description', { required: true })} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>{editing ? 'Update Job' : 'Save Job'}</Button>
            {editing ? <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel Edit</Button> : null}
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : jobs.length ? (
          jobs.map((job) => (
            <Card key={job._id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{job.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{job.company} {job.location ? `• ${job.location}` : ''}</p>
                  <p className="mt-3 max-h-28 overflow-hidden text-sm leading-6 text-slate-600">{job.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setEditing(job)}>Edit</Button>
                  <Button variant="ghost" onClick={() => handleDelete(job._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No job descriptions saved yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
