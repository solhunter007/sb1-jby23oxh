import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Edit3, Users, Bell, Search, Settings, ChevronRight } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import SermonFeed from '@/components/sermon-feed'
import NotificationsPanel from '@/components/notifications-panel'
import { supabase } from '@/lib/supabase'

interface ChurchStats {
  memberCount: number
  recentActivityCount: number
}

interface ChurchDetails {
  name: string
  description: string
  image_url: string | null
}

export default function ChurchDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<ChurchStats>({ memberCount: 0, recentActivityCount: 0 })
  const [churchDetails, setChurchDetails] = useState<ChurchDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChurchData() {
      if (!profile?.church_id) return

      try {
        // Fetch church details
        const { data: churchData, error: churchError } = await supabase
          .from('churches')
          .select('*')
          .eq('id', profile.church_id)
          .single()

        if (churchError) throw churchError
        setChurchDetails(churchData)

        // Fetch member count
        const { count: memberCount, error: memberError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', profile.church_id)

        if (memberError) throw memberError

        // Fetch recent activity count (last 7 days)
        const { count: activityCount, error: activityError } = await supabase
          .from('sermon_notes')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', profile.church_id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        if (activityError) throw activityError

        setStats({
          memberCount: memberCount || 0,
          recentActivityCount: activityCount || 0,
        })
      } catch (error) {
        console.error('Error fetching church data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChurchData()
  }, [profile?.church_id])

  if (loading || !churchDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {churchDetails.name}!
            </h1>
            <p className="text-blue-100">Let's inspire your members and share God's Word.</p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link to="/sermon/new">
              <Edit3 className="mr-2 h-4 w-4" />
              Post a New Sermon Note
            </Link>
          </Button>
        </div>
      </div>

      {/* Church Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {churchDetails.image_url ? (
                  <img
                    src={churchDetails.image_url}
                    alt={churchDetails.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {churchDetails.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{churchDetails.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{churchDetails.description}</p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/profile/edit">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</h3>
                <p className="text-2xl font-bold mt-1">{stats.memberCount}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Activity</h3>
                <p className="text-2xl font-bold mt-1">{stats.recentActivityCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <NotificationsPanel />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sermon Notes Feed */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Church Sermon Notes</h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/sermons">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <SermonFeed churchId={profile?.church_id} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Member Directory Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Member Directory</h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/members">
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {/* Member list would go here */}
              <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Link
                  to="/members"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  <Users className="mr-2 h-5 w-5" />
                  View All Members
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/sermon/new">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Create Sermon Note
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/members/invite">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Members
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Church Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}