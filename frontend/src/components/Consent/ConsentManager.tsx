import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { consentService } from '@/services/consentService';
import { useAuth } from '@/hooks/useAuth';

interface ConsentType {
  type: string;
  displayName: string;
  description: string;
  required: boolean;
}

interface ConsentRecord {
  id: string;
  consentType: string;
  granted: boolean;
  purpose: string;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  version: string;
}

const ConsentManager: React.FC = () => {
  const { user } = useAuth();
  const [consentTypes, setConsentTypes] = useState<ConsentType[]>([]);
  const [userConsents, setUserConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    consentType: string;
    reason: string;
  }>({
    open: false,
    consentType: '',
    reason: '',
  });

  useEffect(() => {
    if (user) {
      loadConsentData();
    }
  }, [user]);

  const loadConsentData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const [types, consents] = await Promise.all([
        consentService.getConsentTypes(),
        consentService.getUserConsents(user!.id),
      ]);

      setConsentTypes(types);
      setUserConsents(consents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consent data');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (
    consentType: string,
    granted: boolean
  ): Promise<void> => {
    try {
      setUpdating(consentType);
      setError(null);

      if (granted) {
        // Grant consent
        await consentService.recordConsent({
          consentType,
          granted: true,
          purpose: getConsentPurpose(consentType),
          dataTypes: getDataTypes(consentType),
          retentionPeriod: getRetentionPeriod(consentType),
        });
      } else {
        // Show revoke dialog for non-required consents
        const consentTypeInfo = consentTypes.find(ct => ct.type === consentType);
        if (!consentTypeInfo?.required) {
          setRevokeDialog({
            open: true,
            consentType,
            reason: '',
          });
          return;
        } else {
          // Cannot revoke required consent
          setError('This consent is required and cannot be revoked');
          return;
        }
      }

      // Reload consent data
      await loadConsentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update consent');
    } finally {
      setUpdating(null);
    }
  };

  const handleRevokeConsent = async (): Promise<void> => {
    try {
      setUpdating(revokeDialog.consentType);
      
      await consentService.revokeConsent(
        user!.id,
        revokeDialog.consentType,
        revokeDialog.reason
      );

      setRevokeDialog({ open: false, consentType: '', reason: '' });
      await loadConsentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke consent');
    } finally {
      setUpdating(null);
    }
  };

  const getConsentStatus = (consentType: string): {
    granted: boolean;
    record?: ConsentRecord;
  } => {
    const record = userConsents.find(c => c.consentType === consentType);
    return {
      granted: record?.granted || false,
      record,
    };
  };

  const getConsentPurpose = (consentType: string): string => {
    const purposes: Record<string, string> = {
      data_processing: 'Process personal data for recruitment purposes',
      ai_analysis: 'Use AI for resume analysis and candidate matching',
      profile_sharing: 'Share profile with potential employers',
      marketing: 'Send marketing communications and updates',
      analytics: 'Use data for analytics and platform improvement',
      third_party_sharing: 'Share data with third-party services',
    };
    return purposes[consentType] || 'General data processing';
  };

  const getDataTypes = (consentType: string): string[] => {
    const dataTypes: Record<string, string[]> = {
      data_processing: ['profile', 'contact_info', 'resume'],
      ai_analysis: ['resume', 'skills', 'experience'],
      profile_sharing: ['profile', 'resume', 'contact_info'],
      marketing: ['email', 'preferences'],
      analytics: ['usage_data', 'interactions'],
      third_party_sharing: ['profile', 'contact_info'],
    };
    return dataTypes[consentType] || ['general'];
  };

  const getRetentionPeriod = (consentType: string): number => {
    const periods: Record<string, number> = {
      data_processing: 1095, // 3 years
      ai_analysis: 1095,
      profile_sharing: 365, // 1 year
      marketing: 730, // 2 years
      analytics: 1095,
      third_party_sharing: 365,
    };
    return periods[consentType] || 365;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expiresAt?: string): boolean => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography>Loading consent information...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Consent Management
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage your data processing consents. You have full control over how your data is used.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {consentTypes.map((consentType) => {
          const status = getConsentStatus(consentType.type);
          const isUpdating = updating === consentType.type;

          return (
            <Grid item xs={12} md={6} key={consentType.type}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {consentType.displayName}
                        {consentType.required && (
                          <Chip
                            label="Required"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {consentType.description}
                      </Typography>
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={status.granted}
                          onChange={(e) => handleConsentChange(consentType.type, e.target.checked)}
                          disabled={isUpdating || (consentType.required && status.granted)}
                        />
                      }
                      label=""
                      sx={{ ml: 2 }}
                    />
                  </Box>

                  {status.record && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Status"
                            secondary={
                              <Chip
                                label={status.granted ? 'Granted' : 'Revoked'}
                                color={status.granted ? 'success' : 'default'}
                                size="small"
                              />
                            }
                          />
                        </ListItem>
                        
                        {status.record.grantedAt && (
                          <ListItem>
                            <ListItemText
                              primary="Granted"
                              secondary={formatDate(status.record.grantedAt)}
                            />
                          </ListItem>
                        )}
                        
                        {status.record.expiresAt && (
                          <ListItem>
                            <ListItemText
                              primary="Expires"
                              secondary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <span>{formatDate(status.record.expiresAt)}</span>
                                  {isExpiringSoon(status.record.expiresAt) && (
                                    <Chip
                                      label="Expiring Soon"
                                      color="warning"
                                      size="small"
                                    />
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        
                        <ListItem>
                          <ListItemText
                            primary="Version"
                            secondary={status.record.version}
                          />
                        </ListItem>
                      </List>
                    </Box>
                  )}

                  {isUpdating && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <LoadingButton loading variant="outlined" size="small">
                        Updating...
                      </LoadingButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Revoke Consent Dialog */}
      <Dialog
        open={revokeDialog.open}
        onClose={() => setRevokeDialog({ open: false, consentType: '', reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Revoke Consent</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            You are about to revoke consent for{' '}
            {consentTypes.find(ct => ct.type === revokeDialog.consentType)?.displayName}.
            This will stop the processing of your data for this purpose.
          </Typography>
          
          <TextField
            fullWidth
            label="Reason for revoking (optional)"
            multiline
            rows={3}
            value={revokeDialog.reason}
            onChange={(e) => setRevokeDialog(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Please provide a reason for revoking this consent..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRevokeDialog({ open: false, consentType: '', reason: '' })}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleRevokeConsent}
            loading={updating === revokeDialog.consentType}
            color="error"
            variant="contained"
          >
            Revoke Consent
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsentManager;