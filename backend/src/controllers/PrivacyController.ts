import { Request, Response } from 'express';
import { PrivacyService } from '@/services/PrivacyService';
import { AnonymizationService } from '@/services/AnonymizationService';
import { RoleService } from '@/services/RoleService';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';
import { USER_ROLES } from '@/constants/roles';

export class PrivacyController {
  /**
   * Process data with privacy controls
   */
  static async processData(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const currentUser = req.user!;
      const {
        userId,
        dataType,
        processingPurpose,
        requiredConsents,
        data,
        retentionPeriod
      } = req.body;

      // Check if user can process data for the target user
      if (userId !== currentUser.id && !RoleService.canAccessUser(currentUser, userId)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot process data for this user',
          },
        });
        return;
      }

      const result = await PrivacyService.processDataWithPrivacyControls({
        userId,
        dataType,
        processingPurpose,
        requiredConsents,
        data,
        retentionPeriod,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: result.allowed ? 'Data processed successfully' : 'Data processing not allowed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Process data error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Anonymize data
   */
  static async anonymizeData(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const currentUser = req.user!;
      const { text, options } = req.body;

      // Check if user has permission to anonymize data
      if (!RoleService.hasAnyRole(currentUser, [
        USER_ROLES.RECRUITER,
        USER_ROLES.HIRING_MANAGER,
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to anonymize data',
          },
        });
        return;
      }

      const result = await AnonymizationService.detectAndAnonymizePII(text, options);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Data anonymized successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Anonymize data error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Validate anonymization
   */
  static async validateAnonymization(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const currentUser = req.user!;
      const { originalText, anonymizedText } = req.body;

      // Only ethics officers and admins can validate anonymization
      if (!RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to validate anonymization',
          },
        });
        return;
      }

      const validation = await AnonymizationService.validateAnonymization(
        originalText,
        anonymizedText
      );

      res.status(200).json({
        success: true,
        data: validation,
        message: 'Anonymization validated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Validate anonymization error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Export user data (GDPR Article 20)
   */
  static async exportUserData(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const currentUser = req.user!;
      const { userId } = req.params;
      const { format, includeAnonymized, dataTypes } = req.body;

      // Users can export their own data, admins can export any user's data
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot export data for other users',
          },
        });
        return;
      }

      const exportResult = await PrivacyService.exportUserData({
        userId,
        format: format || 'json',
        includeAnonymized: includeAnonymized || false,
        dataTypes,
      });

      res.status(200).json({
        success: true,
        data: exportResult,
        message: 'Data export completed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Export user data error:', error);
      
      if (error instanceof Error && error.message.includes('consent')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CONSENT_REQUIRED',
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Delete user data (GDPR Article 17)
   */
  static async deleteUserData(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const currentUser = req.user!;
      const { userId } = req.params;
      const { dataTypes, reason, immediate } = req.body;

      // Users can delete their own data, admins can delete any user's data
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot delete data for other users',
          },
        });
        return;
      }

      const deletionResult = await PrivacyService.deleteUserData({
        userId,
        dataTypes,
        reason: reason || 'User requested deletion',
        immediate: immediate || false,
      });

      res.status(200).json({
        success: true,
        data: deletionResult,
        message: 'Data deletion completed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Delete user data error:', error);
      
      if (error instanceof Error && error.message.includes('not allowed')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DELETION_NOT_ALLOWED',
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Generate privacy compliance report
   */
  static async generatePrivacyReport(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;

      // Only ethics officers and admins can generate privacy reports
      if (!RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to generate privacy reports',
          },
        });
        return;
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date();
      
      const userId = req.query.userId as string | undefined;

      const report = await PrivacyService.generatePrivacyReport(startDate, endDate, userId);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Privacy report generated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Generate privacy report error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Get anonymization report
   */
  static async getAnonymizationReport(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { reportId } = req.params;

      // Only authorized users can view anonymization reports
      if (!RoleService.hasAnyRole(currentUser, [
        USER_ROLES.RECRUITER,
        USER_ROLES.HIRING_MANAGER,
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to view anonymization reports',
          },
        });
        return;
      }

      // Get report from cache
      const CacheService = require('@/config/redis').CacheService;
      const reportData = await CacheService.get(`anonymization_report:${reportId}`);
      
      if (!reportData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Anonymization report not found or expired',
          },
        });
        return;
      }

      const report = JSON.parse(reportData);

      res.status(200).json({
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get anonymization report error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Download exported data
   */
  static async downloadExportedData(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { exportId } = req.params;

      // Get export data from cache
      const CacheService = require('@/config/redis').CacheService;
      const exportData = await CacheService.get(`data_export:${exportId}`);
      
      if (!exportData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EXPORT_NOT_FOUND',
            message: 'Data export not found or expired',
          },
        });
        return;
      }

      const exportInfo = JSON.parse(exportData);

      // Check if user can access this export
      if (exportInfo.userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot access this data export',
          },
        });
        return;
      }

      // Set appropriate headers for download
      const filename = `user_data_${exportInfo.userId}_${exportId}.${exportInfo.format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', this.getContentType(exportInfo.format));

      res.status(200).send(exportInfo.data);
    } catch (error) {
      logger.error('Download exported data error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Get privacy activity log
   */
  static async getPrivacyActivityLog(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { userId } = req.params;

      // Users can view their own activity, admins and ethics officers can view any user's activity
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot view privacy activity for other users',
          },
        });
        return;
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date();

      // This would query the privacy activity log
      // For now, return a placeholder response
      const activities = []; // await PrivacyService.getPrivacyActivities(startDate, endDate, userId);

      res.status(200).json({
        success: true,
        data: {
          activities,
          period: { startDate, endDate },
          userId,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get privacy activity log error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  // Helper method
  private static getContentType(format: string): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'xml':
        return 'application/xml';
      default:
        return 'application/octet-stream';
    }
  }
}