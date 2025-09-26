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
        <Button variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/10">
          <span className="sr-only">메뉴 열기</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg">
        <DropdownMenuItem onClick={() => onView(playlist.id)} className="text-white hover:bg-white/10 font-['Pretendard']">
          <Music className="mr-2 h-4 w-4" />
          보기
        </DropdownMenuItem>
        {isOwner && (
          <>
            <DropdownMenuItem onClick={() => onEdit(playlist)} className="text-white hover:bg-white/10 font-['Pretendard']">
              <Settings className="mr-2 h-4 w-4" />
              편집
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(playlist)}
              className="text-red-400 hover:bg-red-500/10 font-['Pretendard']"
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
          <div className="w-10 h-10 bg-[#4B2199]/20 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-[#B5A6E0]" />
          </div>
          <div>
            <div
              className="font-medium cursor-pointer hover:text-[#B5A6E0] text-white font-['Pretendard']"
              onClick={() => onView(playlist.id)}
            >
              {playlist.name}
            </div>
            {playlist.description && (
              <div className="text-sm text-white/60 line-clamp-1 font-['Pretendard']">
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
        <div className="text-sm text-white font-['Pretendard']">
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
        <Badge className="bg-[#4B2199]/20 text-[#B5A6E0] hover:bg-[#4B2199]/30 font-['Pretendard']">
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