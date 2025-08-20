import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        primary: 'bg-green-100 text-green-800 hover:bg-green-200',
        secondary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        success: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        danger: 'bg-red-100 text-red-800 hover:bg-red-200',
        info: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
        outline: 'border border-gray-200 text-gray-600 hover:bg-gray-50'
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// Predefined status badges
export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ 
  status, 
  className 
}) => {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'disponible':
      case 'completado':
        return 'success';
      case 'pending':
      case 'pendiente':
      case 'en proceso':
        return 'warning';
      case 'inactive':
      case 'inactivo':
      case 'cancelado':
        return 'danger';
      case 'draft':
      case 'borrador':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {status}
    </Badge>
  );
};

// Category badge
export const CategoryBadge: React.FC<{ category: string; className?: string }> = ({ 
  category, 
  className 
}) => (
  <Badge variant="primary" className={className}>
    {category}
  </Badge>
);

// Priority badge
export const PriorityBadge: React.FC<{ priority: 'low' | 'medium' | 'high'; className?: string }> = ({ 
  priority, 
  className 
}) => {
  const getVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  };

  return (
    <Badge variant={getVariant(priority)} className={className}>
      {getLabel(priority)}
    </Badge>
  );
};