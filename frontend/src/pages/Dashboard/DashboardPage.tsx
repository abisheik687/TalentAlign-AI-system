import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to TalentAlign AI
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Hello, {user?.firstName} {user?.lastName}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Role: {user?.role}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: {user?.email}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="body1">
        This is the main dashboard. More features will be added as we implement the remaining tasks.
      </Typography>
    </Box>
  );
};

export default DashboardPage;