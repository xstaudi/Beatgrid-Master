'use client'

import { useMemo } from 'react'
import type { Playlist } from '@/types/playlist'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FolderOpen, ListMusic, Library } from 'lucide-react'

interface PlaylistSelectorProps {
  playlists: Playlist[]
  activeId: string | null
  totalTrackCount: number
  onChange: (id: string | null) => void
}

interface TreeNode {
  playlist: Playlist
  children: TreeNode[]
}

function buildTree(playlists: Playlist[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const pl of playlists) {
    nodeMap.set(pl.id, { playlist: pl, children: [] })
  }

  for (const pl of playlists) {
    const node = nodeMap.get(pl.id)!
    if (pl.parentId && nodeMap.has(pl.parentId)) {
      nodeMap.get(pl.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function PlaylistItem({
  node,
  depth,
  activeId,
  onChange,
}: {
  node: TreeNode
  depth: number
  activeId: string | null
  onChange: (id: string | null) => void
}) {
  const { playlist } = node
  const isActive = activeId === playlist.id
  const isFolder = playlist.isFolder
  const Icon = isFolder ? FolderOpen : ListMusic

  return (
    <>
      <button
        onClick={() => !isFolder && onChange(playlist.id)}
        disabled={isFolder}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : isFolder
              ? 'text-muted-foreground cursor-default'
              : 'hover:bg-muted'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{playlist.name}</span>
        {!isFolder && playlist.trackIds.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground shrink-0">
            {playlist.trackIds.length}
          </span>
        )}
      </button>
      {node.children.map((child) => (
        <PlaylistItem
          key={child.playlist.id}
          node={child}
          depth={depth + 1}
          activeId={activeId}
          onChange={onChange}
        />
      ))}
    </>
  )
}

export function PlaylistSelector({
  playlists,
  activeId,
  totalTrackCount,
  onChange,
}: PlaylistSelectorProps) {
  const tree = useMemo(() => buildTree(playlists), [playlists])

  if (playlists.length === 0) return null

  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Filter by Playlist
        </p>
        <ScrollArea className="max-h-64 overflow-hidden">
          <div className="space-y-0.5">
            <button
              onClick={() => onChange(null)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                activeId === null
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              <Library className="h-4 w-4 shrink-0" />
              <span>All Tracks</span>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">
                {totalTrackCount}
              </span>
            </button>
            {tree.map((node) => (
              <PlaylistItem
                key={node.playlist.id}
                node={node}
                depth={0}
                activeId={activeId}
                onChange={onChange}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
