import { Activity, User, Settings } from 'lucide-react';

interface Props {
  currentView?: string;
}

export function Navbar(_props: Props) {
  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-primary tracking-tight">
            Dialysis Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <User className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
