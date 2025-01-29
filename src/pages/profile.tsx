import { useAuth } from '@/contexts/auth-context'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Edit2, User, Settings, Globe, Link as LinkIcon } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import SermonFeed from '@/components/sermon-feed'
import AccountSettings from '@/components/account-settings'
import { useState } from 'react'

export default function ProfilePage() {
  const { profile } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const isChurchAdmin = profile?.id === profile?.church_id

  if (!profile) return null

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
                <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>
                )}
                {profile.church_id && !isChurchAdmin && profile.churches && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Member of <Link to={`/church/${profile.church_id}`} className="text-blue-600 hover:underline">{profile.churches.name}</Link>
                  </p>
                )}
                
                {/* Social Links */}
                <div className="mt-4 space-y-2">
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {new URL(profile.website_url).hostname}
                    </a>
                  )}
                  {profile.social_url_1 && (
                    <a
                      href={profile.social_url_1}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {new URL(profile.social_url_1).hostname}
                    </a>
                  )}
                  {profile.social_url_2 && (
                    <a
                      href={profile.social_url_2}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {new URL(profile.social_url_2).hostname}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button asChild variant="outline">
                <Link to="/profile/edit">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-8">
            <AccountSettings />
          </div>
        )}

        {/* Sermon Notes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Sermon Notes</h2>
          <SermonFeed userId={profile.id} />
        </div>
      </div>
    </DashboardLayout>
  )
}