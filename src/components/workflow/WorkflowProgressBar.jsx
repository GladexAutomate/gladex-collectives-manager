// @ts-nocheck
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckSquare, ChevronRight, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const PHASES = [
  { number: 1, name: 'Prep', color: 'bg-amber-500' },
  { number: 2, name: 'Launch', color: 'bg-sky-500' },
  { number: 3, name: 'Sales', color: 'bg-emerald-500' },
  { number: 4, name: 'Docs', color: 'bg-purple-500' },
  { number: 5, name: 'Pre-Dep', color: 'bg-orange-500' },
  { number: 6, name: 'Income', color: 'bg-rose-500' },
  { number: 7, name: 'Eval', color: 'bg-teal-500' },
];

export default function WorkflowProgressBar({ collectiveId, collectiveName, compact = false }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectiveId) { setLoading(false); return; }
    const fetchTasks = () =>
      base44.entities.ChecklistTask.filter({ collective_id: collectiveId })
        .then(t => { setTasks(t); setLoading(false); })
        .catch(() => setLoading(false));
    fetchTasks();
    window.addEventListener('gladex:refresh', fetchTasks);
    return () => window.removeEventListener('gladex:refresh', fetchTasks);
  }, [collectiveId]);

  if (loading) return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading workflow...</div>;
  if (tasks.length === 0) return null;

  const totalPct = Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Progress value={totalPct} className="h-1.5 flex-1" />
        <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">{totalPct}%</span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-semibold font-jakarta text-foreground">Workflow Progress</p>
            {collectiveName && <p className="text-xs text-muted-foreground">{collectiveName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-jakarta text-primary">{totalPct}%</span>
          <Link to={`/workflow?collective=${collectiveId}`} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
            View <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <Progress value={totalPct} className="h-2 mb-3" />
      <div className="flex gap-1">
        {PHASES.map(phase => {
          const phaseTasks = tasks.filter(t => t.phase_number === phase.number);
          const phasePct = phaseTasks.length > 0
            ? Math.round((phaseTasks.filter(t => t.status === 'completed').length / phaseTasks.length) * 100)
            : 0;
          const complete = phasePct === 100;
          return (
            <div key={phase.number} className="flex-1 text-center">
              <div className={cn("h-1.5 rounded-full mb-1", complete ? phase.color : "bg-muted")} />
              <span className={cn("text-[9px] font-medium", complete ? "text-foreground" : "text-muted-foreground")}>{phase.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}