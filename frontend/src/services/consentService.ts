import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ConsentType {
  type: string;
  displayName: string;
  description: string;
  required: boolean;
}

interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  version: string;
  purpose: string;
  dataTypes: string[];
  retentionPeriod: number;
  legalBasis: string;
  jurisdiction: string;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface RecordConsentRequest {
  userId?: string;
  consentType: string;
  granted: boolean;
  purpose: string;
  dataTypes: string[];
  retentionPeriod: number;
  legalBasis?: string;
  jurisdiction?: string;
}

interface ConsentValidation {
  userId: string;
  processingPurpose: string;
  validation: {
    valid: boolean;
    missingConsents: string[];
  };
  validatedBy: string;
  validatedAt: string;
}

class ConsentService {
  async getConsentTypes(): Promise<ConsentType[]> {
    try {
      const response: AxiosResponse<ApiResponse<{ consentTypes: ConsentType[] }>> = await axios.get(
        `${API_BASE_URL}/consent/types`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get consent types');
      }

      return response.data.data.consentTypes;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to get consent types');
    }
  }

  async recordConsent(request: RecordConsentRequest): Promise<ConsentRecord> {
    try {
      const response: AxiosResponse<ApiResponse<{ consent: ConsentRecord }>> = await axios.post(
        `${API_BASE_URL}/consent`,
        request
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to record consent');
      }

      return response.data.data.consent;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to record consent');
    }
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const response: AxiosResponse<ApiResponse<{ consents: ConsentRecord[] }>> = await axios.get(
        `${API_BASE_URL}/consent/users/${userId}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get user consents');
      }

      return response.data.data.consents;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to get user consents');
    }
  }

  async checkConsent(userId: string, consentType: string): Promise<boolean> {
    try {
      const response: AxiosResponse<ApiResponse<{
        userId: string;
        consentType: string;
        hasConsent: boolean;
        checkedAt: string;
      }>> = await axios.get(
        `${API_BASE_URL}/consent/users/${userId}/${consentType}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to check consent');
      }

      return response.data.data.hasConsent;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to check consent');
    }
  }

  async revokeConsent(userId: string, consentType: string, reason?: string): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${API_BASE_URL}/consent/users/${userId}/${consentType}`,
        { data: { reason } }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to revoke consent');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to revoke consent');
    }
  }

  async updateConsent(
    userId: string,
    consentType: string,
    updates: {
      purpose?: string;
      dataTypes?: string[];
      retentionPeriod?: number;
    }
  ): Promise<ConsentRecord> {
    try {
      const response: AxiosResponse<ApiResponse<{ consent: ConsentRecord }>> = await axios.put(
        `${API_BASE_URL}/consent/users/${userId}/${consentType}`,
        updates
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to update consent');
      }

      return response.data.data.consent;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to update consent');
    }
  }

  async validateConsent(
    userId: string,
    requiredConsents: string[],
    processingPurpose: string
  ): Promise<ConsentValidation> {
    try {
      const response: AxiosResponse<ApiResponse<ConsentValidation>> = await axios.post(
        `${API_BASE_URL}/consent/validate`,
        {
          userId,
          requiredConsents,
          processingPurpose,
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to validate consent');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to validate consent');
    }
  }

  async getExpiringConsents(days: number = 30): Promise<ConsentRecord[]> {
    try {
      const response: AxiosResponse<ApiResponse<{
        expiringConsents: ConsentRecord[];
        daysAhead: number;
        count: number;
      }>> = await axios.get(
        `${API_BASE_URL}/consent/expiring?days=${days}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get expiring consents');
      }

      return response.data.data.expiringConsents;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to get expiring consents');
    }
  }

  async generateConsentReport(
    startDate?: Date,
    endDate?: Date,
    consentType?: string
  ): Promise<{
    report: {
      totalRecords: number;
      grantedCount: number;
      revokedCount: number;
      expiredCount: number;
      byType: Record<string, number>;
    };
    period: { startDate: Date; endDate: Date };
    consentType?: string;
    generatedBy: string;
    generatedAt: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (consentType) params.append('consentType', consentType);

      const response: AxiosResponse<ApiResponse<any>> = await axios.get(
        `${API_BASE_URL}/consent/report?${params.toString()}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to generate consent report');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to generate consent report');
    }
  }
}

export const consentService = new ConsentService();