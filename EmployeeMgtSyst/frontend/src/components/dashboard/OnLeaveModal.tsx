import { X, CalendarDays, User } from "lucide-react";

interface OnLeaveEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}

interface OnLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: OnLeaveEmployee[];
}

export function OnLeaveModal({ isOpen, onClose, employees }: OnLeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>On Leave Today</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {employees.length} employee{employees.length !== 1 ? 's' : ''} out of office
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={20} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {employees.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
              Nobody is on leave today.
            </div>
          ) : (
            employees.map((emp, i) => (
              <div 
                key={`${emp._id}-${i}`}
                className="flex flex-col p-4 rounded-xl border"
                style={{ 
                  borderColor: "var(--border)",
                  background: "color-mix(in srgb, var(--card) 50%, transparent)"
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <User size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {emp.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold capitalize px-2 py-1 rounded-md" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
                    {emp.leaveType}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  <CalendarDays size={14} />
                  <span>
                    {new Date(emp.startDate).toLocaleDateString()} - {new Date(emp.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
