import { useState, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import AvatarEditor from 'react-avatar-editor'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isChurchAdmin, setIsChurchAdmin] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [scale, setScale] = useState(1)
  const editorRef = useRef<AvatarEditor | null>(null)

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return false
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return false
    }
    setPasswordError("")
    return true
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.[0]) {
      setImage(event.target.files[0])
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    if (!validatePasswords()) {
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get("email") as string
      const username = formData.get("username") as string
      const fullName = formData.get("fullName") as string

      // First create the user account
      const { error: signUpError, data: { user } } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      // Handle avatar upload if image exists
      let avatarUrl = null
      if (image && editorRef.current && user) {
        const canvas = editorRef.current.getImageScaledToCanvas()
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve as BlobCallback))
        const fileName = `${user.id}-${Date.now()}.png`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
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

        avatarUrl = publicUrl
      }

      let churchId = null

      // If user is registering as a church admin, create the church
      if (isChurchAdmin && user) {
        const churchName = formData.get("churchName") as string
        const churchDescription = formData.get("churchDescription") as string
        const city = formData.get("churchCity") as string
        const state = formData.get("churchState") as string
        const zipCode = formData.get("churchZipCode") as string

        // Store location info in a structured way within the description
        const fullDescription = JSON.stringify({
          description: churchDescription,
          location: {
            city,
            state,
            zipCode
          }
        })

        // Create the church
        const { data: churchData, error: churchError } = await supabase
          .from('churches')
          .insert([
            {
              name: churchName,
              description: fullDescription,
            }
          ])
          .select()
          .single()

        if (churchError) throw churchError
        churchId = churchData.id
      }

      // Create or update profile with avatar URL and church ID if applicable
      const profileData = {
        id: user.id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        church_id: churchId,
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (profileError) throw profileError

      toast({
        title: "Success",
        description: "Please check your email to confirm your account.",
      })

      navigate("/login")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <ScrollText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <button
            type="button"
            onClick={() => setIsChurchAdmin(false)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !isChurchAdmin
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setIsChurchAdmin(true)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isChurchAdmin
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            Church Admin
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex flex-col items-center space-y-4">
                {image ? (
                  <>
                    <AvatarEditor
                      ref={editorRef}
                      image={image}
                      width={200}
                      height={200}
                      border={50}
                      borderRadius={100}
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
                  <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-400">Add a photo</span>
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
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="fullName">
                {isChurchAdmin ? "Admin Full Name" : "Full Name"}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="mt-1"
              />
            </div>

            {isChurchAdmin && (
              <>
                <div>
                  <Label htmlFor="churchName">Church name</Label>
                  <Input
                    id="churchName"
                    name="churchName"
                    type="text"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="churchDescription">Church description</Label>
                  <Input
                    id="churchDescription"
                    name="churchDescription"
                    type="text"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="churchCity">City</Label>
                    <Input
                      id="churchCity"
                      name="churchCity"
                      type="text"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="churchState">State</Label>
                    <Input
                      id="churchState"
                      name="churchState"
                      type="text"
                      required
                      className="mt-1"
                      maxLength={2}
                      placeholder="CA"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="churchZipCode">ZIP Code</Label>
                  <Input
                    id="churchZipCode"
                    name="churchZipCode"
                    type="text"
                    required
                    className="mt-1"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    placeholder="12345"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validatePasswords}
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={validatePasswords}
                minLength={6}
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !!passwordError}>
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
      </div>
    </div>
  )
}