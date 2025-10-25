import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Slider,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';

/**
 * Collaborative Evaluation Component
 * Real-time collaborative candidate evaluation interface
 * Requirements: 6.4, 6.5, 9.5
 */

interface CollaborativeEvaluationProps {
  sessionId: string;
  candidateId: string;
  jobId: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  scale: { min: number; max: number };
}

interface Participant {
  id: string;
  name: string;
  role: string;
  status: 'invited' | 'active' | 'inactive';
  hasSubmitted: boolean;
  avatar?: string;
}

interface SessionActivity {
  activityId: string;
  type: string;
  participantId: string;
  participantName: string;
  timestamp: Date;
  data: any;
  biasFlags: any[];
}

const CollaborativeEvaluation: React.FC<CollaborativeEvaluationProps> = ({
  sessionId,
  candidateId,
  jobId,
  currentUser
}) => {
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState<'hire' | 'reject' | 'further_review'>('further_review');
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [consensusStatus, setConsensusStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [biasWarnings, setBiasWarnings] = useState<any[]>([]);

  const { socket, isConnected } = useWebSocket();

  // Initialize session
  useEffect(() => {
    if (socket && isConnected) {
      // Join collaboration session
      socket.emit('collaboration:join_session', {
        sessionId,
        sessionType: 'candidate_evaluation'
      });

      // Set up event listeners
      socket.on('collaboration:session_joined', handleSessionJoined);
      socket.on('collaboration:activity_update', handleActivityUpdate);
      socket.on('collaboration:consensus_update', handleConsensusUpdate);
      socket.on('collaboration:participant_update', handleParticipantUpdate);
      socket.on('collaboration:bias_warning', handleBiasWarning);

      return () => {
        socket.off('collaboration:session_joined', handleSessionJoined);
        socket.off('collaboration:activity_update', handleActivityUpdate);
        socket.off('collaboration:consensus_update', handleConsensusUpdate);
        socket.off('collaboration:participant_update', handleParticipantUpdate);
        socket.off('collaboration:bias_warning', handleBiasWarning);
      };
    }
  }, [socket, isConnected, sessionId]);

  const handleSessionJoined = useCallback((data: any) => {
    setSession(data.session);
    setParticipants(data.session.participants);
    setEvaluationCriteria(data.session.evaluationCriteria);
    setActivities(data.session.activities || []);
    setConsensusStatus(data.consensusStatus);
    setLoading(false);

    // Initialize scores
    const initialScores: Record<string, number> = {};
    data.session.evaluationCriteria.forEach((criteria: EvaluationCriteria) => {
      initialScores[criteria.id] = (criteria.scale.min + criteria.scale.max) / 2;
    });
    setScores(initialScores);
  }, []);

  const handleActivityUpdate = useCallback((data: any) => {
    setActivities(prev => [...prev, data.activity]);
    
    // Update participant status if evaluation submitted
    if (data.activity.type === 'evaluation_submitted') {
      setParticipants(prev => prev.map(p => 
        p.id === data.activity.participantId 
          ? { ...p, hasSubmitted: true }
          : p
      ));
    }
  }, []);

  const handleConsensusUpdate = useCallback((data: any) => {
    setConsensusStatus(data.consensusStatus);
  }, []);

  const handleParticipantUpdate = useCallback((data: any) => {
    setParticipants(data.participants);
  }, []);

  const handleBiasWarning = useCallback((data: any) => {
    setBiasWarnings(prev => [...prev, data.warning]);
  }, []);

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: value
    }));

    // Send real-time update
    if (socket) {
      socket.emit('collaboration:update', {
        sessionId,
        updateType: 'score_change',
        updateData: {
          criteriaId,
          value,
          participantId: currentUser.id
        }
      });
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!socket) return;

    setSubmitting(true);
    try {
      const evaluation = {
        scores,
        comments,
        recommendation,
        confidence: calculateConfidence()
      };

      socket.emit('collaboration:submit_evaluation', {
        sessionId,
        participantId: currentUser.id,
        evaluation
      });

      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === currentUser.id 
          ? { ...p, hasSubmitted: true }
          : p
      ));

    } catch (error) {
      console.error('Failed to submit evaluation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateConfidence = (): number => {
    // Calculate confidence based on score consistency and comments
    const scoreValues = Object.values(scores);
    const variance = scoreValues.reduce((sum, score) => {
      const mean = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
      return sum + Math.pow(score - mean, 2);
    }, 0) / scoreValues.length;
    
    const consistencyScore = Math.max(0, 1 - variance / 10);
    const commentScore = comments.length > 50 ? 0.2 : 0;
    
    return Math.min(1, consistencyScore + commentScore);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'hire': return 'success';
      case 'reject': return 'error';
      default: return 'warning';
    }
  };

  const getConsensusProgress = () => {
    if (!consensusStatus) return 0;
    return consensusStatus.progress * 100;
  };

  const hasUserSubmitted = participants.find(p => p.id === currentUser.id)?.hasSubmitted || false;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading collaboration session...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Collaborative Evaluation
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="View Activities">
                <IconButton onClick={() => setShowActivities(true)}>
                  <Badge badgeContent={activities.length} color="primary">
                    <CommentIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Chip
                icon={isConnected ? <CheckCircleIcon /> : <WarningIcon />}
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
              />
            </Box>
          </Box>

          {/* Participants */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <GroupIcon color="primary" />
            <Typography variant="subtitle1">Participants:</Typography>
            <AvatarGroup max={6}>
              {participants.map((participant) => (
                <Tooltip key={participant.id} title={`${participant.name} (${participant.role})`}>
                  <Avatar
                    sx={{
                      bgcolor: participant.hasSubmitted ? 'success.main' : 'grey.400',
                      border: participant.id === currentUser.id ? '2px solid blue' : 'none'
                    }}
                  >
                    {participant.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>

          {/* Consensus Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Consensus Progress</Typography>
              <Typography variant="body2">{Math.round(getConsensusProgress())}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getConsensusProgress()}
              color={consensusStatus?.status === 'reached' ? 'success' : 'primary'}
            />
            {consensusStatus && (
              <Typography variant="caption" color="textSecondary">
                {consensusStatus.message}
              </Typography>
            )}
          </Box>

          {/* Bias Warnings */}
          {biasWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Bias Alert</Typography>
              {biasWarnings.map((warning, index) => (
                <Typography key={index} variant="body2">
                  {warning.description}
                </Typography>
              ))}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Form */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evaluation Criteria
              </Typography>

              {evaluationCriteria.map((criteria) => (
                <Box key={criteria.id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {criteria.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {criteria.description}
                  </Typography>
                  
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={scores[criteria.id] || criteria.scale.min}
                      onChange={(_, value) => handleScoreChange(criteria.id, value as number)}
                      min={criteria.scale.min}
                      max={criteria.scale.max}
                      step={0.5}
                      marks
                      valueLabelDisplay="on"
                      disabled={hasUserSubmitted}
                      sx={{
                        '& .MuiSlider-thumb': {
                          bgcolor: hasUserSubmitted ? 'grey.400' : 'primary.main'
                        }
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption">
                      Min: {criteria.scale.min}
                    </Typography>
                    <Typography variant="caption">
                      Weight: {Math.round(criteria.weight * 100)}%
                    </Typography>
                    <Typography variant="caption">
                      Max: {criteria.scale.max}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 3 }} />

              {/* Comments */}
              <Typography variant="subtitle1" gutterBottom>
                Comments & Feedback
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your thoughts about this candidate..."
                disabled={hasUserSubmitted}
                sx={{ mb: 3 }}
              />

              {/* Recommendation */}
              <Typography variant="subtitle1" gutterBottom>
                Recommendation
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                {(['hire', 'further_review', 'reject'] as const).map((rec) => (
                  <Chip
                    key={rec}
                    label={rec.replace('_', ' ').toUpperCase()}
                    color={recommendation === rec ? getRecommendationColor(rec) as any : 'default'}
                    onClick={() => !hasUserSubmitted && setRecommendation(rec)}
                    variant={recommendation === rec ? 'filled' : 'outlined'}
                    sx={{ cursor: hasUserSubmitted ? 'default' : 'pointer' }}
                  />
                ))}
              </Box>

              {/* Submit Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSubmitEvaluation}
                disabled={hasUserSubmitted || submitting}
                fullWidth
              >
                {hasUserSubmitted ? 'Evaluation Submitted' : 'Submit Evaluation'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Status
              </Typography>

              {/* Participant Status */}
              <List dense>
                {participants.map((participant) => (
                  <ListItem key={participant.id}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: participant.hasSubmitted ? 'success.main' : 'grey.400',
                          width: 32,
                          height: 32
                        }}
                      >
                        {participant.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={participant.name}
                      secondary={`${participant.role} • ${participant.hasSubmitted ? 'Submitted' : 'Pending'}`}
                    />
                    {participant.hasSubmitted && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* Real-time Updates */}
              <Typography variant="subtitle2" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {activities.slice(-5).map((activity) => (
                  <Box key={activity.activityId} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" display="block">
                      <strong>{activity.participantName}</strong> {activity.type.replace('_', ' ')}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activities Dialog */}
      <Dialog
        open={showActivities}
        onClose={() => setShowActivities(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Session Activities</DialogTitle>
        <DialogContent>
          <List>
            {activities.map((activity) => (
              <React.Fragment key={activity.activityId}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      {activity.participantName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${activity.participantName} ${activity.type.replace('_', ' ')}`}
                    secondary={new Date(activity.timestamp).toLocaleString()}
                  />
                  {activity.biasFlags.length > 0 && (
                    <Tooltip title="Bias flags detected">
                      <WarningIcon color="warning" />
                    </Tooltip>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivities(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CollaborativeEvaluation;