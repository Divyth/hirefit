import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type FormValues = { name: string; email: string; password: string };

export function RegisterPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { pushToast } = useToast();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      const session = await registerUser(values);
      setSession(session);
      pushToast('Account created', 'success');
      navigate('/dashboard');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Registration failed', 'error');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Register</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
            <Input {...register('name', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <Input type="email" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <Input type="password" {...register('password', { required: true, minLength: 8 })} />
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already registered? <Link className="font-semibold text-slate-900 underline" to="/login">Login</Link>
        </p>
      </Card>
    </div>
  );
}
