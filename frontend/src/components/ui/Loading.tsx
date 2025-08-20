import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text, 
  className,
  fullScreen = false 
}) => {
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center',
      fullScreen ? 'min-h-screen' : 'py-8',
      className
    )}>
      <Loader2 className={cn(
        'animate-spin text-green-600',
        sizeClasses[size]
      )} />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Spinner component for inline loading
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => (
  <Loader2 className={cn(
    'animate-spin',
    sizeClasses[size],
    className
  )} />
);

// Loading overlay for specific components
export const LoadingOverlay: React.FC<{ isLoading: boolean; children: React.ReactNode }> = ({ 
  isLoading, 
  children 
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    )}
  </div>
);