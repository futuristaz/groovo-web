"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createShareLink, fetchUserPlaylists } from "@/src/app/utils/api";
import { useUserId, useUserType } from "@/src/app/utils/auth";
import { toast } from "sonner";

interface Playlist {
  id: string;
  name: string;
  isAlbum: boolean;
  picture?: string;
}

interface SongContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  songId: string;
  onAddToPlaylist: (playlistId: string) => Promise<void>;
  addedStatus?: { playlistId: string; success: boolean } | null;
}

export default function SongContextMenu({
  isOpen,
  position,
  onClose,
  songId,
  onAddToPlaylist,
  addedStatus,
}: SongContextMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [sharingTrack, setSharingTrack] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userId = useUserId();
  const userType = useUserType();

  useEffect(() => {
    if (isOpen && userId) {
      loadPlaylists();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const loadPlaylists = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = await fetchUserPlaylists(userId);
      const playlistsData = data?.data || data || [];
      
      const isAuthor = userType?.toLowerCase() === "author" || userType?.toLowerCase() === "artist";
      
      // Filter out albums for authors, show only regular playlists
      const filteredPlaylists = playlistsData.filter((p: any) => !p.isAlbum);
      
      setPlaylists(filteredPlaylists.map((p: any) => ({
        id: p.id,
        name: p.name || "Untitled Playlist",
        isAlbum: p.isAlbum,
        picture: p.picture || `https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=${p.id}`,
      })));
    } catch (error) {
      console.error("Error loading playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleShareTrack = async () => {
    setSharingTrack(true);
    try {
      const share = await createShareLink(0, songId);
      await navigator.clipboard.writeText(share.url);
      toast.success("Track link copied to clipboard");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Failed to share track");
    } finally {
      setSharingTrack(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingToPlaylist(playlistId);
    try {
      await onAddToPlaylist(playlistId);
      // Keep menu open briefly to show success state
      setTimeout(() => {
        setAddingToPlaylist(null);
        onClose();
      }, 800);
    } catch (error) {
      setAddingToPlaylist(null);
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-neutral-800 rounded-md shadow-xl border border-neutral-700 py-1 min-w-[200px]"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      {!showPlaylists ? (
        <>
          <button
            className="w-full px-4 py-2 text-left hover:bg-neutral-700 transition-colors"
            onClick={handleShareTrack}
            disabled={sharingTrack}
          >
            {sharingTrack ? "Sharing..." : "Share track"}
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-neutral-700 transition-colors flex items-center justify-between"
            onClick={() => setShowPlaylists(true)}
          >
            <span>Add to playlist</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      ) : (
        <div>
          <div className="px-4 py-2 text-sm text-gray-400 border-b border-neutral-700 flex items-center gap-2">
            <button
              onClick={() => setShowPlaylists(false)}
              className="hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span>Select playlist</span>
          </div>
          
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400">Loading...</div>
          ) : playlists.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">
              No playlists available
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {playlists.map((playlist) => {
                const isAdding = addingToPlaylist === playlist.id;
                const wasAdded = addedStatus?.playlistId === playlist.id;
                
                return (
                  <button
                    key={playlist.id}
                    className="w-full px-3 py-2 text-left hover:bg-neutral-700 transition-colors text-sm flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={isAdding}
                  >
                    <Image
                      src={playlist.picture!}
                      alt={playlist.name}
                      width={32}
                      height={32}
                      className="rounded aspect-square object-cover"
                      unoptimized
                    />
                    <span className="flex-1 truncate">{playlist.name}</span>
                    {isAdding && (
                      <svg
                        className="animate-spin h-4 w-4 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {wasAdded && !isAdding && addedStatus?.success && (
                      <svg
                        className="h-4 w-4 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
