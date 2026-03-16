// File: src/pages/Community.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const categories = [
  { value: 'general', label: 'General Discussion', icon: '💬', accent: '#a78bfa' },
  { value: 'programs', label: 'Programs & Events', icon: '📅', accent: '#00d9ff' },
  { value: 'volunteer', label: 'Volunteer', icon: '🤝', accent: '#00f594' },
  { value: 'health', label: 'Health & Wellness', icon: '🏥', accent: '#f472b6' },
  { value: 'environment', label: 'Environment', icon: '🌱', accent: '#4ade80' },
  { value: 'feedback', label: 'Feedback', icon: '💡', accent: '#fbbf24' },
];

export default function Community() {
  const [messages, setMessages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newMessage, setNewMessage] = useState({ name: '', email: '', subject: '', message: '', category: 'general' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('communityMessages') || '[]');
    setMessages(saved);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMessage((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    const msg = { ...newMessage, id: Date.now(), timestamp: new Date().toISOString() };
    const updated = [msg, ...messages];
    setMessages(updated);
    localStorage.setItem('communityMessages', JSON.stringify(updated));
    setNewMessage({ name: '', email: '', subject: '', message: '', category: 'general' });
    setShowForm(false);
    setIsSubmitting(false);
  };

  const getCat = (val) => categories.find((c) => c.value === val) || categories[0];
  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen" style={{ background: '#060f1e' }}>
      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-32 pb-24 hero-grid overflow-hidden" style={{ background: '#030812' }}>
        <div className="glow-orb w-[500px] h-[500px] -top-40 right-1/4 opacity-25"
          style={{ background: 'rgba(167,139,250,0.2)' }} />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.p variants={fadeUp} className="section-label justify-center">Connect & Collaborate</motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-extrabold text-white mb-6">
              Community <span className="gradient-text">Forum</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-neutral-400 text-xl max-w-2xl mx-auto">
              Share ideas, ask questions, and collaborate with fellow community members.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-4xl">
        {/* ══ Action Bar ══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <h2 className="font-display text-2xl font-bold text-white">Conversations</h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-primary-500"
              style={{ background: 'rgba(0,245,148,0.1)', border: '1px solid rgba(0,245,148,0.2)' }}>
              {messages.length} posts
            </span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-ghost text-sm px-5 py-2.5' : 'btn-primary text-sm px-5 py-2.5'}
          >
            {showForm ? '✕ Cancel' : '+ New Post'}
          </button>
        </motion.div>

        {/* ══ Post Form ══ */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="glass rounded-2xl p-6 md:p-8"
                style={{ borderColor: 'rgba(0,245,148,0.15)' }}>
                <h3 className="font-display text-xl font-bold text-white mb-6">Share with the Community</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {['name', 'email'].map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
                          {field === 'name' ? 'Your Name' : 'Email'} *
                        </label>
                        <input
                          type={field === 'email' ? 'email' : 'text'}
                          name={field}
                          value={newMessage[field]}
                          onChange={handleInputChange}
                          required
                          className="input-dark text-sm"
                          placeholder={field === 'name' ? 'Your full name' : 'your@email.com'}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">Category *</label>
                      <select
                        name="category"
                        value={newMessage.category}
                        onChange={handleInputChange}
                        className="input-dark text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">Subject *</label>
                      <input
                        type="text"
                        name="subject"
                        value={newMessage.subject}
                        onChange={handleInputChange}
                        required
                        className="input-dark text-sm"
                        placeholder="Brief subject line"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">Message *</label>
                    <textarea
                      name="message"
                      value={newMessage.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="input-dark text-sm resize-none"
                      placeholder="Share your thoughts, questions, or ideas…"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="btn-ghost py-2.5 text-sm">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`btn-primary py-2.5 text-sm ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? 'Posting…' : 'Post Message'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Messages ══ */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
          {messages.length === 0 ? (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-16 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="font-display text-xl font-bold text-white mb-2">No posts yet</h3>
              <p className="text-neutral-500 text-sm">Be the first to start a conversation!</p>
            </motion.div>
          ) : (
            messages.map((msg) => {
              const cat = getCat(msg.category);
              return (
                <motion.div
                  key={msg.id}
                  variants={fadeUp}
                  className="glass rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                        style={{ background: `${cat.accent}15`, border: `1px solid ${cat.accent}30`, color: cat.accent }}>
                        {msg.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{msg.name}</p>
                        <p className="text-neutral-500 text-xs">{formatDate(msg.timestamp)}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${cat.accent}10`, border: `1px solid ${cat.accent}25`, color: cat.accent }}>
                      {cat.icon} {cat.label}
                    </span>
                  </div>
                  <h5 className="font-display font-bold text-white mb-2">{msg.subject}</h5>
                  <p className="text-neutral-400 text-sm leading-relaxed">{msg.message}</p>
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex gap-4">
                    {['Reply', 'Like'].map((action) => (
                      <button key={action} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary-500 transition-colors">
                        {action === 'Reply' ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                        {action}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* ══ Guidelines ══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 glass rounded-2xl p-6"
          style={{ borderColor: 'rgba(0,245,148,0.15)', background: 'rgba(0,245,148,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📋</span>
            <h3 className="font-display text-base font-bold text-white">Community Guidelines</h3>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {[
              'Be respectful and constructive',
              'Stay on topic — use appropriate categories',
              'Share relevant information and resources',
              'Help build a positive community environment',
              'Report inappropriate content to our team',
            ].map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                <span className="w-1 h-1 mt-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                {g}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
