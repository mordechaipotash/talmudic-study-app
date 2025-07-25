'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface TreeNode {
  ref: string
  title: string
  depth: number
  children: TreeNode[]
  isExpanded: boolean
  isActive: boolean
}

interface NavigationTreeProps {
  currentPath: string[]
  expandedNodes: string[]
  onNodeClick: (ref: string) => void
  onBack?: () => void
  onHome?: () => void
}

export function NavigationTree({
  currentPath,
  expandedNodes,
  onNodeClick,
  onBack,
  onHome,
}: NavigationTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(expandedNodes))

  const toggleExpanded = (ref: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(ref)) {
      newExpanded.delete(ref)
    } else {
      newExpanded.add(ref)
    }
    setExpanded(newExpanded)
  }

  const buildTree = (): TreeNode[] => {
    const tree: TreeNode[] = []
    const nodeMap = new Map<string, TreeNode>()

    currentPath.forEach((ref, index) => {
      const node: TreeNode = {
        ref,
        title: formatTitle(ref),
        depth: index,
        children: [],
        isExpanded: expanded.has(ref),
        isActive: index === currentPath.length - 1,
      }

      nodeMap.set(ref, node)

      if (index === 0) {
        tree.push(node)
      } else {
        const parent = nodeMap.get(currentPath[index - 1])
        if (parent) {
          parent.children.push(node)
        }
      }
    })

    return tree
  }

  const formatTitle = (ref: string): string => {
    // Extract book name and location
    const parts = ref.split(' ')
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1]}`
    }
    return ref
  }

  const renderNode = (node: TreeNode) => {
    const hasChildren = node.children.length > 0

    return (
      <div key={node.ref} className={cn('relative', node.depth > 0 && 'ml-4')}>
        {node.depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
        )}
        
        <div
          className={cn(
            'flex items-center gap-1 py-1',
            node.depth > 0 && 'pl-4',
            'relative before:content-[""] before:absolute',
            node.depth > 0 && 'before:left-0 before:top-[50%] before:w-4 before:h-px before:bg-border'
          )}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={() => toggleExpanded(node.ref)}
            >
              {node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <Button
            variant={node.isActive ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 px-2 text-xs font-normal',
              !hasChildren && 'ml-5'
            )}
            onClick={() => onNodeClick(node.ref)}
          >
            {node.title}
          </Button>
        </div>
        
        {node.isExpanded && node.children.map(child => renderNode(child))}
      </div>
    )
  }

  const tree = buildTree()

  return (
    <div className="space-y-2">
      {/* Navigation Controls */}
      <div className="flex items-center gap-1 pb-2 border-b">
        {onHome && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onHome}
          >
            <Home className="h-3 w-3" />
          </Button>
        )}
        
        {onBack && currentPath.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onBack}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
        )}
        
        <span className="text-xs text-muted-foreground ml-2">
          {currentPath.length} levels deep
        </span>
      </div>
      
      {/* Tree View */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-1">
          {tree.map(node => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  )
}