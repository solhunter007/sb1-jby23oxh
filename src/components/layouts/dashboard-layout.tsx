import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Bell, User, LogOut, ScrollText } from 'lucide-react'
import SearchBar from '@/components/search-bar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-100/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => navigate('/feed')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
              >
                <ScrollText className="h-12 w-12 text-primary group-hover:animate-float" />
                <span className="logo-text text-4xl">Sermon Buddy</span>
              </button>
              
              <SearchBar />
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="animate-glow">
                <Bell className="h-5 w-5" />
              </Button>
              <Button asChild variant="ghost" className="hover:animate-heavenly-glow">
                <Link to="/profile" className="flex items-center space-x-2">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span>{profile?.username}</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}