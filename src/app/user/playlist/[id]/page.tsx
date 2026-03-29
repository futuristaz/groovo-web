"use client";

import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import TableSongElement from "@/src/app/components/ui/tableSongElement";
import PlaylistSkeleton from "@/src/app/components/ui/playlistSkeleton";
import SongContextMenu from "@/src/app/components/ui/songContextMenu";
import CreatePlaylistModal from "@/src/app/components/ui/createPlaylistModal";
import { useParams } from "next/navigation";
import { fetchWithAuth, addSongToPlaylist, updatePlaylist, deletePlaylist, createShareLink } from "@/src/app/utils/api";
import { useSignalR } from "@/src/app/contexts/SignalRContext";
import Button from "@/src/app/components/ui/button";
import { PlayerContext } from "@/src/app/user/layout";
import { toast } from "sonner";
import { useUserId } from "@/src/app/utils/auth";
import { useRouter } from "next/navigation";

type Song = {
  id: string;
  title: string;
  album: string;
  image: string;
  author: string;
  dateAdded: string;
  duration: string;
};

type Playlist = {
  id: string;
  name: string;
  image?: string;
  creator: string;
  description?: string;
  songs: Song[];
};

export default function PlaylistPage() {
  const params = useParams();
  const { id } = params;
  const { connect, joinPlaylist, leavePlaylist, getPlaybackState, isConnected, playSong, playbackState, setPlaylistSongs, currentPlaylistId } = useSignalR();
  const { setCurrentSong } = useContext(PlayerContext);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; songId: string } | null>(null);
  const [addedStatus, setAddedStatus] = useState<{ playlistId: string; success: boolean } | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const userId = useUserId();
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [hasJoinedPlaylist, setHasJoinedPlaylist] = useState(false);

  // If user refreshes the page, read the last joined playlist id from storage
  // and show joined state for the matching playlist (UI-only; actual join must be explicit).
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('currentPlaylistId') : null;
      setHasJoinedPlaylist(Boolean(stored && stored === id));
    } catch (err) {
      console.warn('Could not read stored playlist id on mount:', err);
    }
  }, [id]);

  // Keep UI state in sync if context's currentPlaylistId changes (e.g., after joining/leaving)
  useEffect(() => {
    setHasJoinedPlaylist(Boolean(currentPlaylistId && currentPlaylistId === id));
  }, [currentPlaylistId, id]);

  const handlePlayPlaylist = async () => {
    if (!id || !playlist) return;
    
    try {
      // Connect to SignalR if not already connected
      if (!isConnected) {
        await connect();
      }
      
      // Set the playlist songs in the context
      const songIds = playlist.songs.map(song => song.id);
      setPlaylistSongs(songIds);
      
      // Open the player by setting the first song
      if (playlist.songs.length > 0) {
        setCurrentSong(playlist.songs[0] as any);
      }
      
      // Join the playlist
      await joinPlaylist(id as string);
      setHasJoinedPlaylist(true);
      
      // Get current playback state
      await getPlaybackState();
      
    } catch (err) {
      // Error handling can be added here if needed
    }
  };

  const handleContextMenu = (e: React.MouseEvent, songId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, songId });
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!contextMenu) return;
    
    try {
      await addSongToPlaylist(playlistId, contextMenu.songId);
      setAddedStatus({ playlistId, success: true });
      toast.success(`Song added to playlist`);
      
      // Clear status after a delay
      setTimeout(() => setAddedStatus(null), 3000);
    } catch (error: any) {
      setAddedStatus({ playlistId, success: false });
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage || "Failed to add song to playlist");
      
      // Clear status after a delay
      setTimeout(() => setAddedStatus(null), 3000);
    }
  };

  const handleSharePlaylist = async () => {
    if (!id) return;

    setIsSharing(true);
    try {
      const share = await createShareLink(1, id as string);
      await navigator.clipboard.writeText(share.url);
      toast.success("Playlist link copied to clipboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage || "Failed to share playlist");
    } finally {
      setIsSharing(false);
    }
  };

  // fetchPlaylist moved outside so it can be reused after edits
  const fetchPlaylist = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
      const res = await fetchWithAuth(`${apiBase}/api/v1/Playlists/${id}`);
      const resSongs = await fetchWithAuth(`${apiBase}/api/v1/Playlists/${id}/songs`);
      
      if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`);
      if (!resSongs.ok) throw new Error(`Failed to fetch songs: ${resSongs.status}`);
      
      const json = await res.json();
      const jsonSongs = await resSongs.json();

      if (!json.success || !json.data) {
        throw new Error("Playlist not found or API error");
      }

      const apiData = json.data;
      const songsData = jsonSongs.success && jsonSongs.data ? jsonSongs.data : [];

      const mappedPlaylist: Playlist = {
        id: apiData.id,
        name: apiData.name,
        description: apiData.description,
        image:"https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=" + apiData.id,
        creator: apiData.owners?.[0]?.name || "Unknown",
        songs: songsData.map((s: any) => {
          // Handle authors - could be array or single object
          let authorName = "Unknown";
          if (s.authors) {
            if (Array.isArray(s.authors)) {
              authorName = s.authors.map((a: any) => a.name).join(", ");
            } else if (s.authors.name) {
              authorName = s.authors.name;
            }
          }
          
          const contentBase = process.env.NEXT_PUBLIC_CONTENT_BASE || 'http://localhost:5039';
          return {
            id: s.id,
            title: s.name,
            album: "", // API does not provide album
            image: `${contentBase}/contents/images/${s.id}`,
            author: authorName,
            dateAdded: new Date(s.releaseDate).toLocaleDateString(),
            duration: s.duration,
          };
        }),
      };

      // attach raw owners and isPublic if present for edit checks
      (mappedPlaylist as any).owners = json.data.owners || [];
      (mappedPlaylist as any).isPublic = json.data.isPublic ?? true;

      setPlaylist(mappedPlaylist);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlaylist(); }, [id]);
 

  if (loading) return <PlaylistSkeleton />;
  if (!playlist) return <p className="p-8">Playlist not found</p>;

  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Playlist header */}
      <div className="flex gap-4 items-end max-h-72">
        <Image
          src={playlist.image!}
          alt={playlist.name}
          width={200}
          height={200}
          className="rounded-lg aspect-square"
          unoptimized
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold">{playlist.name}</h1>
          {hasJoinedPlaylist && (
            <p className="text-green-400 text-sm">Connected to party{playbackState?.currentSongId ? ` — playing: ${playlist.songs.find(s => s.id === playbackState.currentSongId)?.title || 'unknown'}` : ''}</p>
          )}
          {playlist.description && <p className="text-gray-400">{playlist.description}</p>}
          <p className="text-gray-400 text-sm mt-4">Delightfully crafted by {playlist.creator}</p>
          <p className="text-gray-400 text-sm">{playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}</p>
          
          {/* Play Button */}
          <div className="mt-4">
            <Button
              onClick={handlePlayPlaylist}
              disabled={hasJoinedPlaylist}
              variant="green"
              size="md"
              width="auto"
              className="px-8"
            >
              {hasJoinedPlaylist ? 'Joined' : isConnected ? 'Join & Play' : 'Connect & Play'}
            </Button>
            <Button
              onClick={handleSharePlaylist}
              disabled={isSharing}
              variant="outline"
              size="md"
              width="auto"
              className="ml-3"
            >
              {isSharing ? "Sharing..." : "Share"}
            </Button>
            {playlist && userId && Array.isArray((playlist as any).owners) && ((playlist as any).owners.findIndex((o: any) => String(o?.id || o) === String(userId)) !== -1) && (
              <Button
                onClick={() => setIsEditOpen(true)}
                variant="outline"
                size="md"
                width="auto"
                className="ml-3"
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Song list */}
      {playlist.songs.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-2 px-2 font-light text-sm text-neutral-400">#</th>
              <th className="pb-2 px-2 font-light text-sm text-neutral-400">Title</th>
              <th className="pb-2 px-2 font-light text-sm text-neutral-400">Album</th>
              <th className="pb-2 px-2 font-light text-sm text-neutral-400">Date added</th>
              <th className="pb-2 px-2 font-light text-sm text-neutral-400">Duration</th>
            </tr>
          </thead>
          <tbody>
            {playlist.songs.map((song, index) => (
              <TableSongElement 
                song={song} 
                key={song.id} 
                index={index + 1} 
                onContextMenu={handleContextMenu}
                isJoinedPlaylist={hasJoinedPlaylist}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400">No songs in this playlist yet.</p>
      )}

      <SongContextMenu
        isOpen={contextMenu !== null}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : { x: 0, y: 0 }}
        onClose={() => setContextMenu(null)}
        songId={contextMenu?.songId || ""}
        onAddToPlaylist={handleAddToPlaylist}
        addedStatus={addedStatus}
      />
      {playlist && (
        <CreatePlaylistModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onConfirm={async (name, description, ownerIds, picture, isPublic) => {
            try {
              await updatePlaylist(id as string, { name, description, ownerIds, isPublic });
              toast.success('Playlist updated');
              setIsEditOpen(false);
              // notify other UI (left side nav) to reload
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('playlists:changed'));
              }
              await fetchPlaylist();
            } catch (err: any) {
              const msg = err instanceof Error ? err.message : String(err);
              toast.error(msg || 'Failed to update playlist');
              throw err;
            }
          }}
          isEdit={true}
          initialName={playlist.name}
          initialDescription={playlist.description || ""}
          initialOwnerIds={((playlist as any).owners || []).map((o: any) => o?.id || o)}
          initialIsPublic={(playlist as any).isPublic ?? true}
          userId={userId}
          onDelete={async () => {
            try {
              await deletePlaylist(id as string);
              toast.success('Playlist deleted');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('playlists:changed'));
              }
              router.push('/user/dashboard');
            } catch (err: any) {
              const msg = err instanceof Error ? err.message : String(err);
              toast.error(msg || 'Failed to delete playlist');
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
