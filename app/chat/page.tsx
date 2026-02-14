"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { TURFS } from "@/lib/zevo-data";
import {
  getArenaChatMessages,
  getArenaChatRooms,
  getProfile,
  saveArenaChatMessages,
  saveArenaChatRooms,
  type ArenaChatRoom,
  type ArenaRoomMessage,
  type StoredProfile
} from "@/lib/zevo-storage";

export default function ChatPage() {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [rooms, setRooms] = useState<ArenaChatRoom[]>([]);
  const [messages, setMessages] = useState<ArenaRoomMessage[]>([]);

  const [newRoomArenaId, setNewRoomArenaId] = useState(TURFS[0].id);
  const [newRoomTopic, setNewRoomTopic] = useState("");

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomMessageInput, setRoomMessageInput] = useState("");
  const [showInterestedOnly, setShowInterestedOnly] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setRooms(getArenaChatRooms());
    setMessages(getArenaChatMessages());

    const onStorage = () => {
      setRooms(getArenaChatRooms());
      setMessages(getArenaChatMessages());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const selectedRoomMessages = useMemo(() => {
    if (!selectedRoomId) return [];
    return messages.filter((message) => message.roomId === selectedRoomId);
  }, [messages, selectedRoomId]);

  const visibleRooms = useMemo(() => {
    if (!showInterestedOnly || !profile) return rooms;
    return rooms.filter((room) => profile.interests.includes(room.sport));
  }, [rooms, showInterestedOnly, profile]);

  const createArenaChatRoom = () => {
    if (!profile) return;

    const arena = TURFS.find((item) => item.id === newRoomArenaId) ?? TURFS[0];
    const topic = newRoomTopic.trim() || `Discussion for ${arena.name}`;

    const room: ArenaChatRoom = {
      id: `room_${Date.now()}`,
      arenaId: arena.id,
      arenaName: arena.name,
      sport: arena.sport,
      topic,
      createdBy: profile.name,
      createdAt: new Date().toISOString()
    };

    const updatedRooms = [room, ...rooms].slice(0, 300);
    setRooms(updatedRooms);
    saveArenaChatRooms(updatedRooms);
    setSelectedRoomId(room.id);
    setNewRoomTopic("");
  };

  const sendRoomMessage = () => {
    if (!profile || !selectedRoomId || !roomMessageInput.trim()) return;

    const message: ArenaRoomMessage = {
      id: `room_msg_${Date.now()}`,
      roomId: selectedRoomId,
      senderName: profile.name,
      text: roomMessageInput.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedMessages = [...messages, message].slice(-1000);
    setMessages(updatedMessages);
    saveArenaChatMessages(updatedMessages);
    setRoomMessageInput("");
  };

  if (!profile) {
    return (
      <PageShell>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h1 className="text-3xl font-black">Public Chat</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Create your profile to unlock arena chat rooms and community discussions.
          </p>
          <Link href="/profile" className="mt-4 inline-block rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900">
            Go To Profile
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
                const interested = profile.interests.includes(room.sport);
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
                    <p className="font-semibold">{room.arenaName}</p>
                    <p className="text-xs text-zinc-400">{room.sport} • {room.topic}</p>
                    <p className="text-[11px] text-zinc-500">Created by {room.createdBy}</p>
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
          {!selectedRoom ? (
            <p className="mt-3 text-sm text-zinc-400">Select an arena chat room to start asking questions and discussing plans.</p>
          ) : (
            <>
              <div className="mt-2 rounded-xl border border-zinc-700 bg-zinc-800/70 p-2">
                <p className="text-sm font-semibold">{selectedRoom.arenaName}</p>
                <p className="text-xs text-zinc-400">{selectedRoom.sport} • {selectedRoom.topic}</p>
              </div>

              <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
                {selectedRoomMessages.length === 0 ? (
                  <p className="text-sm text-zinc-400">No messages yet. Start the conversation.</p>
                ) : (
                  selectedRoomMessages.map((message) => (
                    <div key={message.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2 text-sm">
                      <p className="font-semibold">{message.senderName}</p>
                      <p className="text-xs text-zinc-500">{new Date(message.createdAt).toLocaleString()}</p>
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
