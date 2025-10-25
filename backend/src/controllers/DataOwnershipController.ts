import { Request, Response } from 'express';
import { DataOwnershipService } from '@/services/DataOwnershipService';
import { RoleService } from '@/services/RoleService';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';
import { USER_ROLES } from '@/constants/roles';

export class DataOwnershipController {
  /**
   * Submit data ownership request (GDPR Articles 15-21)
   */
  static async submitOwnershipRequest(req: Request, res: Response): Promise<void> {
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
      const { userId, requestType, dataTypes, reason, urgency } = req.body;

      // Users can only submit requests for themselves, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot submit ownership request for other users',
          },
        });
        return;
      }

      const response = await DataOwnershipService.processDataOwnershipRequest({
        userId,
        requestType,
        dataTypes,
        reason,
        urgency: urgency || 'medium',
      });

      res.status(201).json({
        success: true,
        data: response,
        message: 'Data ownership request submitted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Submit ownership request error:', error);
      
      if (error instanceof Error && error.message.includes('Invalid request')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
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
   * Get user's data inventory
   */
  static async getDataInventory(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { userId } = req.params;

      // Users can only view their own inventory, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot view data inventory for other users',
          },
        });
        return;
      }

      const inventory = await DataOwnershipService.getUserDataInventory(userId);

      res.status(200).json({
        success: true,
        data: inventory,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get data inventory error:', error);
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
   * Get data lineage for specific data item
   */
  static async getDataLineage(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { dataId } = req.params;
      const { userId } = req.query;

      // Verify user can access this data lineage
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot view data lineage for other users',
          },
        });
        return;
      }

      const lineage = await DataOwnershipService.getDataLineage(dataId, userId as string);

      res.status(200).json({
        success: true,
        data: lineage,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get data lineage error:', error);
      
      if (error instanceof Error && error.message.includes('does not own')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'DATA_ACCESS_DENIED',
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
   * Schedule automatic data deletion
   */
  static async scheduleAutomaticDeletion(req: Request, res: Response): Promise<void> {
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
      const { dataTypes, deletionDate, reason } = req.body;

      // Users can only schedule deletion for themselves, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot schedule deletion for other users',
          },
        });
        return;
      }

      const result = await DataOwnershipService.scheduleAutomaticDeletion(
        userId,
        dataTypes,
        new Date(deletionDate),
        reason
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Automatic deletion scheduled successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Schedule automatic deletion error:', error);
      
      if (error instanceof Error && error.message.includes('Cannot schedule')) {
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
   * Manage data sharing permissions
   */
  static async manageDataSharing(req: Request, res: Response): Promise<void> {
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
      const { recipientId, dataTypes, purpose, duration, restrictions } = req.body;

      // Users can only manage sharing for themselves, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot manage data sharing for other users',
          },
        });
        return;
      }

      const result = await DataOwnershipService.manageDataSharing(
        userId,
        recipientId,
        dataTypes,
        purpose,
        duration,
        restrictions
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Data sharing permissions updated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Manage data sharing error:', error);
      
      if (error instanceof Error && error.message.includes('not allowed')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SHARING_NOT_ALLOWED',
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
   * Revoke data sharing permissions
   */
  static async revokeDataSharing(req: Request, res: Response): Promise<void> {
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
      const { userId, sharingId } = req.params;
      const { reason } = req.body;

      // Users can only revoke their own sharing, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot revoke data sharing for other users',
          },
        });
        return;
      }

      await DataOwnershipService.revokeDataSharing(userId, sharingId, reason);

      res.status(200).json({
        success: true,
        message: 'Data sharing permissions revoked successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Revoke data sharing error:', error);
      
      if (error instanceof Error && (
        error.message.includes('not found') || 
        error.message.includes('does not own')
      )) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SHARING_NOT_FOUND',
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
   * Get data sharing history
   */
  static async getDataSharingHistory(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { userId } = req.params;

      // Users can only view their own sharing history, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot view data sharing history for other users',
          },
        });
        return;
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : undefined;
      
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : undefined;

      const history = await DataOwnershipService.getDataSharingHistory(
        userId,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        data: {
          history,
          period: { startDate, endDate },
          userId,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get data sharing history error:', error);
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
   * Generate comprehensive data ownership report
   */
  static async generateOwnershipReport(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { userId } = req.params;

      // Users can only generate reports for themselves, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot generate ownership report for other users',
          },
        });
        return;
      }

      const report = await DataOwnershipService.generateOwnershipReport(userId);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Data ownership report generated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Generate ownership report error:', error);
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
   * Get available data ownership request types
   */
  static async getRequestTypes(req: Request, res: Response): Promise<void> {
    try {
      const requestTypes = [
        {
          type: 'access_request',
          name: 'Right of Access',
          description: 'Request access to all personal data we hold about you',
          gdprArticle: 'Article 15',
          estimatedTime: '30 days',
        },
        {
          type: 'portability_request',
          name: 'Right to Data Portability',
          description: 'Request your data in a machine-readable format',
          gdprArticle: 'Article 20',
          estimatedTime: '30 days',
        },
        {
          type: 'rectification_request',
          name: 'Right to Rectification',
          description: 'Request correction of inaccurate personal data',
          gdprArticle: 'Article 16',
          estimatedTime: '30 days',
        },
        {
          type: 'erasure_request',
          name: 'Right to Erasure',
          description: 'Request deletion of your personal data',
          gdprArticle: 'Article 17',
          estimatedTime: '30 days',
        },
        {
          type: 'restriction_request',
          name: 'Right to Restriction',
          description: 'Request restriction of processing of your data',
          gdprArticle: 'Article 18',
          estimatedTime: '30 days',
        },
        {
          type: 'objection_request',
          name: 'Right to Object',
          description: 'Object to processing of your personal data',
          gdprArticle: 'Article 21',
          estimatedTime: '30 days',
        },
      ];

      res.status(200).json({
        success: true,
        data: { requestTypes },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get request types error:', error);
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
   * Get data categories that can be managed
   */
  static async getDataCategories(req: Request, res: Response): Promise<void> {
    try {
      const dataCategories = [
        {
          category: 'profile_data',
          name: 'Profile Data',
          description: 'Basic profile information like name, email, phone',
          canDelete: true,
          canExport: true,
          canRestrict: true,
        },
        {
          category: 'application_data',
          name: 'Application Data',
          description: 'Job applications, resumes, and related documents',
          canDelete: true,
          canExport: true,
          canRestrict: true,
        },
        {
          category: 'interview_data',
          name: 'Interview Data',
          description: 'Interview schedules, feedback, and recordings',
          canDelete: true,
          canExport: true,
          canRestrict: true,
        },
        {
          category: 'analytics_data',
          name: 'Analytics Data',
          description: 'Usage analytics and behavioral data',
          canDelete: true,
          canExport: false,
          canRestrict: true,
        },
        {
          category: 'communication_data',
          name: 'Communication Data',
          description: 'Email communications and message history',
          canDelete: false, // May be required for legal reasons
          canExport: true,
          canRestrict: true,
        },
      ];

      res.status(200).json({
        success: true,
        data: { dataCategories },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get data categories error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }
}