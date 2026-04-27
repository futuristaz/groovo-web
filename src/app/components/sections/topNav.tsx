"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserType, useUserName } from "@/src/app/utils/auth";
import { searchAll, type SearchAllResponse } from "@/src/app/utils/api";
import Link from "../ui/link";
import NotificationBell from "@/src/app/components/ui/notificationBell";

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchAllResponse>({ users: [], songs: [], playlists: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const userType = useUserType();
  const userName = useUserName();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthor = String(userType || "").toLowerCase() === "author";
  const playlistBasePath = isAuthor ? "/artist/playlist" : "/user/playlist";

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    function onClickSearchOutside(e: MouseEvent) {
      if (!searchRef.current) return;
      if (searchRef.current.contains(e.target as Node)) return;
      setSearchOpen(false);
    }

    document.addEventListener("click", onClickSearchOutside);
    return () => document.removeEventListener("click", onClickSearchOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      setSearchResults({ users: [], songs: [], playlists: [] });
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const handle = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchAll(trimmed);
        setSearchResults(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setSearchError(message || "Search failed");
        setSearchResults({ users: [], songs: [], playlists: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  function handlePlaylistOpen(playlistId: string) {
    setSearchOpen(false);
    setQuery("");
    router.push(`${playlistBasePath}/${playlistId}`);
  }

  function roleLabel(role: number) {
    if (role === 2) return "Admin";
    if (role === 1) return "Author";
    return "User";
  }

  function handleLogout() {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("expiresAt");
    } catch (err) {
      console.warn("Error clearing localStorage during logout", err);
    }
    window.location.href = "/auth/login";
  }

  return (
    <nav className="w-full h-20 bg-black text-white flex items-center px-6 shadow-md">
      <div className="flex items-center justify-between w-full">
        {/* Left: logo */}
        <div className="flex items-center gap-3">
          <Link href="/user">
            <Image
              src="/Groovo.svg"
              alt="Groovo Logo"
              width={120}
              height={32}
              style={{ height: 'auto' }}
              priority
            />
          </Link>
        </div>

        {/* Center: search bar */}
        <div className="flex-1 max-w-xl" ref={searchRef}>
          <div className="relative">
            <input
              aria-label="Search"
              className="w-full bg-neutral-800 text-sm placeholder:text-neutral-400 text-white rounded-md py-2 px-3 outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Search songs, playlists, users"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />

            {searchOpen && (
              <div className="absolute mt-2 w-full bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-30 max-h-96 overflow-y-auto">
                {query.trim().length === 0 ? (
                  <p className="px-3 py-2 text-sm text-neutral-400">Start typing to search</p>
                ) : isSearching ? (
                  <p className="px-3 py-2 text-sm text-neutral-400">Searching...</p>
                ) : searchError ? (
                  <p className="px-3 py-2 text-sm text-red-400">{searchError}</p>
                ) : (
                  <div className="py-1">
                    <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-neutral-500">Playlists</div>
                    {searchResults.playlists.length === 0 ? (
                      <p className="px-3 py-1 text-sm text-neutral-500">No playlists</p>
                    ) : (
                      searchResults.playlists.slice(0, 5).map((playlist: any) => (
                        <button
                          key={playlist.id}
                          className="w-full text-left px-3 py-2 hover:bg-neutral-800"
                          onClick={() => handlePlaylistOpen(playlist.id)}
                        >
                          <p className="text-sm text-white truncate">{playlist.name}</p>
                          <p className="text-xs text-neutral-400 truncate">{playlist.isAlbum ? "Album" : "Playlist"}</p>
                        </button>
                      ))
                    )}

                    <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-neutral-500">Songs</div>
                    {searchResults.songs.length === 0 ? (
                      <p className="px-3 py-1 text-sm text-neutral-500">No songs</p>
                    ) : (
                      searchResults.songs.slice(0, 5).map((song: any) => (
                        <div key={song.id} className="px-3 py-2 hover:bg-neutral-800">
                          <p className="text-sm text-white truncate">{song.name}</p>
                          <p className="text-xs text-neutral-400 truncate">
                            {(song.authorNames || []).join(", ") || "Unknown artist"}
                          </p>
                        </div>
                      ))
                    )}

                    <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-neutral-500">Users</div>
                    {searchResults.users.length === 0 ? (
                      <p className="px-3 py-1 text-sm text-neutral-500">No users</p>
                    ) : (
                      searchResults.users.slice(0, 5).map((user: any) => (
                        <div key={user.id} className="px-3 py-2 hover:bg-neutral-800">
                          <p className="text-sm text-white truncate">{user.name}</p>
                          <p className="text-xs text-neutral-400">{roleLabel(user.role)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
       
        {/* Right: notification bell + account dropdown */}
        <div className="flex items-center gap-2 ml-4">
          <NotificationBell />

          <div className="relative" ref={dropdownRef}>
          <button
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 px-1 py-1 rounded-full focus:outline-none"
          >
            {/* placeholder avatar as an inline SVG circle */}
            <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center overflow-hidden">
              <Image
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${userName || "Account"}`}
                alt="User Avatar"
                width={32}
                height={32}
                  style={{ height: 'auto' }}
                unoptimized
              />
            </div>

            <span className="hidden sm:inline-block text-sm">
              {userName || "Account"} {userType && `(${userType})`}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-neutral-900 rounded-md shadow-lg py-1 z-20">
              <Link
                href="/user"
                className="block px-4 py-2 text-sm text-white hover:text-white hover:bg-neutral-800"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/user/settings"
                className="block px-4 py-2 text-sm text-white hover:text-white hover:bg-neutral-800"
                onClick={() => setOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800"
              >
                Logout
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
}
