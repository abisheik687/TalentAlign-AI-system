import { CandidateProfile, CandidateProfileDocument } from '@/models/CandidateProfile';
import { JobRequirements, JobRequirementsDocument } from '@/models/JobRequirements';
import { EthicalConstraintsService } from '@/services/EthicalConstraintsService';
import { AnonymizationService } from '@/services/AnonymizationService';
import { logger } from '@/utils/logger';

/**
 * Data Model Service
 * Handles creation and validation of candidate profiles and job requirements
 * with ethical AI constraints
 * Requirements: 1.4, 2.1, 7.1
 */
export class DataModelService {
  private ethicalConstraints: EthicalConstraintsService;

  constructor() {
    this.ethicalConstraints = new EthicalConstraintsService();
  }

  /**
   * Create anonymized candidate profile
   */
  async createCandidateProfile(profileData: any, userId: string): Promise<CandidateProfileDocument> {
    try {
      // Validate consent
      if (!profileData.consentGiven) {
        throw new Error('Candidate consent is required to create profile');
      }

      // Generate anonymized ID
      const anonymizedId = AnonymizationService.generateIrreversibleHash(
        `${userId}_${Date.now()}`,
        process.env.ANONYMIZATION_SALT
      );

      // Create profile with anonymized ID
      const profile = new CandidateProfile({
        ...profileData,
        anonymizedId,
        anonymizedAt: new Date(),
        dataRetentionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });

      // Anonymize the data
      await profile.anonymizeData();

      // Validate ethical constraints
      const isAnonymized = await this.ethicalConstraints.validateDataAnonymization(profile.toObject());
      if (!isAnonymized) {
        throw new Error('Profile data failed anonymization validation');
      }

      // Save the profile
      await profile.save();

      // Create anonymization report
      const report = await AnonymizationService.createAnonymizationReport(
        profileData,
        profile.toObject(),
        userId
      );

      logger.info('Candidate profile created with anonymization', {
        anonymizedId: profile.anonymizedId,
        reportId: report.reportId,
        profileCompleteness: profile.profileCompleteness,
        piiDetected: report.piiDetected,
      });

      return profile;
    } catch (error) {
      logger.error('Error creating candidate profile:', error);
      throw error;
    }
  }

  /**
   * Create job requirements with bias analysis
   */
  async createJobRequirements(jobData: any, createdBy: string): Promise<JobRequirementsDocument> {
    try {
      // Create job requirements
      const job = new JobRequirements({
        ...jobData,
        createdBy,
      });

      // Analyze bias in job description
      await job.analyzeBias();

      // Validate bias score
      if (job.biasAnalysis.biasScore > 0.8) {
        logger.warn('Job posting has high bias score', {
          biasScore: job.biasAnalysis.biasScore,
          flaggedTerms: job.biasAnalysis.flaggedTerms,
        });
        
        // Don't throw error, but log warning for review
      }

      // Initialize equity metrics
      job.equityMetrics = {
        genderPayGap: 0,
        ethnicityPayGap: 0,
        promotionRates: {
          overall: 0,
          byGender: new Map(),
          byEthnicity: new Map(),
          byAge: new Map(),
        },
        hiringDiversity: {
          targetDiversity: 50, // 50% diversity target
          actualDiversity: 0,
          improvementTrend: 'stable',
        },
        retentionRates: {
          overall: 0,
          byDemographic: new Map(),
          firstYearRetention: 0,
        },
        satisfactionScores: {
          overall: 0,
          byDemographic: new Map(),
          inclusionScore: 0,
        },
        lastUpdated: new Date(),
      };

      // Save the job
      await job.save();

      logger.info('Job requirements created with bias analysis', {
        jobId: job.id,
        title: job.title,
        biasScore: job.biasAnalysis.biasScore,
        flaggedTerms: job.biasAnalysis.flaggedTerms.length,
      });

      return job;
    } catch (error) {
      logger.error('Error creating job requirements:', error);
      throw error;
    }
  }

  /**
   * Update candidate profile with validation
   */
  async updateCandidateProfile(
    profileId: string,
    updateData: any,
    userId: string
  ): Promise<CandidateProfileDocument> {
    try {
      const profile = await CandidateProfile.findOne({ anonymizedId: profileId });
      if (!profile) {
        throw new Error('Candidate profile not found');
      }

      // Check data retention expiry
      if (profile.dataRetentionExpiry < new Date()) {
        throw new Error('Candidate profile has expired and cannot be updated');
      }

      // Validate consent for updates
      if (!profile.hasValidConsent('data_processing')) {
        throw new Error('Valid consent required for profile updates');
      }

      // Apply updates
      Object.assign(profile, updateData);

      // Re-anonymize if necessary
      if (updateData.experience || updateData.education || updateData.projects) {
        await profile.anonymizeData();
      }

      // Validate ethical constraints
      const isAnonymized = await this.ethicalConstraints.validateDataAnonymization(profile.toObject());
      if (!isAnonymized) {
        throw new Error('Updated profile data failed anonymization validation');
      }

      await profile.save();

      logger.info('Candidate profile updated', {
        anonymizedId: profile.anonymizedId,
        profileCompleteness: profile.profileCompleteness,
      });

      return profile;
    } catch (error) {
      logger.error('Error updating candidate profile:', error);
      throw error;
    }
  }

  /**
   * Update job requirements with bias re-analysis
   */
  async updateJobRequirements(
    jobId: string,
    updateData: any,
    userId: string
  ): Promise<JobRequirementsDocument> {
    try {
      const job = await JobRequirements.findById(jobId);
      if (!job) {
        throw new Error('Job requirements not found');
      }

      // Check if user has permission to update
      if (job.createdBy !== userId) {
        throw new Error('Insufficient permissions to update job requirements');
      }

      // Apply updates
      Object.assign(job, updateData);

      // Re-analyze bias if description or title changed
      if (updateData.title || updateData.description || updateData.responsibilities) {
        await job.analyzeBias();
      }

      await job.save();

      logger.info('Job requirements updated', {
        jobId: job.id,
        title: job.title,
        biasScore: job.biasAnalysis.biasScore,
      });

      return job;
    } catch (error) {
      logger.error('Error updating job requirements:', error);
      throw error;
    }
  }

  /**
   * Find candidate profiles with ethical constraints
   */
  async findCandidateProfiles(
    criteria: any,
    options: { limit?: number; skip?: number } = {}
  ): Promise<CandidateProfileDocument[]> {
    try {
      const query = {
        ...criteria,
        consentGiven: true,
        dataRetentionExpiry: { $gt: new Date() },
      };

      const profiles = await CandidateProfile
        .find(query)
        .limit(options.limit || 50)
        .skip(options.skip || 0)
        .sort({ profileCompleteness: -1, lastUpdated: -1 });

      logger.info('Candidate profiles retrieved', {
        count: profiles.length,
        criteria: Object.keys(criteria),
      });

      return profiles;
    } catch (error) {
      logger.error('Error finding candidate profiles:', error);
      throw error;
    }
  }

  /**
   * Find job requirements with bias filtering
   */
  async findJobRequirements(
    criteria: any,
    options: { 
      limit?: number; 
      skip?: number; 
      maxBiasScore?: number;
      includeHighBias?: boolean;
    } = {}
  ): Promise<JobRequirementsDocument[]> {
    try {
      const query = {
        ...criteria,
        status: 'active',
      };

      // Filter by bias score if specified
      if (options.maxBiasScore !== undefined && !options.includeHighBias) {
        query['biasAnalysis.biasScore'] = { $lte: options.maxBiasScore };
      }

      const jobs = await JobRequirements
        .find(query)
        .limit(options.limit || 50)
        .skip(options.skip || 0)
        .sort({ 'biasAnalysis.biasScore': 1, createdAt: -1 });

      logger.info('Job requirements retrieved', {
        count: jobs.length,
        criteria: Object.keys(criteria),
        maxBiasScore: options.maxBiasScore,
      });

      return jobs;
    } catch (error) {
      logger.error('Error finding job requirements:', error);
      throw error;
    }
  }

  /**
   * Delete candidate profile with audit trail
   */
  async deleteCandidateProfile(profileId: string, reason: string): Promise<void> {
    try {
      const profile = await CandidateProfile.findOne({ anonymizedId: profileId });
      if (!profile) {
        throw new Error('Candidate profile not found');
      }

      // Create audit record before deletion
      logger.info('Candidate profile deleted', {
        anonymizedId: profile.anonymizedId,
        reason,
        profileCompleteness: profile.profileCompleteness,
        deletedAt: new Date(),
      });

      await CandidateProfile.deleteOne({ anonymizedId: profileId });
    } catch (error) {
      logger.error('Error deleting candidate profile:', error);
      throw error;
    }
  }

  /**
   * Get data model statistics
   */
  async getStatistics(): Promise<{
    candidateProfiles: {
      total: number;
      withConsent: number;
      averageCompleteness: number;
      expiringSoon: number;
    };
    jobRequirements: {
      total: number;
      active: number;
      averageBiasScore: number;
      highBiasCount: number;
    };
  }> {
    try {
      const [
        totalProfiles,
        profilesWithConsent,
        avgCompleteness,
        expiringSoon,
        totalJobs,
        activeJobs,
        biasStats,
        highBiasJobs,
      ] = await Promise.all([
        CandidateProfile.countDocuments(),
        CandidateProfile.countDocuments({ consentGiven: true }),
        CandidateProfile.aggregate([
          { $group: { _id: null, avg: { $avg: '$profileCompleteness' } } }
        ]),
        CandidateProfile.countDocuments({
          dataRetentionExpiry: { 
            $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }),
        JobRequirements.countDocuments(),
        JobRequirements.countDocuments({ status: 'active' }),
        JobRequirements.aggregate([
          { $group: { _id: null, avg: { $avg: '$biasAnalysis.biasScore' } } }
        ]),
        JobRequirements.countDocuments({ 'biasAnalysis.biasScore': { $gt: 0.7 } }),
      ]);

      return {
        candidateProfiles: {
          total: totalProfiles,
          withConsent: profilesWithConsent,
          averageCompleteness: avgCompleteness[0]?.avg || 0,
          expiringSoon,
        },
        jobRequirements: {
          total: totalJobs,
          active: activeJobs,
          averageBiasScore: biasStats[0]?.avg || 0,
          highBiasCount: highBiasJobs,
        },
      };
    } catch (error) {
      logger.error('Error getting data model statistics:', error);
      throw error;
    }
  }
}

export default DataModelService;