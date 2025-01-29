import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'
import SignUpPage from '@/pages/signup'
import ResetPasswordPage from '@/pages/reset-password'
import UpdatePasswordPage from '@/pages/update-password'
import DashboardPage from '@/pages/dashboard'
import ProfilePage from '@/pages/profile'
import UserProfilePage from '@/pages/user-profile'
import EditProfilePage from '@/pages/edit-profile'
import CreateSermonPage from '@/pages/create-sermon'
import SermonPage from '@/pages/sermon'
import FeedPage from '@/pages/feed'
import ChurchProfilePage from '@/pages/church-profile'
import { AuthProvider } from '@/contexts/auth-context'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/sermon/new" element={<CreateSermonPage />} />
            <Route path="/sermon/:sermonId" element={<SermonPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/church/:churchId" element={<ChurchProfilePage />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App