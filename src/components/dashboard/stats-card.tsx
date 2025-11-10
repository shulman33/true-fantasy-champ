import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    border: 'border-retro-green',
    badge: 'bg-retro-green/20 text-retro-green border-retro-green',
    glow: '',
  },
  success: {
    border: 'border-green-500',
    badge: 'bg-green-500/20 text-green-500 border-green-500',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
  },
  warning: {
    border: 'border-retro-yellow',
    badge: 'bg-retro-yellow/20 text-retro-yellow border-retro-yellow',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
  },
  destructive: {
    border: 'border-retro-red',
    badge: 'bg-retro-red/20 text-retro-red border-retro-red',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  description,
  variant = 'default',
  icon,
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-4',
        styles.border,
        styles.glow,
        'bg-black/80 backdrop-blur-sm',
        'transition-all duration-200 hover:scale-[1.02]',
        className
      )}
    >
      {/* Retro scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,currentColor_2px,currentColor_4px)]" />
      </div>

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-press-start uppercase tracking-wider text-gray-300">
            {title}
          </CardTitle>
          {icon && (
            <div className={cn('text-xl', styles.badge.split(' ')[1])}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-3xl font-press-start font-bold',
                styles.badge.split(' ')[1]
              )}
            >
              {value}
            </span>
            {subtitle && (
              <Badge
                variant="outline"
                className={cn(
                  'font-press-start text-[10px] px-2 py-0.5',
                  styles.badge
                )}
              >
                {subtitle}
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-xs text-gray-400 font-mono leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </CardContent>

      {/* Decorative corner pixels */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-white/20" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-white/20" />
    </Card>
  );
}
