import React from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}

export function PermissionGuard({ 
  module, 
  children, 
  fallback, 
  hideIfNoAccess = false 
}: PermissionGuardProps) {
  const { canWrite } = usePermission(module);

  if (canWrite) {
    return <>{children}</>;
  }

  if (hideIfNoAccess) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // By default, render the children wrapped in a disabled state
  return (
    <div className="relative group inline-block cursor-not-allowed">
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 z-10" title="You have View Only access"></div>
    </div>
  );
}
