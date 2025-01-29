import { ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8">
            <ScrollText className="h-20 w-20 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Welcome to Sermon Buddy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl">
            Your personal companion for creating, organizing, and sharing sermon notes
            with your church community.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Take Notes</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Capture and organize your sermon notes with our intuitive editor.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Connect</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Join your church community and share insights with fellow members.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Grow Together</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Follow other members and learn from their spiritual journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}