import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '@/types/api';
import { authService } from '@/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Role {
  key: string;
  value: string;
  displayName: string;
  permissions: string[];
}

interface RolePermissions {
  role: string;
  permissions: string[];
  displayName: string;
}

interface PermissionCheck {
  permission: string;
  granted: boolean;
}

interface UserPermissions {
  userId: string;
  role: string;
  effectivePermissions: string[];
  roleHierarchy: string[];
  canDelegate: boolean;
}

class RoleService {
  async getRoles(): Promise<Role[]> {
    try {
      const response: AxiosResponse<ApiResponse<{ roles: Role[] }>> = await axios.get(
        `${API_BASE_URL}/roles`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get roles');
      }

      return response.data.data.roles;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to get roles');
    }
  }

  async getRolePermissions(role: string): Promise<RolePermissions> {
    try {
      const response: AxiosResponse<ApiResponse<RolePermissions>> = await axios.get(
        `${API_BASE_URL}/roles/${role}/permissions`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get role permissions');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to get role permissions');
    }
  }

  async assignRole(userId: string, role: string): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.post(
        `${API_BASE_URL}/roles/assign`,
        { userId, role }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to assign role');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to assign role');
    }
  }

  async checkPermissions(permissions: string[]): Promise<PermissionCheck[]> {
    try {
      const response: AxiosResponse<ApiResponse<{ requestedPermissions: PermissionCheck[] }>> = await axios.post(
        `${API_BASE_URL}/roles/check-permissions`,
        { permissions }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to check permissions');
      }

      return response.data.data.requestedPermissions;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to check permissions');
    }
  }

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      const response: AxiosResponse<ApiResponse<UserPermissions>> = await axios.get(
        `${API_BASE_URL}/roles/users/${userId}/permissions`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get user permissions');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to get user permissions');
    }
  }

  async validateBulkOperation(operation: string, resourceCount: number): Promise<boolean> {
    try {
      const response: AxiosResponse<ApiResponse<{ allowed: boolean }>> = await axios.post(
        `${API_BASE_URL}/roles/validate-bulk-operation`,
        { operation, resourceCount }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to validate bulk operation');
      }

      return response.data.data.allowed;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to validate bulk operation');
    }
  }

  // Client-side permission checking using stored token
  hasPermission(permission: string): boolean {
    return authService.hasPermission(permission);
  }

  hasRole(role: string): boolean {
    return authService.hasRole(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return authService.hasAnyRole(roles);
  }
}

export const roleService = new RoleService();