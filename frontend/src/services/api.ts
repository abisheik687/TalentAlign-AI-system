import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
          
          // Update tokens
          accessToken = newAccessToken;
          refreshToken = newRefreshToken;
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'recruiter' | 'hiring_manager' | 'admin';
  lastLogin?: Date;
  createdAt: Date;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Authentication API
export const authApi = {
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await apiClient.post('/auth/register', userData);
    
    // Store tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data!.tokens;
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data.data!;
  },

  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await apiClient.post('/auth/login', credentials);
    
    // Store tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data!.tokens;
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear tokens regardless of API response
      accessToken = null;
      refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  getProfile: async (): Promise<{ user: User; profile?: any }> => {
    const response: AxiosResponse<ApiResponse<{ user: User; profile?: any }>> = await apiClient.get('/auth/profile');
    return response.data.data!;
  },

  updateProfile: async (profileData: { firstName: string; lastName: string }): Promise<{ user: User }> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await apiClient.put('/auth/profile', profileData);
    return response.data.data!;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    await apiClient.put('/auth/change-password', passwordData);
  }
};

// Job Postings API
export const jobsApi = {
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    department?: string;
    workType?: string;
    status?: string;
  }) => {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },

  getJob: async (jobId: string) => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (jobData: any) => {
    const response = await apiClient.post('/jobs', jobData);
    return response.data;
  },

  updateJob: async (jobId: string, jobData: any) => {
    const response = await apiClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId: string) => {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  },

  analyzeBias: async (jobId: string) => {
    const response = await apiClient.post(`/jobs/${jobId}/analyze-bias`);
    return response.data;
  }
};

// Applications API
export const applicationsApi = {
  getApplications: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: string;
  }) => {
    const response = await apiClient.get('/applications', { params });
    return response.data;
  },

  getApplication: async (applicationId: string) => {
    const response = await apiClient.get(`/applications/${applicationId}`);
    return response.data;
  },

  createApplication: async (applicationData: {
    jobId: string;
    candidateId?: string;
  }) => {
    const response = await apiClient.post('/applications', applicationData);
    return response.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string, notes?: string) => {
    const response = await apiClient.put(`/applications/${applicationId}/status`, { status, notes });
    return response.data;
  },

  getMatchScore: async (applicationId: string) => {
    const response = await apiClient.get(`/applications/${applicationId}/match-score`);
    return response.data;
  },

  getExplanation: async (applicationId: string) => {
    const response = await apiClient.get(`/applications/${applicationId}/explanation`);
    return response.data;
  }
};

// Candidate Profiles API
export const candidatesApi = {
  getCandidates: async (params?: {
    page?: number;
    limit?: number;
    skills?: string[];
    experience?: number;
  }) => {
    const response = await apiClient.get('/candidates', { params });
    return response.data;
  },

  getCandidate: async (candidateId: string) => {
    const response = await apiClient.get(`/candidates/${candidateId}`);
    return response.data;
  },

  updateCandidate: async (candidateId: string, candidateData: any) => {
    const response = await apiClient.put(`/candidates/${candidateId}`, candidateData);
    return response.data;
  },

  uploadResume: async (candidateId: string, file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await apiClient.post(`/candidates/${candidateId}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyzeResume: async (candidateId: string) => {
    const response = await apiClient.post(`/candidates/${candidateId}/analyze-resume`);
    return response.data;
  }
};

// Bias Monitoring API
export const biasMonitoringApi = {
  getDashboard: async (timeRange?: string) => {
    const response = await apiClient.get('/bias/dashboard', {
      params: { timeRange }
    });
    return response.data;
  },

  getAlerts: async (params?: {
    status?: string;
    severity?: string;
    limit?: number;
  }) => {
    const response = await apiClient.get('/bias/alerts', { params });
    return response.data;
  },

  getMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }) => {
    const response = await apiClient.get('/bias/metrics', { params });
    return response.data;
  },

  exportData: async (format: 'json' | 'csv' | 'pdf', timeRange?: string, includeDetails?: boolean) => {
    const response = await apiClient.get('/bias/export', {
      params: { format, timeRange, includeDetails },
      responseType: 'blob'
    });
    return response.data;
  }
};

// Performance Metrics API
export const metricsApi = {
  getPerformanceMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }) => {
    const response = await apiClient.get('/metrics/performance', { params });
    return response.data;
  },

  getTimeToHire: async (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }) => {
    const response = await apiClient.get('/metrics/time-to-hire', { params });
    return response.data;
  },

  getSatisfactionMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }) => {
    const response = await apiClient.get('/metrics/satisfaction', { params });
    return response.data;
  },

  getDiversityMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }) => {
    const response = await apiClient.get('/metrics/diversity', { params });
    return response.data;
  },

  exportMetrics: async (format: 'json' | 'csv' | 'pdf', params?: any) => {
    const response = await apiClient.get('/metrics/export', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  }
};

// Assessments API
export const assessmentsApi = {
  getAssessments: async () => {
    const response = await apiClient.get('/assessments');
    return response.data;
  },

  getAssessment: async (assessmentId: string) => {
    const response = await apiClient.get(`/assessments/${assessmentId}`);
    return response.data;
  },

  createAssessment: async (assessmentData: any) => {
    const response = await apiClient.post('/assessments', assessmentData);
    return response.data;
  },

  submitAssessment: async (assessmentId: string, responses: any[]) => {
    const response = await apiClient.post(`/assessments/${assessmentId}/submit`, { responses });
    return response.data;
  },

  getResults: async (assessmentId: string) => {
    const response = await apiClient.get(`/assessments/${assessmentId}/results`);
    return response.data;
  }
};

// Utility functions
export const apiUtils = {
  isAuthenticated: (): boolean => {
    return !!accessToken;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      if (!accessToken) return null;
      const { user } = await authApi.getProfile();
      return user;
    } catch (error) {
      return null;
    }
  },

  handleApiError: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.errors?.length > 0) {
      return error.response.data.errors[0].message || error.response.data.errors[0];
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
};

export default apiClient;