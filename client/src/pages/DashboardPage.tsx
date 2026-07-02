import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';

const cards = [
  { to: '/resume', title: 'Resume Management', desc: 'Upload, view, replace, and remove PDF resumes.' },
  { to: '/jobs', title: 'Job Descriptions', desc: 'Save multiple job descriptions for comparison and interview prep.' },
  { to: '/match', title: 'Resume Match', desc: 'Calculate fit, strengths, gaps, and suggestions.' },
  { to: '/questions', title: 'Interview Questions', desc: 'Generate technical, behavioural, and project questions.' },
  { to: '/enhancer', title: 'Bullet Enhancer', desc: 'Rewrite one resume bullet with Gemini guidance.' },
  { to: '/profile', title: 'Profile', desc: 'Review account details and session status.' }
];

export function DashboardPage() {
  return (
    <div>
      <SectionTitle
        title="Dashboard"
        subtitle="Central workspace for resumes, job descriptions, matching, and interview prep."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
              <h3 className="text-lg font-bold text-slate-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
