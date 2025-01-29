import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { ScrollText, Bell, Users, Church, Edit3, TrendingUp as Trending } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import SermonFeed from '@/components/sermon-feed'
import NotificationsPanel from '@/components/notifications-panel'
import TrendingSection from '@/components/trending-section'
import ChurchDashboard from '@/components/church-dashboard'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isChurchAdmin = profile?.id === profile?.church_id // Only true if the user ID matches the church ID

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !profile) return null

  if (isChurchAdmin) {
    return <ChurchDashboard />
  }

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-sm text-white p-8 rounded-3xl mb-8 card heavenly-glow">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile.full_name || profile.username}!
            </h1>
            <p className="text-blue-50">
              Faith grows stronger when shared with others. Share your insights and inspire the community.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg" className="shimmer-animation">
            <Link to="/sermon/new">
              <Edit3 className="mr-2 h-4 w-4" />
              Create New Sermon Note
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* News Feed */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Feed</h2>
            <SermonFeed />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Access */}
          <div className="card">
            <h3 className="font-semibold mb-4 px-6 pt-6">Quick Access</h3>
            <div className="space-y-1 p-2">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/profile">
                  <Users className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </Button>
              {profile.church_id ? (
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to={`/church/${profile.church_id}`}>
                    <Church className="mr-2 h-4 w-4" />
                    My Church
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/explore">
                    <Church className="mr-2 h-4 w-4" />
                    Find a Church
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/explore">
                  <ScrollText className="mr-2 h-4 w-4" />
                  Explore
                </Link>
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <NotificationsPanel />

          {/* Trending Section */}
          <TrendingSection />
        </div>
      </div>
    </DashboardLayout>
  )
}