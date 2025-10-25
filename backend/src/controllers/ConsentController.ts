import { Request, Response } from 'express';
import { ConsentService } from '@/services/ConsentService';
import { RoleService } from '@/services/RoleService';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';
import { ConsentType, LegalBasis } from '@/types/auth';
import { USER_ROLES } from '@/constants/roles';

export class ConsentController {
  /**
   * Record user consent
   */
  static async recordConsent(req: Request, res: Response): Promise<void> {
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
        consentType,
        granted,
        purpose,
        dataTypes,
        retentionPeriod,
        legalBasis = 'consent',
        jurisdiction = 'US'
      } = req.body;

      // Users can only manage their own consent, unless they're admins
      const targetUserId = userId || currentUser.id;
      
      if (targetUserId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot manage consent for other users',
          },
        });
        return;
      }

      const consentRecord = await ConsentService.recordConsent(
        targetUserId,
        consentType as ConsentType,
        granted,
        purpose,
        dataTypes,
        retentionPeriod,
        legalBasis as LegalBasis,
        jurisdiction
      );

      res.status(201).json({
        success: true,
        data: { consent: consentRecord },
        message: `Consent ${granted ? 'granted' : 'revoked'} successfully`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Record consent error:', error);
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
   * Get user's consent records
   */
  static async getUserConsents(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { userId } = req.params;

      // Users can only view their own consent, unless they're admins or ethics officers
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ETHICS_OFFICER])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot view consent records for other users',
          },
        });
        return;
      }

      const consents = await ConsentService.getUserConsents(userId);

      res.status(200).json({
        success: true,
        data: { consents },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get user consents error:', error);
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
   * Check if user has specific consent
   */
  static async checkConsent(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { userId, consentType } = req.params;

      // Users can check their own consent, recruiters/hiring managers can check candidate consent
      if (userId !== currentUser.id && !RoleService.canAccessUser(currentUser, userId)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot check consent for this user',
          },
        });
        return;
      }

      const hasConsent = await ConsentService.hasConsent(userId, consentType as ConsentType);

      res.status(200).json({
        success: true,
        data: {
          userId,
          consentType,
          hasConsent,
          checkedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Check consent error:', error);
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
   * Revoke user consent
   */
  static async revokeConsent(req: Request, res: Response): Promise<void> {
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
      const { userId, consentType } = req.params;
      const { reason } = req.body;

      // Users can only revoke their own consent, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot revoke consent for other users',
          },
        });
        return;
      }

      await ConsentService.revokeConsent(userId, consentType as ConsentType, reason);

      res.status(200).json({
        success: true,
        message: 'Consent revoked successfully',
        data: {
          userId,
          consentType,
          revokedAt: new Date().toISOString(),
          reason,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Revoke consent error:', error);
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
   * Update consent terms
   */
  static async updateConsent(req: Request, res: Response): Promise<void> {
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
      const { userId, consentType } = req.params;
      const { purpose, dataTypes, retentionPeriod } = req.body;

      // Users can only update their own consent, unless they're admins
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot update consent for other users',
          },
        });
        return;
      }

      const updatedConsent = await ConsentService.updateConsent(
        userId,
        consentType as ConsentType,
        { purpose, dataTypes, retentionPeriod }
      );

      res.status(200).json({
        success: true,
        data: { consent: updatedConsent },
        message: 'Consent updated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Update consent error:', error);
      
      if (error instanceof Error && error.message.includes('No existing consent')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CONSENT_NOT_FOUND',
            message: 'No existing consent found to update',
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
   * Validate consent for data processing
   */
  static async validateConsent(req: Request, res: Response): Promise<void> {
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
      const { userId, requiredConsents, processingPurpose } = req.body;

      // Only authorized roles can validate consent for processing
      if (!RoleService.hasAnyRole(currentUser, [USER_ROLES.RECRUITER, USER_ROLES.HIRING_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to validate consent',
          },
        });
        return;
      }

      const validation = await ConsentService.validateConsentForProcessing(
        userId,
        requiredConsents,
        processingPurpose
      );

      res.status(200).json({
        success: true,
        data: {
          userId,
          processingPurpose,
          validation,
          validatedBy: currentUser.id,
          validatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Validate consent error:', error);
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
   * Get expiring consents (admin/ethics officer only)
   */
  static async getExpiringConsents(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;

      // Only admins and ethics officers can view expiring consents
      if (!RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ETHICS_OFFICER])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to view expiring consents',
          },
        });
        return;
      }

      const daysAhead = parseInt(req.query.days as string) || 30;
      const expiringConsents = await ConsentService.getExpiringConsents(daysAhead);

      res.status(200).json({
        success: true,
        data: {
          expiringConsents,
          daysAhead,
          count: expiringConsents.length,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get expiring consents error:', error);
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
   * Generate consent report (ethics officer/admin only)
   */
  static async generateConsentReport(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;

      // Only ethics officers and admins can generate consent reports
      if (!RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ETHICS_OFFICER])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to generate consent reports',
          },
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const consentType = req.query.consentType as ConsentType | undefined;

      const report = await ConsentService.generateConsentReport(startDate, endDate, consentType);

      res.status(200).json({
        success: true,
        data: {
          report,
          period: { startDate, endDate },
          consentType,
          generatedBy: currentUser.id,
          generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Generate consent report error:', error);
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
   * Get consent types and their descriptions
   */
  static async getConsentTypes(req: Request, res: Response): Promise<void> {
    try {
      const consentTypes = [
        {
          type: 'data_processing',
          displayName: 'Data Processing',
          description: 'Consent to process personal data for recruitment purposes',
          required: true,
        },
        {
          type: 'ai_analysis',
          displayName: 'AI Analysis',
          description: 'Consent to use AI for resume analysis and candidate matching',
          required: true,
        },
        {
          type: 'profile_sharing',
          displayName: 'Profile Sharing',
          description: 'Consent to share profile with potential employers',
          required: false,
        },
        {
          type: 'marketing',
          displayName: 'Marketing Communications',
          description: 'Consent to receive marketing communications',
          required: false,
        },
        {
          type: 'analytics',
          displayName: 'Analytics',
          description: 'Consent to use data for analytics and platform improvement',
          required: false,
        },
        {
          type: 'third_party_sharing',
          displayName: 'Third Party Sharing',
          description: 'Consent to share data with third-party services',
          required: false,
        },
      ];

      res.status(200).json({
        success: true,
        data: { consentTypes },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get consent types error:', error);
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