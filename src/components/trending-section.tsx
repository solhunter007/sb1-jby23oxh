import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { TrendingUp } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Tag = Database['public']['Tables']['tags']['Row'] & {
  _count: number
}

export default function TrendingSection() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendingTags()
  }, [])

  async function fetchTrendingTags() {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_tags')
        .limit(5)

      if (error) throw error
      setTags(data)
    } catch (error) {
      console.error('Error fetching trending tags:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Trending Topics</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold">Trending Topics</h3>
      </div>
      <div className="space-y-3">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            to={`/tags/${tag.name}`}
            className="block p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">#{tag.name}</span>
              <span className="text-xs text-gray-500">{tag._count} notes</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}