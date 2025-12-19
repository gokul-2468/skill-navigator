import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: "primary" | "success" | "warning" | "info" | "destructive";
  className?: string;
}

const colorClasses = {
  primary: "from-primary/20 to-primary/5 border-primary/20",
  success: "from-success/20 to-success/5 border-success/20",
  warning: "from-warning/20 to-warning/5 border-warning/20",
  info: "from-info/20 to-info/5 border-info/20",
  destructive: "from-destructive/20 to-destructive/5 border-destructive/20",
};

const iconColorClasses = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-info-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

export const StatsCard = ({
  title,
  value,
  icon,
  trend,
  color = "primary",
  className,
}: StatsCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6",
        "bg-gradient-to-br",
        colorClasses[color],
        "hover:shadow-medium transition-all duration-300 hover:-translate-y-1",
        "animate-fade-in-up",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            iconColorClasses[color]
          )}
        >
          {icon}
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br from-current/10 to-transparent" />
    </div>
  );
};