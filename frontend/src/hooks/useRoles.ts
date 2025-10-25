import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { roleService } from '@/services/roleService';

interface Role {
  key: string;
  value: string;
  displayName: string;
  permissions: string[];
}

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
  checkPermission: (permission: string) => boolean;
  checkRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshRoles: () => Promise<void>;
}

export const useRoles = (): UseRolesReturn => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRoles = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRoles = await roleService.getRoles();
      setRoles(fetchedRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRoles();
    }
  }, [user]);

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return roleService.hasPermission(permission);
  };

  const checkRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (rolesToCheck: string[]): boolean => {
    if (!user) return false;
    return rolesToCheck.includes(user.role);
  };

  const refreshRoles = async (): Promise<void> => {
    await fetchRoles();
  };

  return {
    roles,
    loading,
    error,
    checkPermission,
    checkRole,
    hasAnyRole,
    refreshRoles,
  };
};