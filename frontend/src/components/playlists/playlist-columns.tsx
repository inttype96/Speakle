"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Music, Settings, Trash2 } from "lucide-react"
import type { Playlist } from "@/services/playlist"

interface PlaylistActionsProps {
  playlist: Playlist
  onEdit: (playlist: Playlist) => void
  onDelete: (playlist: Playlist) => void
  onView: (playlistId: string) => void
  isOwner: boolean
}

function PlaylistActions({ playlist, onEdit, onDelete, onView, isOwner }: PlaylistActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">메뉴 열기</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(playlist.id)}>
          <Music className="mr-2 h-4 w-4" />
          보기
        </DropdownMenuItem>
        {isOwner && (
          <>
            <DropdownMenuItem onClick={() => onEdit(playlist)}>
              <Settings className="mr-2 h-4 w-4" />
              편집
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(playlist)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const createPlaylistColumns = (
  onEdit: (playlist: Playlist) => void,
  onDelete: (playlist: Playlist) => void,
  onView: (playlistId: string) => void,
  currentUserId?: string
): ColumnDef<Playlist>[] => [
  {
    accessorKey: "name",
    header: "플레이리스트 이름",
    cell: ({ row }) => {
      const playlist = row.original
      return (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div
              className="font-medium cursor-pointer hover:text-primary"
              onClick={() => onView(playlist.id)}
            >
              {playlist.name}
            </div>
            {playlist.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {playlist.description}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "owner.display_name",
    header: "소유자",
    cell: ({ row }) => {
      const playlist = row.original
      return (
        <div className="text-sm">
          {playlist.owner.display_name}
        </div>
      )
    },
  },
  {
    accessorKey: "tracks.total",
    header: "트랙 수",
    cell: ({ row }) => {
      const playlist = row.original
      return (
        <Badge variant="secondary">
          {playlist.tracks.total}곡
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const playlist = row.original
      const isOwner = currentUserId && playlist.owner.id === currentUserId.toString()

      return (
        <PlaylistActions
          playlist={playlist}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          isOwner={!!isOwner}
        />
      )
    },
  },
]