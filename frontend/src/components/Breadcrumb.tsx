import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-primary hover:underline font-medium"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-muted-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
