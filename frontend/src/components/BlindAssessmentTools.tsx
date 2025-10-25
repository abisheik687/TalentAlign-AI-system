import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Slider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';

/**
 * Blind Assessment Tools Component
 * Provides structured evaluation forms and blind work sample evaluation
 * Requirements: 6.2, 6.3
 */

interface AssessmentForm {
  formId: string;
  title: string;
  description: string;
  sections: AssessmentSection[];
  isBlindAssessment: boolean;
  createdBy: string;
  createdAt: Date;
}

interface AssessmentSection {
  sectionId: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  weight: number;
}

interface AssessmentQuestion {
  questionId: string;
  type: 'rating' | 'multiple_choice' | 'text' | 'boolean' | 'slider';
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  weight: number;
}

interface WorkSample {
  sampleId: string;
  title: string;
  description: string;
  instructions: string;
  anonymizedContent: string;
  evaluationCriteria: EvaluationCriteria[];
  submittedAt: Date;
  candidateId?: string; // Hidden in blind evaluation
}

interface EvaluationCriteria {
  criteriaId: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

interface Assessment {
  assessmentId: string;
  formId: string;
  evaluatorId: string;
  candidateId?: string; // Hidden in blind assessment
  responses: AssessmentResponse[];
  overallScore: number;
  completedAt?: Date;
  isBlind: boolean;
}

interface AssessmentResponse {
  questionId: string;
  value: any;
  score?: number;
  comments?: string;
}

const BlindAssessmentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [assessmentForms, setAssessmentForms] = useState<AssessmentForm[]>([]);
  const [workSamples, setWorkSamples] = useState<WorkSample[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);
  const [blindModeEnabled, setBlindModeEnabled] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadAssessmentData();
  }, []);

  const loadAssessmentData = async () => {
    // Mock data - in real implementation, this would come from API
    const mockForms: AssessmentForm[] = [
      {
        formId: 'form_001',
        title: 'Technical Skills Assessment',
        description: 'Comprehensive evaluation of technical competencies',
        isBlindAssessment: true,
        createdBy: 'HR Manager',
        createdAt: new Date('2024-01-01'),
        sections: [
          {
            sectionId: 'section_001',
            title: 'Programming Skills',
            description: 'Evaluate programming knowledge and problem-solving abilities',
            weight: 40,
            questions: [
              {
                questionId: 'q001',
                type: 'rating',
                question: 'Rate the code quality and structure',
                description: 'Consider readability, maintainability, and best practices',
                required: true,
                minValue: 1,
                maxValue: 5,
                weight: 30
              },
              {
                questionId: 'q002',
                type: 'rating',
                question: 'Rate the problem-solving approach',
                description: 'Evaluate the logical thinking and solution efficiency',
                required: true,
                minValue: 1,
                maxValue: 5,
                weight: 25
              },
              {
                questionId: 'q003',
                type: 'multiple_choice',
                question: 'Which best describes the coding style?',
                options: ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'],
                required: true,
                weight: 20
              },
              {
                questionId: 'q004',
                type: 'text',
                question: 'Provide specific feedback on areas for improvement',
                required: false,
                weight: 25
              }
            ]
          },
          {
            sectionId: 'section_002',
            title: 'System Design',
            description: 'Assess system architecture and design thinking',
            weight: 35,
            questions: [
              {
                questionId: 'q005',
                type: 'rating',
                question: 'Rate the system architecture design',
                required: true,
                minValue: 1,
                maxValue: 5,
                weight: 40
              },
              {
                questionId: 'q006',
                type: 'rating',
                question: 'Rate scalability considerations',
                required: true,
                minValue: 1,
                maxValue: 5,
                weight: 35
              },
              {
                questionId: 'q007',
                type: 'boolean',
                question: 'Does the design address security concerns?',
                required: true,
                weight: 25
              }
            ]
          },
          {
            sectionId: 'section_003',
            title: 'Communication',
            description: 'Evaluate written communication and documentation',
            weight: 25,
            questions: [
              {
                questionId: 'q008',
                type: 'rating',
                question: 'Rate the clarity of documentation',
                required: true,
                minValue: 1,
                maxValue: 5,
                weight: 50
              },
              {
                questionId: 'q009',
                type: 'rating',
                question: 'Rate the explanation of technical concepts',
                required: true,
                minValue: 1,
                maxValue: 5,
                weight: 50
              }
            ]
          }
        ]
      }
    ];

    const mockWorkSamples: WorkSample[] = [
      {
        sampleId: 'sample_001',
        title: 'E-commerce API Design',
        description: 'Design and implement a RESTful API for an e-commerce platform',
        instructions: 'Create API endpoints for product management, user authentication, and order processing. Include proper error handling and documentation.',
        anonymizedContent: `
// API Implementation (Anonymized)
// Candidate has implemented the following endpoints:

// Product Management
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

// User Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Order Processing
GET /api/orders
POST /api/orders
PUT /api/orders/:id/status

// The implementation includes:
- Input validation using Joi
- JWT-based authentication
- Error handling middleware
- API documentation with Swagger
- Unit tests with Jest
- Database integration with MongoDB

// Code quality observations:
- Consistent naming conventions
- Proper separation of concerns
- Comprehensive error handling
- Good test coverage (85%)
        `,
        submittedAt: new Date('2024-01-15'),
        evaluationCriteria: [
          {
            criteriaId: 'criteria_001',
            name: 'API Design',
            description: 'RESTful principles, endpoint structure, HTTP methods',
            weight: 25,
            maxScore: 100
          },
          {
            criteriaId: 'criteria_002',
            name: 'Code Quality',
            description: 'Readability, maintainability, best practices',
            weight: 25,
            maxScore: 100
          },
          {
            criteriaId: 'criteria_003',
            name: 'Security',
            description: 'Authentication, authorization, input validation',
            weight: 20,
            maxScore: 100
          },
          {
            criteriaId: 'criteria_004',
            name: 'Testing',
            description: 'Test coverage, test quality, edge cases',
            weight: 15,
            maxScore: 100
          },
          {
            criteriaId: 'criteria_005',
            name: 'Documentation',
            description: 'API documentation, code comments, README',
            weight: 15,
            maxScore: 100
          }
        ]
      }
    ];

    setAssessmentForms(mockForms);
    setWorkSamples(mockWorkSamples);
  };

  const startAssessment = (formId: string, workSampleId?: string) => {
    const form = assessmentForms.find(f => f.formId === formId);
    if (!form) return;

    const newAssessment: Assessment = {
      assessmentId: `assessment_${Date.now()}`,
      formId,
      evaluatorId: 'current_user', // Would come from auth context
      responses: [],
      overallScore: 0,
      isBlind: blindModeEnabled
    };

    setCurrentAssessment(newAssessment);
    setCurrentStep(0);
  };

  const handleResponseChange = (questionId: string, value: any, comments?: string) => {
    if (!currentAssessment) return;

    const updatedResponses = currentAssessment.responses.filter(r => r.questionId !== questionId);
    updatedResponses.push({
      questionId,
      value,
      comments,
      score: calculateQuestionScore(questionId, value)
    });

    setCurrentAssessment({
      ...currentAssessment,
      responses: updatedResponses
    });
  };

  const calculateQuestionScore = (questionId: string, value: any): number => {
    const form = assessmentForms.find(f => f.formId === currentAssessment?.formId);
    if (!form) return 0;

    for (const section of form.sections) {
      const question = section.questions.find(q => q.questionId === questionId);
      if (question) {
        switch (question.type) {
          case 'rating':
            return ((value - (question.minValue || 1)) / ((question.maxValue || 5) - (question.minValue || 1))) * 100;
          case 'boolean':
            return value ? 100 : 0;
          case 'multiple_choice':
            const optionIndex = question.options?.indexOf(value) || 0;
            return ((question.options?.length || 1) - optionIndex - 1) / ((question.options?.length || 1) - 1) * 100;
          case 'slider':
            return ((value - (question.minValue || 0)) / ((question.maxValue || 100) - (question.minValue || 0))) * 100;
          default:
            return 0;
        }
      }
    }
    return 0;
  };

  const completeAssessment = () => {
    if (!currentAssessment) return;

    const form = assessmentForms.find(f => f.formId === currentAssessment.formId);
    if (!form) return;

    // Calculate overall score
    let totalScore = 0;
    let totalWeight = 0;

    form.sections.forEach(section => {
      section.questions.forEach(question => {
        const response = currentAssessment.responses.find(r => r.questionId === question.questionId);
        if (response && response.score !== undefined) {
          totalScore += response.score * question.weight;
          totalWeight += question.weight;
        }
      });
    });

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    const completedAssessment = {
      ...currentAssessment,
      overallScore,
      completedAt: new Date()
    };

    // Save assessment (in real implementation, would call API)
    console.log('Assessment completed:', completedAssessment);
    
    setCurrentAssessment(null);
    setCurrentStep(0);
  };

  const renderQuestion = (question: AssessmentQuestion, sectionIndex: number, questionIndex: number) => {
    const response = currentAssessment?.responses.find(r => r.questionId === question.questionId);
    const value = response?.value;

    return (
      <Card key={question.questionId} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {question.question}
            {question.required && <span style={{ color: 'red' }}> *</span>}
          </Typography>
          
          {question.description && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {question.description}
            </Typography>
          )}

          {question.type === 'rating' && (
            <Box>
              <Rating
                value={value || 0}
                onChange={(_, newValue) => handleResponseChange(question.questionId, newValue)}
                max={question.maxValue || 5}
                size="large"
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {question.minValue || 1} - {question.maxValue || 5}
              </Typography>
            </Box>
          )}

          {question.type === 'multiple_choice' && (
            <FormControl component="fieldset">
              <RadioGroup
                value={value || ''}
                onChange={(e) => handleResponseChange(question.questionId, e.target.value)}
              >
                {question.options?.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'boolean' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={value || false}
                  onChange={(e) => handleResponseChange(question.questionId, e.target.checked)}
                />
              }
              label="Yes"
            />
          )}

          {question.type === 'slider' && (
            <Box sx={{ px: 2 }}>
              <Slider
                value={value || question.minValue || 0}
                onChange={(_, newValue) => handleResponseChange(question.questionId, newValue)}
                min={question.minValue || 0}
                max={question.maxValue || 100}
                valueLabelDisplay="auto"
                marks={[
                  { value: question.minValue || 0, label: `${question.minValue || 0}` },
                  { value: question.maxValue || 100, label: `${question.maxValue || 100}` }
                ]}
              />
            </Box>
          )}

          {question.type === 'text' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={value || ''}
              onChange={(e) => handleResponseChange(question.questionId, e.target.value)}
              placeholder="Enter your response..."
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Additional Comments (Optional)"
            value={response?.comments || ''}
            onChange={(e) => handleResponseChange(question.questionId, value, e.target.value)}
            sx={{ mt: 2 }}
          />
        </CardContent>
      </Card>
    );
  };

  const renderWorkSampleEvaluation = (workSample: WorkSample) => {
    return (
      <Box>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {workSample.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {workSample.description}
            </Typography>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Instructions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {workSample.instructions}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Submitted Work (Anonymized)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {workSample.anonymizedContent}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
          Evaluation Criteria
        </Typography>
        
        {workSample.evaluationCriteria.map((criteria) => (
          <Card key={criteria.criteriaId} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{criteria.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {criteria.description}
                  </Typography>
                </Box>
                <Chip label={`Weight: ${criteria.weight}%`} variant="outlined" />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Score (0-{criteria.maxScore})
                </Typography>
                <Slider
                  defaultValue={0}
                  min={0}
                  max={criteria.maxScore}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0' },
                    { value: criteria.maxScore / 2, label: `${criteria.maxScore / 2}` },
                    { value: criteria.maxScore, label: `${criteria.maxScore}` }
                  ]}
                />
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Detailed Feedback"
                placeholder="Provide specific feedback for this criteria..."
              />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };  re
turn (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Assessment & Evaluation Tools
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={blindModeEnabled}
                onChange={(e) => setBlindModeEnabled(e.target.checked)}
                icon={<VisibilityIcon />}
                checkedIcon={<VisibilityOffIcon />}
              />
            }
            label="Blind Assessment Mode"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormBuilderOpen(true)}
          >
            Create Assessment Form
          </Button>
        </Box>
      </Box>

      {blindModeEnabled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Blind assessment mode is enabled. Candidate identifying information will be hidden during evaluation.
          </Typography>
        </Alert>
      )}

      {/* Assessment in Progress */}
      {currentAssessment && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Assessment in Progress
            </Typography>
            
            {(() => {
              const form = assessmentForms.find(f => f.formId === currentAssessment.formId);
              if (!form) return null;

              return (
                <Stepper activeStep={currentStep} orientation="vertical">
                  {form.sections.map((section, sectionIndex) => (
                    <Step key={section.sectionId}>
                      <StepLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">{section.title}</Typography>
                          <Chip size="small" label={`${section.weight}%`} variant="outlined" />
                        </Box>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {section.description}
                        </Typography>
                        
                        {section.questions.map((question, questionIndex) => 
                          renderQuestion(question, sectionIndex, questionIndex)
                        )}
                        
                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                          <Button
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep(currentStep - 1)}
                          >
                            Back
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => {
                              if (currentStep === form.sections.length - 1) {
                                completeAssessment();
                              } else {
                                setCurrentStep(currentStep + 1);
                              }
                            }}
                          >
                            {currentStep === form.sections.length - 1 ? 'Complete Assessment' : 'Next'}
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!currentAssessment && (
        <Grid container spacing={3}>
          {/* Assessment Forms */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Structured Assessment Forms
                </Typography>
                
                {assessmentForms.map((form) => (
                  <Card key={form.formId} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6">{form.title}</Typography>
                        {form.isBlindAssessment && (
                          <Chip size="small" label="Blind Assessment" color="primary" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {form.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {form.sections.map((section) => (
                          <Chip
                            key={section.sectionId}
                            size="small"
                            label={`${section.title} (${section.weight}%)`}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                        Created by {form.createdBy} on {form.createdAt.toLocaleDateString()}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => startAssessment(form.formId)}
                        startIcon={<CheckCircleIcon />}
                      >
                        Start Assessment
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Work Sample Evaluations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work Sample Evaluations
                </Typography>
                
                {workSamples.map((sample) => (
                  <Card key={sample.sampleId} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {sample.title}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {sample.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {sample.evaluationCriteria.map((criteria) => (
                          <Chip
                            key={criteria.criteriaId}
                            size="small"
                            label={`${criteria.name} (${criteria.weight}%)`}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                        Submitted on {sample.submittedAt.toLocaleDateString()}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          // In a real implementation, this would open a detailed evaluation view
                          console.log('Evaluating work sample:', sample.sampleId);
                        }}
                      >
                        Evaluate Sample
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sample Work Evaluation Dialog */}
      <Dialog
        open={false} // Would be controlled by state
        onClose={() => {}}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          Work Sample Evaluation
        </DialogTitle>
        <DialogContent>
          {workSamples.length > 0 && renderWorkSampleEvaluation(workSamples[0])}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {}}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />}>
            Save Evaluation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Form Builder Dialog */}
      <Dialog
        open={formBuilderOpen}
        onClose={() => setFormBuilderOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Assessment Form</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Form Title"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Enable Blind Assessment Mode"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="h6" gutterBottom>
              Assessment Sections
            </Typography>
            
            <Alert severity="info">
              Use the form builder to create structured assessment sections with weighted questions.
              This ensures consistent and fair evaluation across all candidates.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormBuilderOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Form</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlindAssessmentTools;