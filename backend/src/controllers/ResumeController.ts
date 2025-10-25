import { Request, Response } from 'express';
import { ResumeAnalysisService } from '@/services/ResumeAnalysisService';
import { RoleService } from '@/services/RoleService';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';
import { USER_ROLES } from '@/constants/roles';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, and DOCX files are allowed.'));
    }
  },
});

export class ResumeController {
  /**
   * Upload and analyze resume
   */
  static uploadMiddleware = upload.single('resume');

  static async analyzeResume(req: Request, res: Response): Promise<void> {
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
      const { candidateId, anonymize } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'Resume file is required',
          },
        });
        return;
      }

      // Check if user can analyze resumes for this candidate
      if (candidateId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.RECRUITER,
        USER_ROLES.HIRING_MANAGER,
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot analyze resume for this candidate',
          },
        });
        return;
      }

      const analysisResult = await ResumeAnalysisService.analyzeResume({
        candidateId: candidateId || currentUser.id,
        resumeFile: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        anonymize: anonymize === 'true' || anonymize === true,
      });

      res.status(200).json({
        success: true,
        data: analysisResult,
        message: 'Resume analyzed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Resume analysis error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('consent')) {
          res.status(400).json({
            success: false,
            error: {
              code: 'CONSENT_REQUIRED',
              message: error.message,
            },
          });
          return;
        }

        if (error.message.includes('Unsupported file type')) {
          res.status(400).json({
            success: false,
            error: {
              code: 'UNSUPPORTED_FILE_TYPE',
              message: error.message,
            },
          });
          return;
        }
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
   * Get resume analysis by ID
   */
  static async getAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { analysisId } = req.params;

      // Get analysis from cache
      const CacheService = require('@/config/redis').CacheService;
      const analysisData = await CacheService.get(`resume_analysis:${analysisId}`);
      
      if (!analysisData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ANALYSIS_NOT_FOUND',
            message: 'Resume analysis not found or expired',
          },
        });
        return;
      }

      const analysis = JSON.parse(analysisData);

      // Check if user can access this analysis
      if (analysis.candidateId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.RECRUITER,
        USER_ROLES.HIRING_MANAGER,
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot access this resume analysis',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get resume analysis error:', error);
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
   * Get candidate's resume analyses
   */
  static async getCandidateAnalyses(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { candidateId } = req.params;

      // Check if user can access analyses for this candidate
      if (candidateId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.RECRUITER,
        USER_ROLES.HIRING_MANAGER,
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot access resume analyses for this candidate',
          },
        });
        return;
      }

      // In a real implementation, you would query a database
      // For now, return a placeholder response
      const analyses = []; // await ResumeAnalysisService.getCandidateAnalyses(candidateId);

      res.status(200).json({
        success: true,
        data: {
          candidateId,
          analyses,
          count: analyses.length,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get candidate analyses error:', error);
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
   * Get skills assessment from analysis
   */
  static async getSkillsAssessment(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { analysisId } = req.params;

      // Get analysis from cache
      const CacheService = require('@/config/redis').CacheService;
      const analysisData = await CacheService.get(`resume_analysis:${analysisId}`);
      
      if (!analysisData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ANALYSIS_NOT_FOUND',
            message: 'Resume analysis not found or expired',
          },
        });
        return;
      }

      const analysis = JSON.parse(analysisData);

      // Check permissions
      if (analysis.candidateId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [
        USER_ROLES.RECRUITER,
        USER_ROLES.HIRING_MANAGER,
        USER_ROLES.ADMIN,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot access this skills assessment',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          candidateId: analysis.candidateId,
          skillsAssessment: analysis.skillsAssessment,
          extractedAt: analysis.createdAt,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get skills assessment error:', error);
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
   * Get bias analysis from resume analysis
   */
  static async getBiasAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { analysisId } = req.params;

      // Only ethics officers and admins can view bias analysis
      if (!RoleService.hasAnyRole(currentUser, [
        USER_ROLES.ADMIN,
        USER_ROLES.ETHICS_OFFICER,
        USER_ROLES.SYSTEM_ADMIN
      ])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to view bias analysis',
          },
        });
        return;
      }

      // Get analysis from cache
      const CacheService = require('@/config/redis').CacheService;
      const analysisData = await CacheService.get(`resume_analysis:${analysisId}`);
      
      if (!analysisData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ANALYSIS_NOT_FOUND',
            message: 'Resume analysis not found or expired',
          },
        });
        return;
      }

      const analysis = JSON.parse(analysisData);

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          candidateId: analysis.candidateId,
          biasAnalysis: analysis.biasAnalysis,
          overallBiasScore: analysis.biasAnalysis.overallBiasScore,
          extractedAt: analysis.createdAt,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get bias analysis error:', error);
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
   * Get supported file types for resume upload
   */
  static async getSupportedFileTypes(req: Request, res: Response): Promise<void> {
    try {
      const supportedTypes = [
        {
          mimeType: 'application/pdf',
          extension: '.pdf',
          description: 'PDF Document',
          maxSize: '10MB',
        },
        {
          mimeType: 'text/plain',
          extension: '.txt',
          description: 'Plain Text',
          maxSize: '10MB',
        },
        {
          mimeType: 'application/msword',
          extension: '.doc',
          description: 'Microsoft Word Document (Legacy)',
          maxSize: '10MB',
        },
        {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: '.docx',
          description: 'Microsoft Word Document',
          maxSize: '10MB',
        },
      ];

      res.status(200).json({
        success: true,
        data: {
          supportedTypes,
          maxFileSize: process.env.MAX_FILE_SIZE || '10485760',
          recommendations: [
            'PDF format is recommended for best parsing accuracy',
            'Ensure text is selectable (not scanned images)',
            'Use standard resume formatting for optimal analysis',
          ],
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get supported file types error:', error);
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