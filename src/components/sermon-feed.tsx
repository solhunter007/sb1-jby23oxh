import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { HandHelping as HandsPraying, MessageSquare, Share2, Trash2, User, Church, Book, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/database.types'
import { useAuth } from '@/contexts/auth-context'

type SermonNote = Database['public']['Tables']['sermon_notes']['Row'] & {
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

type SermonContent = {
  pastorName: string
  churchName: string
  content: string
  bibleVerses?: string[]
}

interface SermonFeedProps {
  userId?: string
  churchId?: string
}

export default function SermonFeed({ userId, churchId }: SermonFeedProps) {
  const [notes, setNotes] = useState<SermonNote[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const isChurchAdmin = Boolean(profile?.church_id)

  useEffect(() => {
    fetchSermonNotes()
  }, [userId, churchId])

  async function fetchSermonNotes() {
    try {
      const query = supabase
        .from('sermon_notes')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (userId) {
        query.eq('user_id', userId)
      } else if (churchId) {
        query.eq('church_id', churchId)
      } else {
        query.eq('privacy', 'public')
      }

      const { data, error } = await query

      if (error) throw error
      setNotes(data as SermonNote[])
    } catch (error) {
      console.error('Error fetching sermon notes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(noteId: string) {
    if (!window.confirm('Are you sure you want to delete this sermon note? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('sermon_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user?.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Sermon note deleted successfully.',
      })

      fetchSermonNotes()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function handleModerate(noteId: string, action: 'approve' | 'remove') {
    if (!isChurchAdmin) return

    try {
      if (action === 'remove') {
        const { error } = await supabase
          .from('sermon_notes')
          .delete()
          .eq('id', noteId)
          .eq('church_id', profile?.church_id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Sermon note removed successfully.',
        })
      }

      fetchSermonNotes()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  function parseSermonContent(content: string): SermonContent {
    try {
      return JSON.parse(content)
    } catch {
      return {
        pastorName: '',
        churchName: '',
        content: content,
        bibleVerses: []
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="card p-6 animate-pulse"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No sermon notes found.</p>
        <Button asChild className="mt-4">
          <Link to="/sermon/new">Create Your First Note</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {notes.map((note) => {
        const parsedContent = parseSermonContent(note.content)
        
        return (
          <div
            key={note.id}
            className="card p-6 group"
          >
            {/* Author Info */}
            <div className="flex items-center justify-between mb-4">
              <Link
                to={`/profile/${note.user_id}`}
                className="flex items-center space-x-3"
              >
                {note.profiles.avatar_url ? (
                  <img
                    src={note.profiles.avatar_url}
                    alt={note.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {note.profiles.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {note.profiles.full_name || note.profiles.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              <div className="flex space-x-2">
                {isChurchAdmin && churchId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleModerate(note.id, 'remove')}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
                {user?.id === note.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(note.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Title and Open Button */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold">{note.title}</h3>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/10"
              >
                <Link to={`/sermon/${note.id}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Notes
                </Link>
              </Button>
            </div>
            
            {/* Sermon Details */}
            <div className="mb-4 space-y-1 text-sm text-gray-600 dark:text-gray-400 border-l-4 border-primary/20 pl-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Pastor: {parsedContent.pastorName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Church className="h-4 w-4" />
                <span>Church: {parsedContent.churchName}</span>
              </div>
              {parsedContent.bibleVerses && parsedContent.bibleVerses.length > 0 && (
                <div className="flex items-start space-x-2">
                  <Book className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div>
                    <span>Key Verses: </span>
                    <span>{parsedContent.bibleVerses.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview of content with hover effect */}
            <Link to={`/sermon/${note.id}`}>
              <div className="relative overflow-hidden rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/80 dark:group-hover:bg-gray-700/80 group-hover:shadow-heavenly-sm">
                <div className="text-gray-600 dark:text-gray-300 line-clamp-3 relative z-10">
                  <div dangerouslySetInnerHTML={{ __html: parsedContent.content }} />
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none" />
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary hover:bg-primary/10">
                <HandsPraying className="h-4 w-4 mr-1" />
                Praise
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary hover:bg-primary/10">
                <MessageSquare className="h-4 w-4 mr-1" />
                Comment
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary hover:bg-primary/10">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}