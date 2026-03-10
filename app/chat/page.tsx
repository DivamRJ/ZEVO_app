 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/utils/supabase/client";

type ArenaChatRoomRow = {
  id: string;
  arena_id: string;
  arena_name: string;
  sport: string;
  topic: string;
  created_by: string;
  created_at: string;
};

type ArenaRoomMessageRow = {
  id: string;
  room_id: string;
  user_id: string;
  sender_name: string;
  body: string;
  created_at: string;
};

export default function ChatPage() {
  const { user, loading, isAuthenticated } = useUser();

  const [rooms, setRooms] = useState<ArenaChatRoomRow[]>([]);
  const [messages, setMessages] = useState<ArenaRoomMessageRow[]>([]);
  const [arenas, setArenas] = useState<{ id: string; name: string; location: string; sport: string }[]>([]);
  const [chatStatus, setChatStatus] = useState("Create or join an arena room to discuss plans.");

  const [newRoomArenaId, setNewRoomArenaId] = useState("");
  const [newRoomTopic, setNewRoomTopic] = useState("");

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomMessageInput, setRoomMessageInput] = useState("");
  const [showInterestedOnly, setShowInterestedOnly] = useState(false);

  const userInterests = user?.interests || [];

  const visibleRooms = useMemo(() => {
    if (!showInterestedOnly || userInterests.length === 0) return rooms;
    return rooms.filter((room) => userInterests.includes(room.sport));
  }, [rooms, showInterestedOnly, userInterests]);

  useEffect(() => {
    if (!isAuthenticated) {
      setArenas([]);
      setNewRoomArenaId("");
      return;
    }

    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("turfs")
          .select("id, name, location")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const arenaRows =
          data?.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            location: row.location as string,
            sport: "General"
          })) ?? [];

        setArenas(arenaRows);
        if (arenaRows.length) {
          setNewRoomArenaId((current) => current || arenaRows[0].id);
        }
      } catch {
        setArenas([]);
      }
    };

    void loadTurfs();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRooms([]);
      setSelectedRoomId(null);
      return;
    }

    const loadRooms = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("arena_chat_rooms")
        .select("id, arena_id, arena_name, sport, topic, created_by, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRooms(
          data.map((row) => ({
            id: row.id as string,
            arena_id: row.arena_id as string,
            arena_name: row.arena_name as string,
            sport: row.sport as string,
            topic: row.topic as string,
            created_by: row.created_by as string,
            created_at: row.created_at as string
          }))
        );
      }
    };

    void loadRooms();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
      return;
    }

    if (selectedRoomId && !rooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(rooms[0]?.id ?? null);
    }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!isAuthenticated || !selectedRoomId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("arena_chat_messages")
        .select("id, room_id, user_id, sender_name, body, created_at")
        .eq("room_id", selectedRoomId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(
          data.map((row) => ({
            id: row.id as string,
            room_id: row.room_id as string,
            user_id: row.user_id as string,
            sender_name: row.sender_name as string,
            body: row.body as string,
            created_at: row.created_at as string
          }))
        );
      }
    };

    void loadMessages();
  }, [isAuthenticated, selectedRoomId]);

  const createArenaChatRoom = () => {
    if (!user || arenas.length === 0) return;

    const arena = arenas.find((item) => item.id === newRoomArenaId) ?? arenas[0];
    const topic = newRoomTopic.trim() || `Discussion for ${arena.name}`;
    const supabase = createClient();

    supabase
      .from("arena_chat_rooms")
      .insert({
        arena_id: arena.id,
        arena_name: arena.name,
        sport: "General",
        topic,
        created_by: user.id
      })
      .select("id, arena_id, arena_name, sport, topic, created_by, created_at")
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;

        const nextRoom: ArenaChatRoomRow = {
          id: data.id as string,
          arena_id: data.arena_id as string,
          arena_name: data.arena_name as string,
          sport: data.sport as string,
          topic: data.topic as string,
          created_by: data.created_by as string,
          created_at: data.created_at as string
        };

        setRooms((current) => [nextRoom, ...current]);
        setSelectedRoomId(nextRoom.id);
        setNewRoomTopic("");
        setChatStatus("Arena room created. You can start discussion now.");
      });
  };

  const sendRoomMessage = () => {
    if (!user || !selectedRoomId || !roomMessageInput.trim()) return;
    const supabase = createClient();

    supabase
      .from("arena_chat_messages")
      .insert({
        room_id: selectedRoomId,
        user_id: user.id,
        sender_name: user.name || user.email,
        body: roomMessageInput.trim()
      })
      .select("id, room_id, user_id, sender_name, body, created_at")
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;

        const nextMessage: ArenaRoomMessageRow = {
          id: data.id as string,
          room_id: data.room_id as string,
          user_id: data.user_id as string,
          sender_name: data.sender_name as string,
          body: data.body as string,
          created_at: data.created_at as string
        };

        setMessages((current) => [...current, nextMessage]);
        setRoomMessageInput("");
      });
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

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Live Rooms</p>
          <p className="mt-2 text-lg font-semibold text-zinc-100">{rooms.length}</p>
        </article>
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Selected Room Messages</p>
          <p className="mt-2 text-lg font-semibold text-zinc-100">{messages.length}</p>
        </article>
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Interest Filter</p>
          <p className="mt-2 text-lg font-semibold text-zinc-100">{showInterestedOnly ? "On" : "Off"}</p>
        </article>
      </section>

      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold">Create Arena Chat Room</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select
            value={newRoomArenaId}
            onChange={(e) => setNewRoomArenaId(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          >
            {arenas.map((arena) => (
              <option key={arena.id} value={arena.id}>
                {arena.name} - {arena.location}
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
                const interested = userInterests.includes(room.sport);
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
                    <p className="text-xs text-zinc-400">
                      {room.sport} • {room.topic}
                    </p>
                    <p className="text-[11px] text-zinc-500">Created by {room.created_by}</p>
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
                      <p className="mt-1">{message.body}</p>
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
