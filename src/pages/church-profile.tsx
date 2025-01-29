import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Church, Users, ScrollText, MapPin } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import SermonFeed from '@/components/sermon-feed'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type ChurchProfile = Database['public']['Tables']['churches']['Row'] & {
  _count?: {
    members: number
    sermons: number
  }
}

type ChurchDetails = {
  description: string
  location: {
    city: string
    state: string
    zipCode: string
  }
}

export default function ChurchProfilePage() {
  const { churchId } = useParams()
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [church, setChurch] = useState<ChurchProfile | null>(null)
  const [churchDetails, setChurchDetails] = useState<ChurchDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (churchId) {
      fetchChurchProfile()
    }
  }, [churchId])

  useEffect(() => {
    if (profile && church) {
      setIsMember(profile.church_id === church.id)
    }
  }, [profile, church])

  async function fetchChurchProfile() {
    if (!churchId) return

    try {
      // Get church details
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .select('*')
        .eq('id', churchId)
        .single()

      if (churchError) throw churchError

      // Parse church description JSON
      try {
        const details = JSON.parse(churchData.description)
        setChurchDetails(details)
      } catch (error) {
        console.error('Error parsing church details:', error)
        setChurchDetails({
          description: churchData.description,
          location: { city: '', state: '', zipCode: '' }
        })
      }

      // Get member count
      const { count: memberCount, error: memberError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)

      if (memberError) throw memberError

      // Get sermon count
      const { count: sermonCount, error: sermonError } = await supabase
        .from('sermon_notes')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)

      if (sermonError) throw sermonError

      setChurch({
        ...churchData,
        _count: {
          members: memberCount || 0,
          sermons: sermonCount || 0,
        },
      })
    } catch (error) {
      console.error('Error fetching church profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load church profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleMembership() {
    if (!user || !church) return

    setIsProcessing(true)

    try {
      if (isMember) {
        // Leave church
        const { error } = await supabase
          .from('profiles')
          .update({ church_id: null })
          .eq('id', user.id)

        if (error) throw error

        toast({
          title: 'Success',
          description: `You have left ${church.name}`,
        })
      } else {
        // Join church
        const { error } = await supabase
          .from('profiles')
          .update({ church_id: church.id })
          .eq('id', user.id)

        if (error) throw error

        toast({
          title: 'Success',
          description: `You are now a member of ${church.name}`,
        })
      }

      // Refresh profile to update UI
      await refreshProfile()
      await fetchChurchProfile()
      setIsMember(!isMember)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!church || !churchDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Church not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The church you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Church Header */}
        <div className="card p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {church.image_url ? (
                <img
                  src={church.image_url}
                  alt={church.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Church className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{church.name}</h1>
                
                {/* Church Details */}
                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400 border-l-4 border-primary/20 pl-3">
                  {/* Description */}
                  <div className="mb-2">
                    <p className="text-gray-700 dark:text-gray-300">{churchDetails.description}</p>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {churchDetails.location.city}, {churchDetails.location.state} {churchDetails.location.zipCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {user && !loading && (
              <Button
                variant={isMember ? "outline" : "default"}
                onClick={handleMembership}
                disabled={isProcessing}
                className="ml-4"
              >
                {isProcessing ? 'Processing...' : (isMember ? 'Leave Church' : 'Join Church')}
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-center space-x-8 text-sm">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">{church._count?.members}</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">Members</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">{church._count?.sermons}</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">Sermon Notes</span>
            </div>
          </div>
        </div>

        {/* Sermon Notes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Church Sermon Notes</h2>
          <SermonFeed churchId={church.id} />
        </div>
      </div>
    </DashboardLayout>
  )
}