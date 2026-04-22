import React from 'react';
import { useAuth } from '../../auth/useAuth';

interface PermissionGateProps {
  permission?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const profile = useAuth((s) => s.profile);
  
  if (!profile) return <>{fallback}</>;
  
  // Super admin bypass
  if (profile.role === 'super_admin') return <>{children}</>;
  
  // Check permission
  if (permission && !profile.permissions.includes(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default PermissionGate;
