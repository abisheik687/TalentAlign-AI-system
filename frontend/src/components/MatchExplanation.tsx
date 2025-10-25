import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Help as HelpIcon,
  Visibility as VisibilityIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

/**
 * Match Explanation Component
 * Displays comprehensive AI-generated explanations for candidate-job matches
 * Requirements: 2.2, 2.5, 5.1, 5.2
 */

interface MatchExplanationProps {
  explanation: MatchExplanation;
  onClose?: () => void;
  showDetailedView?: boolean;
}

interface MatchExplanation {
  explanationId: string;
  candidateId: string;
  jobId: string;
  matchScore: number;
  summary: MatchSummary;
  componentExplanations: ComponentExplanation[];
  strengthsWeaknesses: StrengthsWeaknessesAnalysis;
  recommendations: Recommendation[];
  fairnessExplanation: FairnessExplanation;
  confidenceAssessment: ConfidenceAssessment;
  visualData: VisualExplanationData;
  contextualFactors: ContextualFactor[];
  generatedAt: Date;
  processingTime: number;
  metadata: {
    explanationVersion: string;
    audienceType: string;
    detailLevel: string;
    language: string;
  };
}

interface MatchSummary {
  overallScore: number;
  confidence: number;
  summaryText: string;
  recommendation: string;
  keyStrengths: string[];
  primaryConcerns: string[];
}

interface ComponentExplanation {
  component: string;
  score: number;
  explanation: string;
  importance: number;
  details: any;
  visualType: string;
}

interface StrengthsWeaknessesAnalysis {
  strengths: Strength[];
  weaknesses: Weakness[];
  overallAssessment: string;
}

interface Strength {
  area: string;
  score: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
  evidence: string[];
}

interface Weakness {
  area: string;
  score: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestions: string[];
}

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
}

interface FairnessExplanation {
  biasRisk: number;
  biasFactors: string[];
  demographicImpact: any;
  fairnessMetrics: any;
  mitigationMeasures: string[];
  complianceStatus: 'compliant' | 'requires_review' | 'non_compliant';
  explanation: string;
}

interface ConfidenceAssessment {
  overallConfidence: number;
  confidenceLevel: string;
  factors: ConfidenceFactor[];
  explanation: string;
  limitations: string[];
}

interface ConfidenceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

interface VisualExplanationData {
  scoreBreakdown: {
    type: string;
    data: any[];
  };
  skillsMatch: {
    type: string;
    data: any;
  };
  confidenceIndicator: {
    type: string;
    data: any;
  };
  matchTrend: {
    type: string;
    data: any[];
  };
}

interface ContextualFactor {
  factor: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

const MatchExplanationComponent: React.FC<MatchExplanationProps> = ({
  explanation,
  onClose,
  showDetailedView = false
}) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('summary');
  const [showFairnessDialog, setShowFairnessDialog] = useState(false);
  const [showAlgorithmDialog, setShowAlgorithmDialog] = useState(false);

  // Get match score color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  // Get impact icon
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUpIcon color="success" />;
      case 'negative': return <TrendingDownIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  // Handle accordion expansion
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">
              Match Explanation
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View Fairness Analysis">
                <IconButton onClick={() => setShowFairnessDialog(true)}>
                  <AssessmentIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Algorithm Details">
                <IconButton onClick={() => setShowAlgorithmDialog(true)}>
                  <PsychologyIcon />
                </IconButton>
              </Tooltip>
              {onClose && (
                <Button variant="outlined" onClick={onClose}>
                  Close
                </Button>
              )}
            </Box>
          </Box>

          {/* Overall Score Display */}
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" color={`${getScoreColor(explanation.summary.overallScore)}.main`}>
                  {explanation.summary.overallScore}%
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Overall Match Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {explanation.summary.summaryText}
              </Typography>
              <Chip
                label={explanation.summary.recommendation}
                color={getScoreColor(explanation.summary.overallScore) as any}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="textSecondary">
                  Confidence: {explanation.summary.confidence}%
                </Typography>
                <Chip
                  size="small"
                  label={explanation.confidenceAssessment.confidenceLevel}
                  color={explanation.confidenceAssessment.confidenceLevel === 'High' ? 'success' : 'warning'}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Score Breakdown Visualization */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Score Breakdown
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={explanation.visualData.scoreBreakdown.data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={explanation.visualData.scoreBreakdown.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Legend />
                  <Bar dataKey="score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Detailed Explanations */}
      <Box sx={{ mb: 3 }}>
        {/* Summary Section */}
        <Accordion
          expanded={expandedSection === 'summary'}
          onChange={handleAccordionChange('summary')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Match Summary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Strengths
                </Typography>
                <List dense>
                  {explanation.summary.keyStrengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Primary Concerns
                </Typography>
                <List dense>
                  {explanation.summary.primaryConcerns.map((concern, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={concern} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Component Explanations */}
        <Accordion
          expanded={expandedSection === 'components'}
          onChange={handleAccordionChange('components')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Detailed Component Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {explanation.componentExplanations.map((component, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                        {component.component.replace('_', ' ')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color={`${getScoreColor(component.score * 100)}.main`}>
                          {Math.round(component.score * 100)}%
                        </Typography>
                        <Chip
                          size="small"
                          label={`${Math.round(component.importance * 100)}% weight`}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={component.score * 100}
                      color={getScoreColor(component.score * 100) as any}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      {component.explanation}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Strengths and Weaknesses */}
        <Accordion
          expanded={expandedSection === 'strengths_weaknesses'}
          onChange={handleAccordionChange('strengths_weaknesses')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Strengths & Weaknesses Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
              {explanation.strengthsWeaknesses.overallAssessment}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="success.main" gutterBottom>
                  Strengths
                </Typography>
                {explanation.strengthsWeaknesses.strengths.map((strength, index) => (
                  <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'success.light' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {strength.area.replace('_', ' ')}
                        </Typography>
                        <Chip
                          size="small"
                          label={strength.impact}
                          color={strength.impact === 'high' ? 'success' : 'info'}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {strength.description}
                      </Typography>
                      {strength.evidence.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Evidence:
                          </Typography>
                          <List dense>
                            {strength.evidence.map((evidence, evidenceIndex) => (
                              <ListItem key={evidenceIndex} sx={{ py: 0 }}>
                                <ListItemText
                                  primary={evidence}
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="warning.main" gutterBottom>
                  Areas for Development
                </Typography>
                {explanation.strengthsWeaknesses.weaknesses.map((weakness, index) => (
                  <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'warning.light' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {weakness.area.replace('_', ' ')}
                        </Typography>
                        <Chip
                          size="small"
                          label={weakness.impact}
                          color={weakness.impact === 'high' ? 'error' : 'warning'}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {weakness.description}
                      </Typography>
                      {weakness.suggestions.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Suggestions:
                          </Typography>
                          <List dense>
                            {weakness.suggestions.map((suggestion, suggestionIndex) => (
                              <ListItem key={suggestionIndex} sx={{ py: 0 }}>
                                <ListItemText
                                  primary={suggestion}
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Recommendations */}
        <Accordion
          expanded={expandedSection === 'recommendations'}
          onChange={handleAccordionChange('recommendations')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Recommendations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {explanation.recommendations.map((recommendation, index) => (
                <Grid item xs={12} key={index}>
                  <Card sx={{ border: '1px solid', borderColor: `${getPriorityColor(recommendation.priority)}.light` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">
                          {recommendation.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${recommendation.priority} priority`}
                          color={getPriorityColor(recommendation.priority) as any}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {recommendation.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Rationale: {recommendation.rationale}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Contextual Factors */}
        <Accordion
          expanded={expandedSection === 'contextual'}
          onChange={handleAccordionChange('contextual')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Contextual Factors</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {explanation.contextualFactors.map((factor, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getImpactIcon(factor.impact)}
                      <Typography variant="subtitle2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                        {factor.factor.replace('_', ' ')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {factor.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {factor.explanation}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Fairness Analysis Dialog */}
      <Dialog
        open={showFairnessDialog}
        onClose={() => setShowFairnessDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Fairness Analysis
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Alert
              severity={explanation.fairnessExplanation.complianceStatus === 'compliant' ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            >
              Compliance Status: {explanation.fairnessExplanation.complianceStatus}
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              {explanation.fairnessExplanation.explanation}
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Bias Risk Assessment
            </Typography>
            <LinearProgress
              variant="determinate"
              value={explanation.fairnessExplanation.biasRisk * 100}
              color={explanation.fairnessExplanation.biasRisk < 0.3 ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="textSecondary">
              Bias Risk: {Math.round(explanation.fairnessExplanation.biasRisk * 100)}%
            </Typography>

            {explanation.fairnessExplanation.mitigationMeasures.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fairness Mitigation Measures
                </Typography>
                <List dense>
                  {explanation.fairnessExplanation.mitigationMeasures.map((measure, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={measure} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFairnessDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Algorithm Details Dialog */}
      <Dialog
        open={showAlgorithmDialog}
        onClose={() => setShowAlgorithmDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Algorithm Transparency
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="h6" gutterBottom>
              How This Match Was Calculated
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              This match score was generated using our ethical AI matching algorithm that considers multiple factors
              while ensuring fairness and avoiding bias.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Scoring Components & Weights
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Contribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {explanation.componentExplanations.map((component) => (
                    <TableRow key={component.component}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {component.component.replace('_', ' ')}
                      </TableCell>
                      <TableCell align="right">
                        {Math.round(component.importance * 100)}%
                      </TableCell>
                      <TableCell align="right">
                        {Math.round(component.score * 100)}%
                      </TableCell>
                      <TableCell align="right">
                        {Math.round(component.score * component.importance * 100)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" gutterBottom>
              Confidence Assessment
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {explanation.confidenceAssessment.explanation}
            </Typography>
            
            {explanation.confidenceAssessment.limitations.length > 0 && (
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Limitations:
                </Typography>
                <List dense>
                  {explanation.confidenceAssessment.limitations.map((limitation, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon>
                        <InfoIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={limitation}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Generated on: {new Date(explanation.generatedAt).toLocaleString()}<br />
                Processing time: {explanation.processingTime}ms<br />
                Explanation version: {explanation.metadata.explanationVersion}<br />
                Audience: {explanation.metadata.audienceType}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlgorithmDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MatchExplanationComponent;