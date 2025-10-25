import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Container } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            TalentAlign AI
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Ethical AI-Powered Hiring Platform
          </Typography>
          <Typography variant="body1">
            Welcome to TalentAlign AI - Making hiring fair, transparent, and ethical for everyone.
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;