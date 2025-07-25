import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface TranslationSkeletonProps {
  lines?: number
  showMetrics?: boolean
}

export function TranslationSkeleton({ 
  lines = 3, 
  showMetrics = false 
}: TranslationSkeletonProps) {
  const widths = ['w-full', 'w-3/4', 'w-5/6']
  
  return (
    <Card className="reference-card">
      <div className="flex gap-8 p-8">
        {/* English Section - LEFT - 70% */}
        <div className="flex-1 space-y-2" style={{ flexBasis: '70%' }}>
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`h-4 ${widths[i % widths.length]}`}
            />
          ))}
          
          {showMetrics && (
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-auto" />

        {/* Hebrew Section - RIGHT - 30% */}
        <div className="space-y-2" style={{ flexBasis: '30%', flexShrink: 0 }}>
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`h-3 ml-auto ${widths[i % widths.length]}`}
            />
          ))}
          
          <div className="flex gap-1 pt-2 justify-end">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        </div>
      </div>
    </Card>
  )
}