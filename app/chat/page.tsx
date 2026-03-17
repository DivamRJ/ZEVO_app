"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Plus, Send, Users } from "lucide-react";

import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
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
    if (!isAuthenticated) { setArenas([]); setNewRoomArenaId(""); return; }
    const loadTurfs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("turfs").select("id, name, location").eq("is_active", true).order("created_at", { ascending: false });
        if (error) throw error;
        const arenaRows = data?.map((row) => ({ id: row.id as string, name: row.name as string, location: row.location as string, sport: "General" })) ?? [];
        setArenas(arenaRows);
        if (arenaRows.length) setNewRoomArenaId((current) => current || arenaRows[0].id);
      } catch { setArenas([]); }
    };
    void loadTurfs();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setRooms([]); setSelectedRoomId(null); return; }
    const loadRooms = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("arena_chat_rooms").select("id, arena_id, arena_name, sport, topic, created_by, created_at").order("created_at", { ascending: false });
      if (!error && data) {
        setRooms(data.map((row) => ({ id: row.id as string, arena_id: row.arena_id as string, arena_name: row.arena_name as string, sport: row.sport as string, topic: row.topic as string, created_by: row.created_by as string, created_at: row.created_at as string })));
      }
    };
    void loadRooms();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) { setSelectedRoomId(rooms[0].id); return; }
    if (selectedRoomId && !rooms.some((room) => room.id === selectedRoomId)) { setSelectedRoomId(rooms[0]?.id ?? null); }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!isAuthenticated || !selectedRoomId) { setMessages([]); return; }
    const supabase = createClient();

    // Initial load
    const loadMessages = async () => {
      const { data, error } = await supabase.from("arena_chat_messages").select("id, room_id, user_id, sender_name, body, created_at").eq("room_id", selectedRoomId).order("created_at", { ascending: true });
      if (!error && data) {
        setMessages(data.map((row) => ({ id: row.id as string, room_id: row.room_id as string, user_id: row.user_id as string, sender_name: row.sender_name as string, body: row.body as string, created_at: row.created_at as string })));
      }
    };
    void loadMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`room:${selectedRoomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "arena_chat_messages", filter: `room_id=eq.${selectedRoomId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setMessages((prev) => {
            // Avoid duplicates (optimistic insert already added it)
            if (prev.some((m) => m.id === (row.id as string))) return prev;
            return [...prev, { id: row.id as string, room_id: row.room_id as string, user_id: row.user_id as string, sender_name: row.sender_name as string, body: row.body as string, created_at: row.created_at as string }];
          });
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [isAuthenticated, selectedRoomId]);

  const createArenaChatRoom = () => {
    if (!user || arenas.length === 0) return;
    const arena = arenas.find((item) => item.id === newRoomArenaId) ?? arenas[0];
    const topic = newRoomTopic.trim() || `Discussion for ${arena.name}`;
    const supabase = createClient();
    supabase.from("arena_chat_rooms").insert({ arena_id: arena.id, arena_name: arena.name, sport: "General", topic, created_by: user.id }).select("id, arena_id, arena_name, sport, topic, created_by, created_at").single().then(({ data, error }) => {
      if (error || !data) return;
      const nextRoom: ArenaChatRoomRow = { id: data.id as string, arena_id: data.arena_id as string, arena_name: data.arena_name as string, sport: data.sport as string, topic: data.topic as string, created_by: data.created_by as string, created_at: data.created_at as string };
      setRooms((current) => [nextRoom, ...current]);
      setSelectedRoomId(nextRoom.id);
      setNewRoomTopic("");
      setChatStatus("Arena room created. Start discussing!");
    });
  };

  const sendRoomMessage = () => {
    if (!user || !selectedRoomId || !roomMessageInput.trim()) return;
    const supabase = createClient();
    supabase.from("arena_chat_messages").insert({ room_id: selectedRoomId, user_id: user.id, sender_name: user.name || user.email, body: roomMessageInput.trim() }).select("id, room_id, user_id, sender_name, body, created_at").single().then(({ data, error }) => {
      if (error || !data) return;
      const nextMessage: ArenaRoomMessageRow = { id: data.id as string, room_id: data.room_id as string, user_id: data.user_id as string, sender_name: data.sender_name as string, body: data.body as string, created_at: data.created_at as string };
      setMessages((current) => [...current, nextMessage]);
      setRoomMessageInput("");
    });
  };

  if (loading) {
    return (
      <PageShell>
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-black">Public Arena Chat</h1>
          <p className="mt-2 text-sm text-zinc-400">Checking your session…</p>
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-black">Public Arena Chat</h1>
          <p className="mt-2 text-sm text-zinc-400">Please login to join the conversation.</p>
          <Link href="/profile" className="btn-primary mt-4 inline-block">Go To Profile Login</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="glass-panel mb-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/15 p-2"><MessageCircle size={18} className="text-neon" /></div>
          <div>
            <h1 className="text-2xl font-black">Public Arena Chat</h1>
            <p className="mt-1 text-xs text-zinc-400">{chatStatus}</p>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Live Rooms", value: rooms.length, icon: <Users size={14} /> },
          { label: "Messages", value: messages.length, icon: <MessageCircle size={14} /> },
          { label: "Interest Filter", value: showInterestedOnly ? "On" : "Off", icon: null },
        ].map((item) => (
          <motion.article key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">{item.value}</p>
          </motion.article>
        ))}
      </div>

      {/* Create Room */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card mb-6 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Plus size={14} className="text-neon" />
          <h2 className="text-sm font-bold">Create Arena Chat Room</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={newRoomArenaId} onChange={(e) => setNewRoomArenaId(e.target.value)} className="input-field">
            {arenas.map((arena) => (<option key={arena.id} value={arena.id}>{arena.name} – {arena.location}</option>))}
          </select>
          <input value={newRoomTopic} onChange={(e) => setNewRoomTopic(e.target.value)} placeholder="Room topic (e.g. Saturday 7 AM planning)" className="input-field" />
        </div>
        <button type="button" onClick={createArenaChatRoom} className="btn-primary mt-3">Create Chat Room</button>
      </motion.section>

      {/* Filter toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowInterestedOnly((prev) => !prev)}
          className={showInterestedOnly ? "btn-primary text-xs" : "btn-secondary text-xs"}
        >
          {showInterestedOnly ? "Showing My Interests" : "Show Only My Interested Arenas"}
        </button>
      </div>

      {/* Rooms + Messages */}
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-card p-4">
          <SectionHeader title="Arena Chat Rooms" />
          <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto scrollbar-hide">
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
                    className={`w-full rounded-xl p-3 text-left text-sm transition-all duration-300 ${
                      selectedRoomId === room.id
                        ? "glass-card-glow border-neon/30 bg-neon/5"
                        : "glass-card hover:border-zinc-600"
                    }`}
                  >
                    <p className="font-semibold text-zinc-100">{room.arena_name}</p>
                    <p className="text-xs text-zinc-400">{room.sport} • {room.topic}</p>
                    <p className="text-[11px] text-zinc-500">Created by {room.created_by}</p>
                    {interested ? (
                      <p className="mt-1 inline-flex rounded-full border border-neon/40 bg-neon/10 px-2 py-0.5 text-[10px] font-semibold text-neon">
                        Matches your interests
                      </p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </article>

        <article className="glass-card p-4">
          <SectionHeader title="Room Discussion" />
          {!selectedRoomId ? (
            <p className="mt-3 text-sm text-zinc-400">Select a room to start the conversation.</p>
          ) : (
            <>
              <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-3 scrollbar-hide">
                {messages.length === 0 ? (
                  <p className="text-sm text-zinc-400">No messages yet. Start the conversation.</p>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-zinc-100">{msg.sender_name}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <p className="mt-1 text-zinc-300">{msg.body}</p>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={roomMessageInput}
                  onChange={(e) => setRoomMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendRoomMessage(); }}
                  placeholder="Type your message…"
                  className="input-field flex-1"
                />
                <button type="button" onClick={sendRoomMessage} className="btn-primary flex items-center gap-1.5">
                  <Send size={14} /> Send
                </button>
              </div>
            </>
          )}
        </article>
      </section>
    </PageShell>
  );
}
