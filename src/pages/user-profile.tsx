import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { User, Users, Church, ScrollText } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import SermonFeed from '@/components/sermon-feed'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  churches?: {
    name: string
  } | null
}

type Stats = {
  sermonCount: number
  followerCount: number
  followingCount: number
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    sermonCount: 0,
    followerCount: 0,
    followingCount: 0,
  })
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchProfile()
      fetchStats()
      checkFollowStatus()
    }
  }, [userId])

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          churches (
            name
          )
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      // Get sermon count
      const { count: sermonCount } = await supabase
        .from('sermon_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('privacy', 'public')

      // Get follower count
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      setStats({
        sermonCount: sermonCount || 0,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function checkFollowStatus() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle()

      if (error) throw error
      setIsFollowing(!!data)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  async function handleFollow() {
    if (!user || !userId) return

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)

        if (error) throw error
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          })

        if (error) throw error
      }

      setIsFollowing(!isFollowing)
      fetchStats()
    } catch (error) {
      console.error('Error updating follow status:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The user you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    )
  }

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
                {profile.churches && (
                  <div className="mt-2 flex items-center text-gray-600 dark:text-gray-400">
                    <Church className="h-4 w-4 mr-1" />
                    <Link to={`/church/${profile.church_id}`} className="hover:text-blue-600">
                      {profile.churches.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
            {user && user.id !== userId && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-center space-x-8 text-sm">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.sermonCount}</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">Sermon Notes</span>
            </div>
            <Link to={`/profile/${userId}/followers`} className="hover:text-blue-600">
              <span className="font-semibold text-gray-900 dark:text-white">{stats.followerCount}</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">Followers</span>
            </Link>
            <Link to={`/profile/${userId}/following`} className="hover:text-blue-600">
              <span className="font-semibold text-gray-900 dark:text-white">{stats.followingCount}</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">Following</span>
            </Link>
          </div>
        </div>

        {/* Sermon Notes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Sermon Notes</h2>
          <SermonFeed userId={userId} />
        </div>
      </div>
    </DashboardLayout>
  )
}