"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Music, Trash2 } from "lucide-react"
import type { PlaylistTrackItem } from "@/services/playlist"

interface TrackActionsProps {
  track: PlaylistTrackItem
  onDelete: (trackUri: string) => void
  onView: (trackId: string) => void
  canDelete: boolean
}

function TrackActions({ track, onDelete, onView, canDelete }: TrackActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">메뉴 열기</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(track.track.id)}>
          <Music className="mr-2 h-4 w-4" />
          상세보기
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(track.track.uri)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const createTrackColumns = (
  onDelete: (trackUri: string) => void,
  onView: (trackId: string) => void,
  canDelete: boolean = false
): ColumnDef<PlaylistTrackItem>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <div className="w-8 text-center text-sm text-muted-foreground">
        {row.index + 1}
      </div>
    ),
  },
  {
    accessorKey: "track.name",
    header: "제목",
    cell: ({ row }) => {
      const track = row.original.track
      return (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden">
            {track.album.images.length > 0 ? (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="font-medium truncate cursor-pointer hover:text-primary"
              onClick={() => onView(track.id)}
            >
              {track.name}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {track.artists.map(artist => artist.name).join(', ')}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "track.album.name",
    header: "앨범",
    cell: ({ row }) => {
      const track = row.original.track
      return (
        <div className="truncate text-sm text-muted-foreground">
          {track.album.name}
        </div>
      )
    },
  },
  {
    accessorKey: "added_at",
    header: "추가일",
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="text-sm text-muted-foreground">
          {item.added_at}
        </div>
      )
    },
  },
  {
    accessorKey: "track.duration_formatted",
    header: "시간",
    cell: ({ row }) => {
      const track = row.original.track
      return (
        <div className="text-sm text-muted-foreground">
          {track.duration_formatted}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original

      return (
        <TrackActions
          track={item}
          onDelete={onDelete}
          onView={onView}
          canDelete={canDelete}
        />
      )
    },
  },
]