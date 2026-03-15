"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Mail, Phone } from "lucide-react";

import { PageShell } from "@/components/zevo/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { appendHelpRequest } from "@/lib/zevo-storage";

const faqs = [
  { q: "How fast are bookings confirmed?", a: "Most confirmations are shared within a few minutes via real-time slot locking." },
  { q: "Can I switch sports anytime?", a: "Yes — edit your profile interests whenever you want. Group visibility updates instantly." },
  { q: "Is chat public?", a: "Chat rooms are visible to all signed-in users. You can filter by your interests." },
];

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
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel mb-8 p-8"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-neon" />
          <div>
            <h1 className="text-3xl font-black">About ZEVO</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Discover local venues, coordinate game timings, and build active communities.
            </p>
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <SectionHeader title="Frequently Asked" subtitle="Quick answers to common questions" />
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {faqs.map((item, i) => (
          <motion.article
            key={item.q}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="mb-2 flex items-center gap-2">
              <HelpCircle size={14} className="text-neon" />
              <p className="text-sm font-semibold text-zinc-100">{item.q}</p>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">{item.a}</p>
          </motion.article>
        ))}
      </div>

      {/* Support + Help Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold">Support</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Phone size={14} className="text-zinc-500" />
              <span>Support hours: 9 AM to 9 PM, Mon–Sat</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Mail size={14} className="text-zinc-500" />
              <span>support@zevo.app</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Phone size={14} className="text-zinc-500" />
              <span>WhatsApp: +91-00000-00000</span>
            </div>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold">Ask For Help</h2>
          <p className="mt-2 text-xs text-zinc-400">{status}</p>
          <div className="mt-4 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="input-field" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="How can we help you?" className="input-field" />
            <button type="button" onClick={submit} className="btn-primary w-full">Submit</button>
          </div>
        </motion.article>
      </div>
    </PageShell>
  );
}
