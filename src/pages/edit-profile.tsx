import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import AvatarEditor from 'react-avatar-editor'
import { Globe, Link as LinkIcon } from 'lucide-react'

export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [scale, setScale] = useState(1)
  const editorRef = useRef<AvatarEditor | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const updates = {
        username: formData.get('username') as string,
        full_name: formData.get('fullName') as string,
        bio: formData.get('bio') as string,
        website_url: formData.get('websiteUrl') as string,
        social_url_1: formData.get('socialUrl1') as string,
        social_url_2: formData.get('socialUrl2') as string,
        updated_at: new Date().toISOString(),
      }

      // Handle avatar upload if image exists
      if (image && editorRef.current) {
        const canvas = editorRef.current.getImageScaledToCanvas()
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve as BlobCallback))
        const fileName = `${user?.id}-${Date.now()}.png`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        updates.avatar_url = publicUrl
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id)

      if (error) throw error

      // Refresh the profile in the context
      await refreshProfile()

      toast({
        title: 'Success',
        description: 'Your profile has been updated.',
      })

      navigate('/profile')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.[0]) {
      setImage(event.target.files[0])
    }
  }

  if (!user || !profile) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex flex-col items-center space-y-4">
              {image ? (
                <>
                  <AvatarEditor
                    ref={editorRef}
                    image={image}
                    width={250}
                    height={250}
                    border={50}
                    borderRadius={125}
                    color={[255, 255, 255, 0.6]}
                    scale={scale}
                    rotate={0}
                  />
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full max-w-xs"
                  />
                </>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="max-w-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={profile.username}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile.full_name || ''}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={profile.bio || ''}
              className="w-full mt-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Website URL */}
          <div>
            <Label htmlFor="websiteUrl" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website URL
            </Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://example.com"
              defaultValue={profile.website_url || ''}
              className="mt-1"
            />
          </div>

          {/* Social Media Links */}
          <div>
            <Label htmlFor="socialUrl1" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Social Media Link 1
            </Label>
            <Input
              id="socialUrl1"
              name="socialUrl1"
              type="url"
              placeholder="https://twitter.com/username"
              defaultValue={profile.social_url_1 || ''}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="socialUrl2" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Social Media Link 2
            </Label>
            <Input
              id="socialUrl2"
              name="socialUrl2"
              type="url"
              placeholder="https://instagram.com/username"
              defaultValue={profile.social_url_2 || ''}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}