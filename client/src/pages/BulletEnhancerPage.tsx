import { useForm } from 'react-hook-form';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { Textarea } from '../components/Textarea';
import { enhanceBullet } from '../services/aiService';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';

type FormValues = { bullet: string };

export function BulletEnhancerPage() {
  const { pushToast } = useToast();
  const [result, setResult] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await enhanceBullet(values);
      setResult(response.enhancedBullet);
      pushToast('Bullet enhanced', 'success');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Enhancement failed', 'error');
    }
  };

  return (
    <div>
      <SectionTitle title="Bullet Enhancer" subtitle="Rewrite one resume bullet using Gemini while keeping claims truthful and concise." />
      <Card>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Resume Bullet</label>
            <Textarea placeholder="Example: Built a dashboard for tracking job applications..." {...register('bullet', { required: true })} />
          </div>
          <Button type="submit" disabled={isSubmitting}>Enhance Bullet</Button>
        </form>
      </Card>
      {result ? (
        <Card className="mt-4">
          <h3 className="font-bold text-slate-950">Enhanced Bullet</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{result}</p>
        </Card>
      ) : null}
    </div>
  );
}
