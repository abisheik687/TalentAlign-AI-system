import axios, { AxiosResponse } from 'axios';
import { User, AuthTokens, LoginRequest, LoginResponse } from '@/types/auth';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'talentalign_tokens';
  private readonly REFRESH_TOKEN_KEY = 'talentalign_refresh_token';

  constructor() {
    // Set up axios interceptors
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        const tokens = this.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = this.getStoredTokens();
            if (tokens?.refreshToken) {
              const newTokens = await this.refreshToken(tokens.refreshToken);
              this.setTokens(newTokens);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await axios.post(
        `${API_BASE_URL}/auth/login`,
        credentials
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Login failed');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  async register(data: RegisterRequest): Promise<User> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await axios.post(
        `${API_BASE_URL}/auth/register`,
        data
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Registration failed');
      }

      return response.data.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response: AxiosResponse<ApiResponse<{ tokens: AuthTokens }>> = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Token refresh failed');
      }

      return response.data.data.tokens;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Token refresh failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      // Ignore logout errors, we'll clear tokens anyway
      console.error('Logout error:', error);
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await axios.get(
        `${API_BASE_URL}/auth/profile`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get profile');
      }

      return response.data.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to get profile');
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        data
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Profile update failed');
      }

      return response.data.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Profile update failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        { currentPassword, newPassword }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Password change failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Password change failed');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.post(
        `${API_BASE_URL}/auth/reset-password`,
        { email }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Password reset failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Password reset failed');
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.post(
        `${API_BASE_URL}/auth/confirm-reset`,
        { token, newPassword }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Password reset confirmation failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Password reset confirmation failed');
    }
  }

  // Token management
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
  }

  getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      return null;
    }
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If we can't parse the token, consider it expired
    }
  }

  shouldRefreshToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh if token expires in less than 5 minutes
      return timeUntilExpiry < 300;
    } catch (error) {
      return true;
    }
  }

  getTokenPayload(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }

  hasPermission(permission: string): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    try {
      const payload = this.getTokenPayload(tokens.accessToken);
      // This would need to be implemented based on how permissions are stored in the token
      // For now, we'll return true for authenticated users
      return !!payload;
    } catch (error) {
      return false;
    }
  }

  hasRole(role: string): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    try {
      const payload = this.getTokenPayload(tokens.accessToken);
      return payload?.role === role;
    } catch (error) {
      return false;
    }
  }

  hasAnyRole(roles: string[]): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    try {
      const payload = this.getTokenPayload(tokens.accessToken);
      return roles.includes(payload?.role);
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();