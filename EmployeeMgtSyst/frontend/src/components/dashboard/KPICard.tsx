import type { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  colorTheme?: "primary" | "accent" | "orange" | "destructive";
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  colorTheme = "primary",
}: KPICardProps) {
  // Map our themes to the CSS variables
  const getThemeColor = () => {
    switch (colorTheme) {
      case "primary": return "var(--primary)";
      case "accent": return "var(--accent)";
      case "orange": return "var(--orange)";
      case "destructive": return "var(--destructive)";
      default: return "var(--primary)";
    }
  };

  const color = getThemeColor();

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl">
      {/* Background glow based on theme */}
      <div 
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300"
        style={{ background: color }}
      />

      <div className="flex justify-between items-start mb-4 z-10">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {title}
        </h3>
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300"
          style={{ 
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            color: color
          }}
        >
          {icon}
        </div>
      </div>

      <div className="z-10">
        <p className="text-4xl font-bold tracking-tight mb-1" style={{ color: "var(--foreground)" }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
