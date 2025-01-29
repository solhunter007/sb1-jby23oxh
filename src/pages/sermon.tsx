import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { HandHelping as HandsPraying, MessageSquare, Share2, User, Church, Book } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

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

type Comment = {
  id: string
  content: string
  created_at: string
  user: {
    username: string
    avatar_url: string | null
  }
}

export default function SermonPage() {
  const { sermonId } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [note, setNote] = useState<SermonNote | null>(null)
  const [parsedContent, setParsedContent] = useState<SermonContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isPraised, setIsPraised] = useState(false)
  const [praiseCount, setPraiseCount] = useState(0)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (sermonId) {
      fetchSermonNote()
      fetchComments()
      checkPraiseStatus()
    }
  }, [sermonId])

  useEffect(() => {
    if (note?.content) {
      try {
        setParsedContent(JSON.parse(note.content))
      } catch (error) {
        console.error('Error parsing sermon content:', error)
        setParsedContent({
          pastorName: '',
          churchName: '',
          content: note.content,
          bibleVerses: []
        })
      }
    }
  }, [note])

  async function fetchSermonNote() {
    try {
      const { data, error } = await supabase
        .from('sermon_notes')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', sermonId)
        .single()

      if (error) throw error
      setNote(data)
    } catch (error) {
      console.error('Error fetching sermon note:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sermon note',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('sermon_comments')
        .select(`
          id,
          content,
          created_at,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('sermon_id', sermonId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          username: comment.profiles.username,
          avatar_url: comment.profiles.avatar_url,
        }
      })))
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  async function checkPraiseStatus() {
    if (!user) return

    try {
      const { data: praises, error } = await supabase
        .from('sermon_praises')
        .select('*')
        .eq('sermon_id', sermonId)

      if (error) throw error

      const userPraise = praises.find(praise => praise.user_id === user.id)
      setIsPraised(!!userPraise)
      setPraiseCount(praises.length)
    } catch (error) {
      console.error('Error checking praise status:', error)
    }
  }

  async function handlePraise() {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to praise this sermon note',
      })
      return
    }

    try {
      if (isPraised) {
        // Remove praise
        const { error } = await supabase
          .from('sermon_praises')
          .delete()
          .eq('sermon_id', sermonId)
          .eq('user_id', user.id)

        if (error) throw error
        setPraiseCount(prev => prev - 1)
      } else {
        // Add praise
        const { error } = await supabase
          .from('sermon_praises')
          .insert({
            sermon_id: sermonId,
            user_id: user.id,
          })

        if (error) throw error
        setPraiseCount(prev => prev + 1)
      }

      setIsPraised(!isPraised)
    } catch (error) {
      console.error('Error updating praise:', error)
      toast({
        title: 'Error',
        description: 'Failed to update praise',
        variant: 'destructive',
      })
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const { error } = await supabase
        .from('sermon_comments')
        .insert({
          sermon_id: sermonId,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      fetchComments()
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      })
    } finally {
      setSubmittingComment(false)
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

  if (!note || !parsedContent) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Sermon note not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The sermon note you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Sermon Note Card */}
        <div className="card p-8 mb-8">
          {/* Author Info */}
          <div className="flex items-center space-x-4 mb-6">
            <Link to={`/profile/${note.user_id}`} className="flex items-center space-x-3">
              {note.profiles.avatar_url ? (
                <img
                  src={note.profiles.avatar_url}
                  alt={note.profiles.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">
                  {note.profiles.full_name || note.profiles.username}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
          
          {/* Sermon Details */}
          <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400 border-l-4 border-primary/20 pl-4">
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

          {/* Main Content */}
          <div className="prose dark:prose-invert max-w-none mb-6">
            <div dangerouslySetInnerHTML={{ __html: parsedContent.content }} />
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePraise}
                className={`text-gray-600 hover:text-primary hover:bg-primary/10 ${
                  isPraised ? 'text-primary bg-primary/10' : ''
                }`}
              >
                <HandsPraying className="h-5 w-5 mr-2" />
                {praiseCount} Praises
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-primary hover:bg-primary/10"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                {comments.length} Comments
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-primary hover:bg-primary/10"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Comments</h2>

          {/* Comment Form */}
          {user && (
            <form onSubmit={handleComment} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 rounded-xl border bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                {comment.user.avatar_url ? (
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{comment.user.username}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}