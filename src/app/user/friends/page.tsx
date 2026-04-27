"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  getFollowers,
  getFollowing,
  getFriends,
  followUser,
  unfollowUser,
  searchAll,
  FollowUserResponse,
} from "@/src/app/utils/api";
import { useUserId } from "@/src/app/utils/auth";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "friends" | "followers" | "following" | "find";

interface UserCardProps {
  user: FollowUserResponse;
  isFriend?: boolean;
  isFollowing?: boolean;
  onFollow: (id: string) => Promise<void>;
  onUnfollow: (id: string) => Promise<void>;
  currentUserId: string;
}

// ─── User Card ────────────────────────────────────────────────────────────────

function UserCard({ user, isFriend, isFollowing, onFollow, onUnfollow, currentUserId }: UserCardProps) {
  const [loading, setLoading] = useState(false);

  // Don't show yourself
  if (user.id === currentUserId) return null;

  const avatarSeed = user.imageUrl || user.id;
  const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${avatarSeed}`;

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isFollowing || isFriend) {
        await onUnfollow(user.id);
      } else {
        await onFollow(user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-colors">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl}
          alt={user.name}
          className="w-12 h-12 rounded-full bg-neutral-700"
        />
        {isFriend && (
          <span
            className="absolute -bottom-1 -right-1 text-sm"
            title="Friends"
          >
            🤝
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{user.name}</p>
        {isFriend && (
          <p className="text-xs text-emerald-400">Friends</p>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
          isFollowing || isFriend
            ? 'bg-neutral-700 hover:bg-red-900 hover:text-red-300 text-gray-300'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {loading
          ? '...'
          : isFollowing || isFriend
          ? 'Unfollow'
          : 'Follow'}
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <span className="text-4xl mb-3">👤</span>
      <p>{message}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const userId = useUserId();

  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FollowUserResponse[]>([]);
  const [followers, setFollowers] = useState<FollowUserResponse[]>([]);
  const [following, setFollowing] = useState<FollowUserResponse[]>([]);
  const [searchResults, setSearchResults] = useState<FollowUserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // The set of user IDs the current user follows — used to determine button state
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  // ── Load social lists ──────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [f, frs, fng] = await Promise.all([
        getFriends(userId),
        getFollowers(userId),
        getFollowing(userId),
      ]);
      setFriends(f);
      setFollowers(frs);
      setFollowing(fng);
      setFollowingIds(new Set(fng.map((u) => u.id)));
      setFriendIds(new Set(f.map((u) => u.id)));
    } catch (err) {
      toast.error("Failed to load social data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Search ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== "find") return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAll(searchQuery);
        // Map search user shape to FollowUserResponse shape
        const mapped: FollowUserResponse[] = results.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          imageUrl: u.imageUrl || u.image || "",
        }));
        setSearchResults(mapped);
      } catch {
        toast.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // ── Follow / Unfollow ──────────────────────────────────────────────────────

  const handleFollow = async (targetId: string) => {
    try {
      await followUser(targetId);
      toast.success("Followed successfully");
      await loadAll(); // refresh all lists so counts and states update
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Follow failed");
    }
  };

  const handleUnfollow = async (targetId: string) => {
    try {
      await unfollowUser(targetId);
      toast.success("Unfollowed");
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unfollow failed");
    }
  };

  // ── Tabs config ────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "friends",   label: "🤝 Friends",   count: friends.length },
    { key: "followers", label: "Followers",     count: followers.length },
    { key: "following", label: "Following",     count: following.length },
    { key: "find",      label: "🔍 Find People" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-8 flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Friends & Followers</h1>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-neutral-700 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-blue-600 text-white" : "bg-neutral-700 text-gray-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-3">

        {/* Friends */}
        {activeTab === "friends" && (
          loading ? <LoadingSkeleton /> :
          friends.length === 0
            ? <EmptyState message="No friends yet — follow someone and if they follow back, you'll be friends!" />
            : friends.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFriend={true}
                  isFollowing={followingIds.has(user.id)}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  currentUserId={userId || ""}
                />
              ))
        )}

        {/* Followers */}
        {activeTab === "followers" && (
          loading ? <LoadingSkeleton /> :
          followers.length === 0
            ? <EmptyState message="Nobody follows you yet" />
            : followers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFriend={friendIds.has(user.id)}
                  isFollowing={followingIds.has(user.id)}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  currentUserId={userId || ""}
                />
              ))
        )}

        {/* Following */}
        {activeTab === "following" && (
          loading ? <LoadingSkeleton /> :
          following.length === 0
            ? <EmptyState message="You're not following anyone yet" />
            : following.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFriend={friendIds.has(user.id)}
                  isFollowing={true}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  currentUserId={userId || ""}
                />
              ))
        )}

        {/* Find People */}
        {activeTab === "find" && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-neutral-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
            />

            {isSearching && (
              <div className="text-center text-gray-500 py-8">Searching...</div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <EmptyState message="No users found" />
            )}

            {!isSearching && !searchQuery && (
              <p className="text-center text-gray-500 py-8 text-sm">
                Type a name to search for people
              </p>
            )}

            {searchResults.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isFriend={friendIds.has(user.id)}
                isFollowing={followingIds.has(user.id)}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                currentUserId={userId || ""}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl animate-pulse">
          <div className="w-12 h-12 rounded-full bg-neutral-700" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 bg-neutral-700 rounded w-32" />
            <div className="h-2 bg-neutral-700 rounded w-20" />
          </div>
          <div className="w-20 h-8 bg-neutral-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}