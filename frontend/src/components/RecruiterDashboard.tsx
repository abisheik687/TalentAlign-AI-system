import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Avatar, 
  LinearProgress, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Alert, Badge
} from '@mui/material';
import {
  Person as PersonIcon, Work as WorkIcon, Assessment as AssessmentIcon,
  Visibility as VisibilityIcon, Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon, Warning as WarningIcon
} from '@mui/icons-material';
import { MatchExplanationComponent } from './MatchExplanation';
import { useWebSocket } from '@/hooks/useWebSocket';

/**
 * Recruiter Dashboard - Main hiring interface with bias-aware features
 * Requirements: 2.2, 6.1, 5.1
 */

const RecruiterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [biasAlerts, setBiasAlerts] = useState<any[]>([]);
  const [pipelineStats, setPipelineStats] = useState<any>({});

  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    loadDashboardData();
    if (socket) {
      socket.on('bias_alert', handleBiasAlert);
      socket.on('pipeline_update', handlePipelineUpdate);
    }
  }, [socket]);

  const loadDashboardData = async () => {
    // Load candidates, jobs, and pipeline data
    const mockCandidates = [
      {
        id: 'candidate_001',
        name: 'Sarah Chen',
        title: 'Senior Frontend Developer',
        matchScore: 92,
        biasRisk: 'low',
        status: 'screening',
        appliedDate: '2024-01-15',
        skills: ['React', 'TypeScript', 'Node.js'],
        experience: 6,
        avatar: '/avatars/sarah.jpg'
      },
      {
        id: 'candidate_002', 
        name: 'Marcus Johnson',
        title: 'Full Stack Engineer',
        matchScore: 87,
        biasRisk: 'low',
        status: 'interview',
        appliedDate: '2024-01-14',
        skills: ['Python', 'Django', 'React'],
        experience: 4,
        avatar: '/avatars/marcus.jpg'
      }
    ];
    setCandidates(mockCandidates);

    const mockJobs = [
      { id: 'job_001', title: 'Senior Frontend Developer', applicants: 45, status: 'active' },
      { id: 'job_002', title: 'Backend Engineer', applicants: 32, status: 'active' }
    ];
    setJobs(mockJobs);

    setPipelineStats({
      totalCandidates: 156,
      activeJobs: 8,
      interviewsScheduled: 23,
      biasScore: 0.15,
      diversityScore: 0.78
    });
  };

  const handleBiasAlert = (alert: any) => {
    setBiasAlerts(prev => [alert, ...prev.slice(0, 4)]);
  };

  const handlePipelineUpdate = (update: any) => {
    setPipelineStats(prev => ({ ...prev, ...update }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'screening': 'info',
      'interview': 'warning', 
      'offer': 'success',
      'rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const getBiasRiskColor = (risk: string) => {
    const colors: Record<string, any> = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error'
    };
    return colors[risk] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Recruiter Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            icon={<TrendingUpIcon />}
            label={`Bias Score: ${(pipelineStats.biasScore * 100).toFixed(1)}%`}
            color={pipelineStats.biasScore < 0.2 ? 'success' : 'warning'}
          />
          <Badge badgeContent={biasAlerts.length} color="error">
            <Button variant="outlined" startIcon={<WarningIcon />}>
              Bias Alerts
            </Button>
          </Badge>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="h4">{pipelineStats.totalCandidates}</Typography>
                  <Typography color="textSecondary">Total Candidates</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WorkIcon color="primary" />
                <Box>
                  <Typography variant="h4">{pipelineStats.activeJobs}</Typography>
                  <Typography color="textSecondary">Active Jobs</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ScheduleIcon color="primary" />
                <Box>
                  <Typography variant="h4">{pipelineStats.interviewsScheduled}</Typography>
                  <Typography color="textSecondary">Interviews Scheduled</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssessmentIcon color="primary" />
                <Box>
                  <Typography variant="h4">{(pipelineStats.diversityScore * 100).toFixed(0)}%</Typography>
                  <Typography color="textSecondary">Diversity Score</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bias Alerts */}
      {biasAlerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Recent Bias Alerts</Typography>
          {biasAlerts.slice(0, 2).map((alert, index) => (
            <Typography key={index} variant="body2">
              • {alert.description}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Candidate Pipeline" />
          <Tab label="Job Postings" />
          <Tab label="Analytics" />
        </Tabs>

        {/* Candidate Pipeline Tab */}
        {activeTab === 0 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Candidate Pipeline - Bias-Aware Shortlisting
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Match Score</TableCell>
                    <TableCell>Bias Risk</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applied</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={candidate.avatar}>
                            {candidate.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{candidate.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {candidate.title}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={candidate.matchScore}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                            color={candidate.matchScore >= 80 ? 'success' : 'primary'}
                          />
                          <Typography variant="body2">{candidate.matchScore}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={candidate.biasRisk}
                          color={getBiasRiskColor(candidate.biasRisk)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={candidate.status}
                          color={getStatusColor(candidate.status)}
                        />
                      </TableCell>
                      <TableCell>{candidate.appliedDate}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedMatch(candidate);
                            setShowExplanation(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Job Postings Tab */}
        {activeTab === 1 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>Active Job Postings</Typography>
            <Grid container spacing={2}>
              {jobs.map((job) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{job.title}</Typography>
                      <Typography color="textSecondary">
                        {job.applicants} applicants
                      </Typography>
                      <Chip size="small" label={job.status} color="success" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Analytics Tab */}
        {activeTab === 2 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>Hiring Analytics</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">Bias Metrics</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">Overall Bias Score</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pipelineStats.biasScore * 100}
                        color={pipelineStats.biasScore < 0.2 ? 'success' : 'warning'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">Diversity Metrics</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">Diversity Score</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pipelineStats.diversityScore * 100}
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Match Explanation Dialog */}
      <Dialog
        open={showExplanation}
        onClose={() => setShowExplanation(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Match Explanation</DialogTitle>
        <DialogContent>
          {selectedMatch && (
            <MatchExplanationComponent
              explanation={{
                explanationId: 'exp_001',
                candidateId: selectedMatch.id,
                jobId: 'job_001',
                matchScore: selectedMatch.matchScore,
                summary: {
                  overallScore: selectedMatch.matchScore,
                  confidence: 85,
                  summaryText: `Strong match with ${selectedMatch.matchScore}% compatibility`,
                  recommendation: 'Proceed to interview',
                  keyStrengths: ['Technical Skills', 'Experience Level'],
                  primaryConcerns: []
                },
                componentExplanations: [],
                strengthsWeaknesses: { strengths: [], weaknesses: [], overallAssessment: '' },
                recommendations: [],
                fairnessExplanation: {
                  biasRisk: 0.1,
                  biasFactors: [],
                  demographicImpact: null,
                  fairnessMetrics: null,
                  mitigationMeasures: [],
                  complianceStatus: 'compliant',
                  explanation: 'No bias detected in matching process'
                },
                confidenceAssessment: {
                  overallConfidence: 85,
                  confidenceLevel: 'High',
                  factors: [],
                  explanation: 'High confidence based on complete profile',
                  limitations: []
                },
                visualData: {
                  scoreBreakdown: { type: 'radar', data: [] },
                  skillsMatch: { type: 'matrix', data: {} },
                  confidenceIndicator: { type: 'gauge', data: {} },
                  matchTrend: { type: 'line', data: [] }
                },
                contextualFactors: [],
                generatedAt: new Date(),
                processingTime: 150,
                metadata: {
                  explanationVersion: '1.0',
                  audienceType: 'recruiter',
                  detailLevel: 'standard',
                  language: 'en'
                }
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExplanation(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecruiterDashboard;