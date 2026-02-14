"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/lib/supabase/client";
import { TURFS } from "@/lib/zevo-data";
import { getProfile } from "@/lib/zevo-storage";

type ArenaChatRoom = {
  id: string;
  arena_id: string;
  arena_name: string;
  sport: string;
  topic: string;
  created_by_user_id: string;
  created_by_email: string;
  created_at: string;
};

type MessageRecord = {
  id: string;
  room_id: string;
  user_id: string;
  user_email: string;
  sender_name: string;
  text: string;
  created_at: string;
};

export default function ChatPage() {
  const { user, loading, isAuthenticated } = useUser();

  const [rooms, setRooms] = useState<ArenaChatRoom[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [chatStatus, setChatStatus] = useState("Create or join an arena room to discuss plans.");

  const [newRoomArenaId, setNewRoomArenaId] = useState(TURFS[0].id);
  const [newRoomTopic, setNewRoomTopic] = useState("");

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomMessageInput, setRoomMessageInput] = useState("");
  const [showInterestedOnly, setShowInterestedOnly] = useState(false);

  const localProfile = useMemo(() => getProfile(), []);

  const visibleRooms = useMemo(() => {
    if (!showInterestedOnly || !localProfile) return rooms;
    return rooms.filter((room) => localProfile.interests.includes(room.sport as never));
  }, [rooms, showInterestedOnly, localProfile]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadRooms = async () => {
      const { data, error } = await supabase
        .from("arena_chat_rooms")
        .select("id, arena_id, arena_name, sport, topic, created_by_user_id, created_by_email, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setChatStatus(error.message);
        return;
      }

      const nextRooms = (data ?? []) as ArenaChatRoom[];
      setRooms(nextRooms);
      if (!selectedRoomId && nextRooms.length > 0) {
        setSelectedRoomId(nextRooms[0].id);
      }
    };

    loadRooms();
  }, [isAuthenticated, selectedRoomId]);

  useEffect(() => {
    if (!isAuthenticated || !selectedRoomId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, room_id, user_id, user_email, sender_name, text, created_at")
        .eq("room_id", selectedRoomId)
        .order("created_at", { ascending: true });

      if (error) {
        setChatStatus(error.message);
        return;
      }

      setMessages((data ?? []) as MessageRecord[]);
    };

    loadMessages();
  }, [isAuthenticated, selectedRoomId]);

  const createArenaChatRoom = async () => {
    if (!user) return;

    const arena = TURFS.find((item) => item.id === newRoomArenaId) ?? TURFS[0];
    const topic = newRoomTopic.trim() || `Discussion for ${arena.name}`;

    const { data, error } = await supabase
      .from("arena_chat_rooms")
      .insert({
        arena_id: arena.id,
        arena_name: arena.name,
        sport: arena.sport,
        topic,
        created_by_user_id: user.id,
        created_by_email: user.email ?? "unknown@zevo.app"
      })
      .select("id, arena_id, arena_name, sport, topic, created_by_user_id, created_by_email, created_at")
      .single();

    if (error) {
      setChatStatus(error.message);
      return;
    }

    const room = data as ArenaChatRoom;
    setRooms((current) => [room, ...current]);
    setSelectedRoomId(room.id);
    setNewRoomTopic("");
    setChatStatus("Arena room created. You can start discussion now.");
  };

  const sendRoomMessage = async () => {
    if (!user || !selectedRoomId || !roomMessageInput.trim()) return;

    const senderName =
      (user.user_metadata?.username as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "Zevo User";

    const { data, error } = await supabase
      .from("messages")
      .insert({
        room_id: selectedRoomId,
        user_id: user.id,
        user_email: user.email ?? "unknown@zevo.app",
        sender_name: senderName,
        text: roomMessageInput.trim()
      })
      .select("id, room_id, user_id, user_email, sender_name, text, created_at")
      .single();

    if (error) {
      setChatStatus(error.message);
      return;
    }

    setMessages((current) => [...current, data as MessageRecord]);
    setRoomMessageInput("");
  };

  if (loading) {
    return (
      <PageShell>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h1 className="text-3xl font-black">Public Arena Chat</h1>
          <p className="mt-2 text-sm text-zinc-400">Checking your session...</p>
        </section>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h1 className="text-3xl font-black">Public Arena Chat</h1>
          <p className="mt-2 text-sm text-zinc-400">Please login to join the conversation.</p>
          <Link href="/profile" className="mt-4 inline-block rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900">
            Go To Profile Login
          </Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">Public Arena Chat</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Create chat rooms for specific arenas so interested players can join, ask questions, and plan together.
        </p>
        <p className="mt-3 text-xs text-zinc-300">{chatStatus}</p>
      </section>

      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold">Create Arena Chat Room</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select
            value={newRoomArenaId}
            onChange={(e) => setNewRoomArenaId(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          >
            {TURFS.map((arena) => (
              <option key={arena.id} value={arena.id}>
                {arena.name} - {arena.sport}
              </option>
            ))}
          </select>
          <input
            value={newRoomTopic}
            onChange={(e) => setNewRoomTopic(e.target.value)}
            placeholder="Room topic (e.g. Saturday 7 AM planning)"
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <button
          type="button"
          onClick={createArenaChatRoom}
          className="mt-3 rounded-xl bg-neon px-4 py-2 text-xs font-bold text-zinc-900"
        >
          Create Chat Room
        </button>
      </section>

      <section className="mb-3">
        <button
          type="button"
          onClick={() => setShowInterestedOnly((prev) => !prev)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            showInterestedOnly
              ? "border-neon bg-neon text-zinc-900"
              : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          {showInterestedOnly ? "Showing My Interests" : "Show Only My Interested Arenas"}
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <h2 className="text-sm font-semibold">Arena Chat Rooms</h2>
          <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto">
            {visibleRooms.length === 0 ? (
              <p className="text-sm text-zinc-400">No chat rooms found.</p>
            ) : (
              visibleRooms.map((room) => {
                const interested = localProfile?.interests.includes(room.sport as never);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                      selectedRoomId === room.id
                        ? "border-neon bg-neon/10 text-zinc-100"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <p className="font-semibold">{room.arena_name}</p>
                    <p className="text-xs text-zinc-400">{room.sport} • {room.topic}</p>
                    <p className="text-[11px] text-zinc-500">Created by {room.created_by_email}</p>
                    {interested ? (
                      <p className="mt-1 inline-flex rounded-full border border-neon/70 bg-neon/10 px-2 py-0.5 text-[10px] font-semibold text-neon">
                        Matches your interests
                      </p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <h2 className="text-sm font-semibold">Room Discussion</h2>
          {!selectedRoomId ? (
            <p className="mt-3 text-sm text-zinc-400">Select an arena chat room to start asking questions and discussing plans.</p>
          ) : (
            <>
              <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-zinc-400">No messages yet. Start the conversation.</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2 text-sm">
                      <p className="font-semibold">{message.sender_name}</p>
                      <p className="text-xs text-zinc-500">{new Date(message.created_at).toLocaleString()}</p>
                      <p className="mt-1">{message.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={roomMessageInput}
                  onChange={(e) => setRoomMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendRoomMessage();
                  }}
                  placeholder="Ask questions or discuss your plan..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                />
                <button
                  type="button"
                  onClick={sendRoomMessage}
                  className="rounded-xl bg-neon px-4 py-2 text-xs font-bold text-zinc-900"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </article>
      </section>
    </PageShell>
  );
}
