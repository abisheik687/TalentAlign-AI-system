import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Feedback as FeedbackIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Appeal as AppealIcon,
  DataUsage as DataUsageIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * Candidate Portal Component
 * Provides transparency, data ownership, and appeal functionality
 * Requirements: 7.2, 7.3, 7.4
 */

interface CandidateData {
  id: string;
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    profileCompleteness: number;
  };
  applications: ApplicationStatus[];
  dataUsage: DataUsageInfo[];
  consents: ConsentStatus[];
  appeals: Appeal[];
}in
terface ApplicationStatus {
  applicationId: string;
  jobTitle: string;
  company: string;
  status: 'applied' | 'screening' | 'interview' | 'decision' | 'rejected' | 'hired';
  submittedAt: Date;
  lastUpdated: Date;
  matchScore?: number;
  feedback?: string;
  canAppeal: boolean;
}

interface DataUsageInfo {
  dataCollected: string[];
  processingPurposes: string[];
  sharingPartners: string[];
  retentionPeriod: string;
  lastAccessed: Date;
}

interface ConsentStatus {
  consentType: string;
  description: string;
  granted: boolean;
  grantedAt?: Date;
  canRevoke: boolean;
}

interface Appeal {
  appealId: string;
  applicationId: string;
  jobTitle: string;
  reason: string;
  description: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'rejected';
  submittedAt: Date;
  response?: string;
  respondedAt?: Date;
}

const CandidatePortal: React.FC = () => {
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealDescription, setAppealDescription] = useState('');
  const [dataExportDialogOpen, setDataExportDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadCandidateData();
  }, []);

  const loadCandidateData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, this would come from API
      const mockData: CandidateData = {
        id: 'candidate_123',
        profile: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          profileCompleteness: 85
        },     
   applications: [
          {
            applicationId: 'app_001',
            jobTitle: 'Senior Software Engineer',
            company: 'TechCorp Inc.',
            status: 'interview',
            submittedAt: new Date('2024-01-15'),
            lastUpdated: new Date('2024-01-20'),
            matchScore: 87,
            canAppeal: false
          },
          {
            applicationId: 'app_002',
            jobTitle: 'Full Stack Developer',
            company: 'StartupXYZ',
            status: 'rejected',
            submittedAt: new Date('2024-01-10'),
            lastUpdated: new Date('2024-01-18'),
            matchScore: 65,
            feedback: 'While your technical skills are strong, we decided to move forward with candidates who have more experience with our specific tech stack.',
            canAppeal: true
          }
        ],
        dataUsage: [
          {
            dataCollected: ['Resume', 'Contact Information', 'Skills Assessment', 'Interview Responses'],
            processingPurposes: ['Job Matching', 'Skills Analysis', 'Interview Scheduling'],
            sharingPartners: ['Partner Companies (with consent)', 'Assessment Providers'],
            retentionPeriod: '2 years from last application',
            lastAccessed: new Date('2024-01-21')
          }
        ],
        consents: [
          {
            consentType: 'profile_sharing',
            description: 'Share anonymized profile with partner companies for job matching',
            granted: true,
            grantedAt: new Date('2024-01-01'),
            canRevoke: true
          },
          {
            consentType: 'skills_assessment',
            description: 'Use AI to analyze skills and provide recommendations',
            granted: true,
            grantedAt: new Date('2024-01-01'),
            canRevoke: true
          },
          {
            consentType: 'interview_recording',
            description: 'Record interviews for quality assurance and bias detection',
            granted: false,
            canRevoke: true
          }
        ],
        appeals: [
          {
            appealId: 'appeal_001',
            applicationId: 'app_002',
            jobTitle: 'Full Stack Developer',
            reason: 'bias_concern',
            description: 'I believe the rejection may have been influenced by unconscious bias regarding my background.',
            status: 'under_review',
            submittedAt: new Date('2024-01-19')
          }
        ]
      };

      setCandidateData(mockData);
    } catch (error) {
      console.error('Failed to load candidate data:', error);
    } finally {
      setLoading(false);
    }
  };  const h
andleAppealSubmit = async () => {
    if (!selectedApplication || !appealReason || !appealDescription) return;

    try {
      // In real implementation, this would call the API
      const newAppeal: Appeal = {
        appealId: `appeal_${Date.now()}`,
        applicationId: selectedApplication.applicationId,
        jobTitle: selectedApplication.jobTitle,
        reason: appealReason,
        description: appealDescription,
        status: 'submitted',
        submittedAt: new Date()
      };

      setCandidateData(prev => prev ? {
        ...prev,
        appeals: [...prev.appeals, newAppeal]
      } : null);

      setAppealDialogOpen(false);
      setAppealReason('');
      setAppealDescription('');
      setSelectedApplication(null);
    } catch (error) {
      console.error('Failed to submit appeal:', error);
    }
  };

  const handleDataExport = async (format: 'json' | 'pdf') => {
    try {
      // In real implementation, this would call the API
      const exportData = {
        profile: candidateData?.profile,
        applications: candidateData?.applications,
        dataUsage: candidateData?.dataUsage,
        consents: candidateData?.consents,
        appeals: candidateData?.appeals,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: format === 'json' ? 'application/json' : 'application/pdf'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDataExportDialogOpen(false);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleConsentToggle = async (consentType: string, granted: boolean) => {
    try {
      setCandidateData(prev => prev ? {
        ...prev,
        consents: prev.consents.map(consent =>
          consent.consentType === consentType
            ? { ...consent, granted, grantedAt: granted ? new Date() : consent.grantedAt }
            : consent
        )
      } : null);
    } catch (error) {
      console.error('Failed to update consent:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'success';
      case 'interview': return 'info';
      case 'screening': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getAppealStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'under_review': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };  if 
(loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Candidate Portal
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Welcome, {candidateData?.profile.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setDataExportDialogOpen(true)}
          >
            Export My Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<FeedbackIcon />}
            onClick={() => setFeedbackDialogOpen(true)}
          >
            Provide Feedback
          </Button>
        </Box>
      </Box>

      {/* Profile Completeness */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Profile Completeness</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress
              variant="determinate"
              value={candidateData?.profile.profileCompleteness || 0}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="textSecondary">
              {candidateData?.profile.profileCompleteness}%
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Complete your profile to improve job matching accuracy
          </Typography>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Applications" icon={<TimelineIcon />} />
          <Tab label="Data & Privacy" icon={<SecurityIcon />} />
          <Tab label="Appeals" icon={<AppealIcon />} />
        </Tabs>

        {/* Applications Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              My Applications
            </Typography>
            <Grid container spacing={2}>
              {candidateData?.applications.map((application) => (
                <Grid item xs={12} key={application.applicationId}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{application.jobTitle}</Typography>
                          <Typography color="textSecondary">{application.company}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Applied: {application.submittedAt.toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={application.status.replace('_', ' ')}
                            color={getStatusColor(application.status) as any}
                            sx={{ mb: 1 }}
                          />
                          {application.matchScore && (
                            <Typography variant="body2" color="textSecondary">
                              Match: {application.matchScore}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      {application.feedback && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">{application.feedback}</Typography>
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" startIcon={<VisibilityIcon />}>
                          View Details
                        </Button>
                        {application.canAppeal && (
                          <Button
                            size="small"
                            startIcon={<AppealIcon />}
                            onClick={() => {
                              setSelectedApplication(application);
                              setAppealDialogOpen(true);
                            }}
                          >
                            Submit Appeal
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}        {
/* Data & Privacy Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Usage & Privacy Controls
            </Typography>
            
            {/* Data Usage Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <DataUsageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  How Your Data Is Used
                </Typography>
                
                {candidateData?.dataUsage.map((usage, index) => (
                  <Box key={index}>
                    <Typography variant="subtitle2" gutterBottom>Data Collected:</Typography>
                    <Box sx={{ mb: 2 }}>
                      {usage.dataCollected.map((item) => (
                        <Chip key={item} label={item} size="small" sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>Processing Purposes:</Typography>
                    <List dense>
                      {usage.processingPurposes.map((purpose) => (
                        <ListItem key={purpose} sx={{ py: 0 }}>
                          <ListItemText primary={purpose} />
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="subtitle2" gutterBottom>Data Sharing:</Typography>
                    <List dense>
                      {usage.sharingPartners.map((partner) => (
                        <ListItem key={partner} sx={{ py: 0 }}>
                          <ListItemText primary={partner} />
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="body2" color="textSecondary">
                      Retention Period: {usage.retentionPeriod}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Last Accessed: {usage.lastAccessed.toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Consent Management */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Privacy Preferences
                </Typography>
                <List>
                  {candidateData?.consents.map((consent) => (
                    <React.Fragment key={consent.consentType}>
                      <ListItem>
                        <ListItemText
                          primary={consent.description}
                          secondary={
                            consent.grantedAt
                              ? `Granted on ${consent.grantedAt.toLocaleDateString()}`
                              : 'Not granted'
                          }
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={consent.granted}
                              onChange={(e) => handleConsentToggle(consent.consentType, e.target.checked)}
                              disabled={!consent.canRevoke}
                            />
                          }
                          label={consent.granted ? 'Granted' : 'Denied'}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Appeals Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appeals & Feedback
            </Typography>
            
            {candidateData?.appeals.length === 0 ? (
              <Alert severity="info">
                No appeals submitted. You can submit an appeal for any application decision you believe may have been unfair.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {candidateData?.appeals.map((appeal) => (
                  <Grid item xs={12} key={appeal.appealId}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6">{appeal.jobTitle}</Typography>
                            <Typography color="textSecondary">
                              Reason: {appeal.reason.replace('_', ' ')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Submitted: {appeal.submittedAt.toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={appeal.status.replace('_', ' ')}
                            color={getAppealStatusColor(appeal.status) as any}
                          />
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {appeal.description}
                        </Typography>

                        {appeal.response && (
                          <Alert severity="info">
                            <Typography variant="subtitle2">Response:</Typography>
                            <Typography variant="body2">{appeal.response}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              Responded on {appeal.respondedAt?.toLocaleDateString()}
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>      {
/* Appeal Submission Dialog */}
      <Dialog open={appealDialogOpen} onClose={() => setAppealDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submit Appeal</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Application: {selectedApplication.jobTitle} at {selectedApplication.company}
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Reason for Appeal"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                <option value="">Select a reason</option>
                <option value="bias_concern">Potential bias in decision</option>
                <option value="incorrect_information">Incorrect information used</option>
                <option value="process_violation">Hiring process violation</option>
                <option value="technical_error">Technical error in system</option>
                <option value="other">Other</option>
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Detailed Description"
                value={appealDescription}
                onChange={(e) => setAppealDescription(e.target.value)}
                placeholder="Please provide a detailed explanation of your appeal..."
                helperText="Be specific about your concerns and provide any relevant details"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppealDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAppealSubmit}
            variant="contained"
            disabled={!appealReason || !appealDescription}
          >
            Submit Appeal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Export Dialog */}
      <Dialog open={dataExportDialogOpen} onClose={() => setDataExportDialogOpen(false)}>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You can export all your data in the following formats:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="JSON Format"
                secondary="Machine-readable format for data portability"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="PDF Report"
                secondary="Human-readable summary of your data and activities"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDataExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDataExport('json')} variant="outlined">
            Export JSON
          </Button>
          <Button onClick={() => handleDataExport('pdf')} variant="contained">
            Export PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Provide Feedback</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience with our platform..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setFeedbackDialogOpen(false);
              setFeedback('');
            }}
            variant="contained"
            disabled={!feedback.trim()}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidatePortal;