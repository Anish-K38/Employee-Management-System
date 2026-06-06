import { Umbrella, HeartPulse, Coffee, Baby } from "lucide-react";
import type { ReactNode } from "react";

interface LeaveBalance {
  remaining: number;
  total: number;
}

interface LeaveBalances {
  annual: LeaveBalance;
  sick: LeaveBalance;
  casual: LeaveBalance;
  maternity: LeaveBalance;
}

interface LeaveBalancesWidgetProps {
  leaveBalances?: LeaveBalances;
}

interface BalanceCardProps {
  label: string;
  balance: LeaveBalance;
  icon: ReactNode;
  color: string;
}

function BalanceCard({ label, balance, icon, color }: BalanceCardProps) {
  const used = balance.total - balance.remaining;
  const pct = balance.total > 0 ? (balance.remaining / balance.total) * 100 : 0;

  // SVG circle progress
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="glass-card rounded-2xl p-5 flex flex-col items-center relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
    >
      {/* Background glow */}
      <div
        className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-15 blur-2xl"
        style={{ background: color }}
      />

      {/* Circular progress */}
      <div className="relative w-[88px] h-[88px] mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
            opacity="0.5"
          />
          {/* Progress arc */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
          />
        </svg>

        {/* Center icon */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color }}
        >
          {icon}
        </div>
      </div>

      {/* Big remaining number */}
      <p
        className="text-3xl font-bold tracking-tight leading-none"
        style={{ color: "var(--foreground)" }}
      >
        {balance.remaining}
      </p>
      <p
        className="text-[11px] font-medium mt-1 uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        days left
      </p>

      {/* Label */}
      <p
        className="text-sm font-semibold mt-3"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>

      {/* Used / Total subtext */}
      <p
        className="text-xs mt-0.5 font-medium"
        style={{ color }}
      >
        {used}/{balance.total} used
      </p>
    </div>
  );
}

export default function LeaveBalancesWidget({ leaveBalances }: LeaveBalancesWidgetProps) {
  if (!leaveBalances) return null;

  const items: { label: string; key: keyof LeaveBalances; icon: ReactNode; color: string }[] = [
    { label: "Annual",    key: "annual",    icon: <Umbrella size={22} />,    color: "var(--primary)" },
    { label: "Sick",      key: "sick",      icon: <HeartPulse size={22} />,  color: "#00cc00" },
    { label: "Casual",    key: "casual",    icon: <Coffee size={22} />,      color: "var(--orange)" },
    { label: "Maternity", key: "maternity", icon: <Baby size={22} />,        color: "#8884d8" },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2
        className="text-base font-semibold mb-5"
        style={{ color: "var(--foreground)" }}
      >
        My Leave Balances
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <BalanceCard
            key={item.key}
            label={item.label}
            balance={leaveBalances[item.key]}
            icon={item.icon}
            color={item.color}
          />
        ))}
      </div>
    </div>
  );
}
