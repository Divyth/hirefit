import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
            Job application assistant
          </div>
          <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
            Organize resumes, match jobs, and prepare interviews in one workflow.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            HireFit helps software engineering students manage resumes, track job descriptions, compare fit, and generate interview prep quickly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">Login</Button>
            </Link>
          </div>
        </div>

        <Card className="border-slate-200/70">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="text-sm text-slate-300">Resume Match</div>
              <div className="mt-2 text-4xl font-black">84/100</div>
              <p className="mt-2 text-sm text-slate-300">Clear skill overlap with React, Node.js, and MongoDB.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Questions</div>
                <div className="mt-2 text-lg font-bold text-slate-950">20 generated</div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Bullet enhancer</div>
                <div className="mt-2 text-lg font-bold text-slate-950">Truthful rewrites</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
