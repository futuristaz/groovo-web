export async function refreshAccessToken() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/auth/refresh`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      throw new Error(`Refresh failed: ${res.status} ${res.statusText} ${text || ''}`);
    }

    const data = await res.json().catch(() => null);
    const newAccessToken = data?.data?.AccessToken;

    if (newAccessToken) {
      localStorage.setItem('accessToken', newAccessToken);
      return { success: true, accessToken: newAccessToken };
    } else {
      throw new Error('No access token in refresh response');
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('accessToken');
      } catch (err) {
        console.warn('Could not clear accessToken from localStorage', err);
      }
    }
    console.error('Token refresh failed:', error);
    return { success: false, error: String(error) };
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}, isRetry: boolean = false) {
  let authHeader: Record<string, string> = {}
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) authHeader = { Authorization: `Bearer ${token}` }
    }
  } catch (err) {
    console.warn('Could not read accessToken from localStorage', err)
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...authHeader,
    },
  });

  console.debug('fetchWithAuth ->', { url, status: res.status, statusText: res.statusText });

  // Handle 401 Unauthorized - attempt token refresh and retry
  if (res.status === 401 && !isRetry) {
    console.log('Received 401, attempting token refresh...');
    const refreshResult = await refreshAccessToken();

    if (refreshResult.success) {
      console.log('Token refreshed successfully, retrying original request');
      return fetchWithAuth(url, options, true);
    } else {
      console.error('Token refresh failed');
      // Throw so callers can handle redirect logic instead of forcing it here
      throw new Error('Token refresh failed');
    }
  }

  return res;
}

export async function createSong(payload: any) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Songs`;

  const res = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Create song failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => null);
}

export async function fetchPlaylistsByAuthor(authorId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/users/${authorId}/playlists`;
  console.log("Fetching playlists for author:", url, authorId);

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Fetch playlists failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => []);
}

export async function fetchPlaylistsByUser(userId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists`;

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Fetch playlists failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => []);
}

export async function fetchPublicPlaylists() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists`;

  console.log("Fetching public playlists from:", url);

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    console.error("Error fetching public playlists:", res.status, res.statusText, text);
    // Return empty list on non-authorized / error to avoid breaking the UI.
    return [];
  }

  const data = await res.json().catch(() => null);
  console.log("Public playlists data received:", data);
  return data?.data || data || [];
}

export async function fetchUserPlaylists(userId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const url = `${base}/api/v1/users/${userId}/playlists`;

  console.log("Fetching user playlists from:", url);

  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  console.log("Response status:", res.status, res.statusText);

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    console.error("Error response:", text);
    throw new Error(`Fetch user playlists failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const data = await res.json().catch(() => []);
  console.log("Playlists data received:", data);
  return data;
}

export async function createPlaylist(payload: any) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists`;

  console.log("Creating playlist with payload:", payload);

  try {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      const errorMessage = text ? `${res.status} ${res.statusText}: ${text}` : `${res.status} ${res.statusText}`;
      console.error("Create playlist error:", errorMessage);
      throw new Error(`Create playlist failed: ${errorMessage}`);
    }

    const data = await res.json().catch(() => null);
    console.log("Playlist created:", data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Create playlist exception:", error.message);
      throw error;
    }
    console.error("Create playlist unknown error:", error);
    throw new Error(`Create playlist failed: Unknown error ${String(error)}`);
  }
}

export async function updatePlaylist(playlistId: string, payload: any) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists/${playlistId}`;

  const res = await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Update playlist failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return res.json().catch(() => null);
}

export async function deletePlaylist(playlistId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists/${playlistId}`;

  const res = await fetchWithAuth(url, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Delete playlist failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  return true;
}

export async function addSongToPlaylist(playlistId: string, songId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Playlists/${playlistId}/songs/${songId}`;

  console.log("Adding song to playlist:", { playlistId, songId });

  const res = await fetchWithAuth(url, {
    method: 'POST',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    console.error("Add song to playlist error:", text);
    throw new Error(`Add song to playlist failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  console.log("Song added to playlist successfully");
  return res.ok;
}

export async function fetchUserInfo() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/auth/me`, {
    method: 'GET',
  });

  console.debug('fetchUserInfo status:', res.status, res.statusText);
  const text = await res.text().catch(() => null);
  console.debug('fetchUserInfo body:', text);
  if (!res.ok) {
    throw new Error(`Failed to fetch user information: ${res.status} ${res.statusText} ${text || ''}`);
  }

  if (!text) {
    console.warn('Empty response from server');
    return null;
  }

  try {
    const data = JSON.parse(text);
    return data?.data || data;
  } catch (err) {
    console.warn('Could not parse /auth/me JSON', err, text);
    return null;
  }
}

export async function updateUserInfo(userInfo: { name: string; bio: string }) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/auth/me`, {
    method: 'PUT',
    body: JSON.stringify(userInfo),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to update user info: ${errorText}`);
  }

  const text = await res.text();
  if (text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Response was not valid JSON');
      return null;
    }
  }

  return null;
}

export type ShareResourceType = 0 | 1;

export interface CreateShareLinkResponse {
  shareLinkId: string;
  token: string;
  url: string;
  resourceType: ShareResourceType;
  resourceId: string;
  createdAt: string;
}

export interface SharedResourceResponse {
  resourceType: ShareResourceType;
  track: any | null;
  playlist: any | null;
}

export interface SearchAllResponse {
  users: any[];
  songs: any[];
  playlists: any[];
}

function unwrapApiResponse<T>(payload: any): T {
  return (payload?.data ?? payload) as T;
}

function buildFrontendShareUrl(token: string): string {
  const configuredBase = process.env.NEXT_PUBLIC_APP_BASE;

  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, '')}/share/${token}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/share/${token}`;
  }

  return `/share/${token}`;
}

export async function createShareLink(resourceType: ShareResourceType, resourceId: string): Promise<CreateShareLinkResponse> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/Shares`, {
    method: 'POST',
    body: JSON.stringify({ resourceType, resourceId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Create share link failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const json = await res.json().catch(() => null);
  const data = unwrapApiResponse<CreateShareLinkResponse>(json);

  // Backend returns an API URL (/api/v1/shares/{token}); frontend should use the UI route (/share/{token}).
  return {
    ...data,
    url: buildFrontendShareUrl(data.token),
  };
}

export async function resolveShareLink(token: string): Promise<SharedResourceResponse> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetch(`${base}/api/v1/Shares/${token}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Resolve share link failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const json = await res.json().catch(() => null);
  return unwrapApiResponse<SharedResourceResponse>(json);
}

export async function searchAll(query: string): Promise<SearchAllResponse> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const url = `${base}/api/v1/Search?query=${encodeURIComponent(query)}`;
  const res = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Search failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const json = await res.json().catch(() => null);
  const data = unwrapApiResponse<any>(json) || {};

  return {
    users: data.users || data.Users || [],
    songs: data.songs || data.Songs || [],
    playlists: data.playlists || data.Playlists || [],
  };
}

export interface FollowUserResponse {
  id: string;
  name: string;
  imageUrl: string;
}

export interface RelationshipStatusResponse {
  iFollowThem: boolean;
  theyFollowMe: boolean;
  areFriends: boolean;
}

export async function followUser(targetUserId: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/users/${targetUserId}/follow`, {
    method: 'POST',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Follow failed: ${res.status} ${res.statusText} ${text || ''}`);
  }
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/users/${targetUserId}/follow`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Unfollow failed: ${res.status} ${res.statusText} ${text || ''}`);
  }
}

export async function getRelationship(targetUserId: string): Promise<RelationshipStatusResponse> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/users/${targetUserId}/relationship`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Get relationship failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const json = await res.json().catch(() => null);
  return (json?.data ?? json) as RelationshipStatusResponse;
}

export async function getFollowers(userId: string): Promise<FollowUserResponse[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/users/${userId}/followers`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Get followers failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const json = await res.json().catch(() => null);
  return (json?.data ?? json ?? []) as FollowUserResponse[];
}

export async function getFollowing(userId: string): Promise<FollowUserResponse[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/users/${userId}/following`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Get following failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const json = await res.json().catch(() => null);
  return (json?.data ?? json ?? []) as FollowUserResponse[];
}

export async function getFriends(userId: string): Promise<FollowUserResponse[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetchWithAuth(`${base}/api/v1/users/${userId}/friends`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Get friends failed: ${res.status} ${res.statusText} ${text || ''}`);
  }

  const json = await res.json().catch(() => null);
  return (json?.data ?? json ?? []) as FollowUserResponse[];
}
