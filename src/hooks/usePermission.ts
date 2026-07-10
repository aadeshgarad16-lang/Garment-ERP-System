import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

export function usePermission(moduleName: string) {
  const { hasWriteAccess } = useAuth();
  
  const canWrite = useMemo(() => hasWriteAccess(moduleName), [hasWriteAccess, moduleName]);
  const isReadOnly = !canWrite;

  return { canWrite, isReadOnly };
}
