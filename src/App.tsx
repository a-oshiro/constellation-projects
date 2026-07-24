import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MainLayout } from './components/layout/MainLayout';
import { SnackbarProvider } from './context/SnackbarContext';
import { ProgressIndicatorProvider } from './context/ProgressIndicatorContext';
import { ProgressIndicator } from './components/ui/ProgressIndicator';
import { TestWidgetProvider } from './context/TestWidgetContext';
import { TestWidget } from './components/ui/TestWidget';
import { ProjectOverviewPage } from './pages/projectOverview';
import { OffersPage } from './pages/OffersPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ThemeAndLogosPage } from './pages/ThemeAndLogosPage';
import { ReviewPage } from './pages/ReviewPage';
import { ApprovedPage } from './pages/ApprovedPage';
import { AdsPage } from './pages/AdsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ClientSettingsPage } from './pages/ClientSettingsPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';

const theme = createTheme({
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
  palette: {
    primary: {
      main: '#473bab',
      dark: '#3d3396',
      light: '#6356e1',
    },
    background: {
      default: '#f0f2f4',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <TestWidgetProvider>
      {/* TestWidget sits outside the app so overlays/snackbars can't render above it */}
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <TestWidget />
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ProjectProvider>
            <BrowserRouter>
            <SnackbarProvider>
            <ProgressIndicatorProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/projects" replace />} />
                  <Route path="/projects" element={<ProjectOverviewPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/theme-and-logos" element={<ThemeAndLogosPage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/approved" element={<ApprovedPage />} />
                  <Route path="/ads" element={<AdsPage />} />
                  <Route path="/campaigns" element={<CampaignsPage />} />
                  <Route path="/settings" element={<Navigate to="/settings/accounts" replace />} />
                  <Route path="/settings/accounts/:accountId" element={<AccountSettingsPage />} />
                  <Route path="/settings/accounts/:accountId/:tabId" element={<AccountSettingsPage />} />
                  <Route path="/settings/:tabId" element={<ClientSettingsPage />} />
                </Routes>
              </MainLayout>
              <ProgressIndicator />
            </ProgressIndicatorProvider>
            </SnackbarProvider>
            </BrowserRouter>
            </ProjectProvider>
          </ThemeProvider>
        </div>
      </div>
    </TestWidgetProvider>
  );
}

export default App;
