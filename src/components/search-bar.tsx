import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, Church, ScrollText, X, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'

type SearchResult = {
  type: 'user' | 'church' | 'sermon'
  id: string
  title: string
  subtitle?: string
  avatar_url?: string | null
  details?: {
    description: string
    location: {
      city: string
      state: string
      zipCode: string
    }
  }
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      setIsOpen(true)

      try {
        const searchTerm = `%${debouncedQuery}%`

        // Search users
        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
          .limit(3)

        // Search churches
        const { data: churches } = await supabase
          .from('churches')
          .select('id, name, description, image_url')
          .ilike('name', searchTerm)
          .limit(3)

        // Search sermon notes
        const { data: sermons } = await supabase
          .from('sermon_notes')
          .select('id, title, content, profiles!inner(username)')
          .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .eq('privacy', 'public')
          .limit(3)

        const combinedResults: SearchResult[] = [
          ...(users?.map(user => ({
            type: 'user' as const,
            id: user.id,
            title: user.full_name || user.username,
            subtitle: `@${user.username}`,
            avatar_url: user.avatar_url
          })) || []),
          ...(churches?.map(church => {
            let details;
            try {
              details = JSON.parse(church.description)
            } catch {
              details = {
                description: church.description,
                location: { city: '', state: '', zipCode: '' }
              }
            }
            return {
              type: 'church' as const,
              id: church.id,
              title: church.name,
              subtitle: details.location.city ? 
                `${details.location.city}, ${details.location.state}` : 
                details.description,
              avatar_url: church.image_url,
              details
            }
          }) || []),
          ...(sermons?.map(sermon => ({
            type: 'sermon' as const,
            id: sermon.id,
            title: sermon.title,
            subtitle: `by @${sermon.profiles.username}`
          })) || [])
        ]

        setResults(combinedResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  function handleResultClick(result: SearchResult) {
    setIsOpen(false)
    setQuery('')
    
    switch (result.type) {
      case 'user':
        navigate(`/profile/${result.id}`)
        break
      case 'church':
        navigate(`/church/${result.id}`)
        break
      case 'sermon':
        navigate(`/sermon/${result.id}`)
        break
    }
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'church':
        return <Church className="h-4 w-4" />
      case 'sermon':
        return <ScrollText className="h-4 w-4" />
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sermon notes, users, or churches..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (query || isLoading) && (
        <div className="absolute mt-2 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 text-left"
                >
                  <div className="flex-shrink-0">
                    {result.avatar_url ? (
                      <img
                        src={result.avatar_url}
                        alt={result.title}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {getIcon(result.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    {result.type === 'church' && result.details ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p className="truncate">{result.details.description}</p>
                        {result.details.location.city && (
                          <div className="flex items-center mt-1 text-primary/80">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>
                              {result.details.location.city}, {result.details.location.state}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : result.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}