"use client";

import { useState } from "react";

import { PageShell } from "@/components/zevo/page-shell";
import { appendHelpRequest } from "@/lib/zevo-storage";

export default function AboutPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Need help? Send us your query.");

  const submit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("Please fill all fields.");
      return;
    }

    appendHelpRequest({ name: name.trim(), email: email.trim(), message: message.trim(), submittedAt: new Date().toISOString() });
    setMessage("");
    setStatus("Request submitted. ZEVO support will reach you soon.");
  };

  return (
    <PageShell>
      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-black">About ZEVO</h1>
        <p className="mt-2 text-sm text-zinc-400">
          ZEVO helps players discover local venues, coordinate game timings, and build active communities.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Support</h2>
          <p className="mt-2 text-sm text-zinc-300">Support hours: 9 AM to 9 PM, Monday to Saturday.</p>
          <p className="text-sm text-zinc-300">Email: support@zevo.app</p>
          <p className="text-sm text-zinc-300">WhatsApp: +91-00000-00000</p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold">Ask For Help</h2>
          <p className="mt-2 text-xs text-zinc-400">{status}</p>
          <div className="mt-3 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="How can we help you?"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            />
            <button type="button" onClick={submit} className="rounded-xl bg-neon px-4 py-2 text-sm font-bold text-zinc-900">
              Submit
            </button>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
