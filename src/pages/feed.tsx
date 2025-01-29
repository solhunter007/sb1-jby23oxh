import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { ScrollText, Bell, Users, Church, Edit3, TrendingUp } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import SermonFeed from '@/components/sermon-feed'
import NotificationsPanel from '@/components/notifications-panel'
import TrendingSection from '@/components/trending-section'

export default function FeedPage() {
  const { user, profile } = useAuth()

  if (!user || !profile) return null

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to SB Feed
            </h1>
            <p className="text-blue-100">Discover, share, and grow in faith together.</p>
          </div>
          <Button asChild variant="secondary" size="lg">
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
            <h2 className="text-2xl font-semibold mb-4">Latest Sermon Notes</h2>
            <SermonFeed />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Access */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Quick Access</h3>
            <div className="space-y-3">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/profile">
                  <Users className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </Button>
              {profile.church_id ? (
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/dashboard">
                    <Church className="mr-2 h-4 w-4" />
                    Church Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/church">
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