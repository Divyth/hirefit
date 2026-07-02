import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <div>
      <SectionTitle title="Profile" subtitle="Your current authenticated account details." />
      <Card className="max-w-xl">
        <dl className="grid gap-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-500">Name</dt>
            <dd className="mt-1 text-slate-950">{user?.name}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-950">{user?.email}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
