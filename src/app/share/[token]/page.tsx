"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { resolveShareLink, type SharedResourceResponse } from "@/src/app/utils/api";

type Status = "loading" | "success" | "error";

export default function SharedResourcePage() {
  const params = useParams();
  const token = useMemo(() => String(params?.token || ""), [params]);

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string>("");
  const [shared, setShared] = useState<SharedResourceResponse | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!token) {
        setStatus("error");
        setError("Missing share token.");
        return;
      }

      setStatus("loading");
      try {
        const data = await resolveShareLink(token);
        if (!active) return;
        setShared(data);
        setStatus("success");
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Shared link is unavailable.");
        setStatus("error");
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <p className="text-neutral-300">Loading shared content...</p>
      </div>
    );
  }

  if (status === "error" || !shared) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold">Link unavailable</h1>
          <p className="text-neutral-400 mt-3">{error || "This link is invalid or has been revoked."}</p>
        </div>
      </div>
    );
  }

  if (shared.resourceType === 1 && shared.playlist) {
    const playlist = shared.playlist as any;
    const songCount = Number(playlist.songCount ?? 0);

    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-neutral-500 uppercase text-sm tracking-wider">Shared playlist</p>
          <h1 className="text-5xl font-bold mt-3">{playlist.name}</h1>
          {playlist.description && <p className="text-neutral-300 mt-4">{playlist.description}</p>}
          <p className="text-neutral-400 mt-3">{songCount} {songCount === 1 ? "song" : "songs"}</p>

          {Array.isArray(playlist.owners) && playlist.owners.length > 0 && (
            <p className="text-neutral-400 mt-2">
              By {playlist.owners.map((o: any) => o.name).join(", ")}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (shared.resourceType === 0 && shared.track) {
    const track = shared.track as any;
    const contentBase = process.env.NEXT_PUBLIC_CONTENT_BASE || "http://localhost:5039";
    const imageSrc = `${contentBase}/contents/images/${track.id}`;

    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start">
          <Image
            src={imageSrc}
            alt={track.name || "Shared track"}
            width={260}
            height={260}
            className="rounded-xl aspect-square object-cover"
            unoptimized
          />
          <div>
            <p className="text-neutral-500 uppercase text-sm tracking-wider">Shared track</p>
            <h1 className="text-5xl font-bold mt-3">{track.name}</h1>

            {Array.isArray(track.authors) && track.authors.length > 0 && (
              <p className="text-neutral-300 mt-4">
                {track.authors.map((a: any) => a.name).join(", ")}
              </p>
            )}

            {track.genre && <p className="text-neutral-400 mt-2">Genre: {track.genre}</p>}
            {track.duration && <p className="text-neutral-400 mt-2">Duration: {track.duration}</p>}
            {track.description && <p className="text-neutral-300 mt-4">{track.description}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-bold">Unsupported shared content</h1>
        <p className="text-neutral-400 mt-3">This shared link points to an unsupported resource.</p>
      </div>
    </div>
  );
}
