import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import RichTextEditor from '@/components/rich-text-editor'

type PrivacyOption = 'public' | 'private' | 'church'

export default function CreateSermonPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState<FormData | null>(null)
  const [bibleVerses, setBibleVerses] = useState<string[]>([])
  const [verseInput, setVerseInput] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormData(new FormData(event.currentTarget))
    setShowConfirmation(true)
  }

  async function handleConfirm() {
    if (!user || !formData) return

    setIsLoading(true)

    try {
      const title = formData.get('title') as string
      const pastorName = formData.get('pastorName') as string
      const churchName = formData.get('churchName') as string
      const privacy = formData.get('privacy') as PrivacyOption

      // Create the sermon note
      const { data: sermonNote, error: sermonError } = await supabase
        .from('sermon_notes')
        .insert([
          {
            user_id: user.id,
            title,
            content: JSON.stringify({
              pastorName,
              churchName,
              content,
              bibleVerses, // Add bible verses to the content
            }),
            privacy,
            church_id: profile?.church_id || null,
          },
        ])
        .select()
        .single()

      if (sermonError) throw sermonError

      // Create and associate tags
      if (tags.length > 0) {
        // First, ensure all tags exist
        const { data: existingTags, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tags)

        if (tagsError) throw tagsError

        const existingTagNames = new Set(existingTags.map(t => t.name))
        const newTags = tags.filter(tag => !existingTagNames.has(tag))

        // Create new tags
        if (newTags.length > 0) {
          const { error: createTagsError } = await supabase
            .from('tags')
            .insert(newTags.map(name => ({ name })))

          if (createTagsError) throw createTagsError
        }

        // Get all tag IDs (both existing and newly created)
        const { data: allTags, error: allTagsError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tags)

        if (allTagsError) throw allTagsError

        // Create sermon_tags associations
        const { error: sermonTagsError } = await supabase
          .from('sermon_tags')
          .insert(
            allTags.map(tag => ({
              sermon_id: sermonNote.id,
              tag_id: tag.id,
            }))
          )

        if (sermonTagsError) throw sermonTagsError
      }

      toast({
        title: 'Success',
        description: 'Your sermon note has been created.',
      })

      navigate('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setShowConfirmation(false)
    }
  }

  function handleTagInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag])
        setTagInput('')
      }
    }
  }

  function handleVerseInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newVerse = verseInput.trim()
      if (newVerse && !bibleVerses.includes(newVerse)) {
        setBibleVerses([...bibleVerses, newVerse])
        setVerseInput('')
      }
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  function removeVerse(verseToRemove: string) {
    setBibleVerses(bibleVerses.filter(verse => verse !== verseToRemove))
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Create Your Sermon Note</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Sermon Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter the title of the sermon"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pastorName">Pastor's Name</Label>
                <Input
                  id="pastorName"
                  name="pastorName"
                  placeholder="Enter the pastor's name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="churchName">Church Name</Label>
                <Input
                  id="churchName"
                  name="churchName"
                  placeholder="Enter the name of the church"
                  defaultValue={profile?.church_id ? 'Your Church Name' : ''}
                  className="mt-1"
                />
              </div>

              {/* Key Bible Verses */}
              <div className="space-y-2">
                <Label>Key Bible Verses</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {bibleVerses.map(verse => (
                    <span
                      key={verse}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    >
                      {verse}
                      <button
                        type="button"
                        onClick={() => removeVerse(verse)}
                        className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  value={verseInput}
                  onChange={e => setVerseInput(e.target.value)}
                  onKeyDown={handleVerseInput}
                  placeholder="Add bible verses (e.g., 'John 3:16' - press Enter or comma to add)"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <Label>Sermon Notes</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Type or paste your sermon notes here..."
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Add tags (press Enter or comma to add)"
                className="mt-1"
              />
            </div>

            {/* Privacy Options */}
            <div className="space-y-2">
              <Label>Privacy Settings</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    defaultChecked
                    className="form-radio"
                  />
                  <span>Share Publicly</span>
                  {profile?.church_id && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Also shared with your church)
                    </span>
                  )}
                </label>
                {profile?.church_id && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="privacy"
                      value="church"
                      className="form-radio"
                    />
                    <span>Share with My Church Only</span>
                  </label>
                )}
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    className="form-radio"
                  />
                  <span>Private</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirm Post</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to post this sermon note? 
                {profile?.church_id && formData?.get('privacy') === 'public' && (
                  <span className="block mt-2 text-sm">
                    This note will also be shared with your church's feed.
                  </span>
                )}
              </p>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? 'Posting...' : 'Post Note'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}