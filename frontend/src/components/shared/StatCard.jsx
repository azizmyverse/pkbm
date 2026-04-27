import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = {
  indigo: 'from-indigo-500 to-indigo-600',
  violet: 'from-violet-500 to-violet-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  sky: 'from-sky-500 to-sky-600',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = 'indigo',
  trend,
  description,
}) {
  const grad = COLORS[color] || COLORS.indigo;
  const trendUp = typeof trend === 'number' && trend >= 0;
  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div
        className={cn(
          'absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl',
          grad,
        )}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="font-heading text-3xl font-bold tracking-tight">{value}</p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
              grad,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {typeof trend === 'number' ? (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            trendUp
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
          )}
        >
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trendUp ? '+' : ''}
          {trend}%
        </div>
      ) : null}
    </div>
  );
}
