import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { AlertTriangle } from 'lucide-react'

export default function AccountSettings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFinalConfirm, setShowFinalConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteAccount() {
    if (!user) return

    setIsDeleting(true)

    try {
      // Call the delete_user function
      const { error: deleteError } = await supabase.rpc('delete_user')

      if (deleteError) throw deleteError

      // Sign out the user
      await signOut()
      
      toast({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted.',
      })
      
      navigate('/')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setShowFinalConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">Delete Account</h3>
        <div className="prose dark:prose-invert">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </Button>
      </div>

      {/* First Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Delete Account</h3>
            </div>
            <div className="text-gray-600 dark:text-gray-300 mb-6">
              <p className="mb-2">Are you sure you want to delete your account? This action will:</p>
              <div className="space-y-1">
                <p>• Permanently delete your account</p>
                <p>• Delete all your sermon notes</p>
                <p>• Remove all your follows and followers</p>
                <p>• Delete all your notifications</p>
                {profile?.church_id && (
                  <p className="text-red-500">• Delete your church organization and all associated data</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setShowFinalConfirm(true)
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirmation Dialog */}
      {showFinalConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Final Confirmation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This action is permanent and cannot be undone. Your account will be completely deleted and you will not be able to log in again. Are you absolutely sure?
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowFinalConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}