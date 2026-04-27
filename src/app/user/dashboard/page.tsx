"use client";

import React, { useEffect, useState } from "react";
import DashboardSkeleton from "@/src/app/components/ui/dashboardSkeleton";
import PlaylistCard from "@/src/app/components/ui/playlistCard";
import { fetchPublicPlaylists, getFollowers, getFollowing, getFriends } from "@/src/app/utils/api";
import { useUserId } from "@/src/app/utils/auth";
import { useRouter } from "next/navigation";

export default function UserDashboardPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);

  const userId = useUserId();
  const router = useRouter();

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPublicPlaylists();
        setPlaylists(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setIsLoading(false);
      }
    };
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loadSocialCounts = async () => {
      try {
        const [followers, following, friends] = await Promise.all([
          getFollowers(userId),
          getFollowing(userId),
          getFriends(userId),
        ]);
        setFollowersCount(followers.length);
        setFollowingCount(following.length);
        setFriendsCount(friends.length);
      } catch {
        // counts are non-critical, fail silently
      }
    };
    loadSocialCounts();
  }, [userId]);

  return (
    <div className="px-6 py-8 flex flex-col gap-6">

      {/* Profile social stats bar */}
      <div className="flex items-center gap-6 bg-neutral-800 rounded-xl px-6 py-4">
        <div className="flex gap-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-white font-semibold text-lg">
              {followingCount ?? '—'}
            </span>
            <span className="text-gray-400">Following</span>
          </div>
          <div className="w-px bg-neutral-700" />
          <div className="flex flex-col items-center">
            <span className="text-white font-semibold text-lg">
              {followersCount ?? '—'}
            </span>
            <span className="text-gray-400">Followers</span>
          </div>
          <div className="w-px bg-neutral-700" />
          <div className="flex flex-col items-center">
            <span className="text-white font-semibold text-lg">
              {friendsCount ?? '—'}
            </span>
            <span className="text-gray-400">Friends</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/user/friends')}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-sm text-white transition-colors"
        >
          <span>👥</span>
          Manage Friends
        </button>
      </div>

      {/* Playlists */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-white">Public Playlists</h2>
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard
                  userType="user"
                  key={playlist.id}
                  id={playlist.id}
                  name={playlist.name}
                  image={"https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=" + playlist.id}
                  description={playlist.description}
                  author={playlist.owners?.length ? playlist.owners.map((owner: any) => owner.name).join(', ') : 'Unknown'}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No playlists found</p>
          )}
        </div>
      )}
    </div>
  );
}