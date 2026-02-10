// File: src/pages/Community.jsx
import React, { useState, useEffect } from 'react';

export default function Community() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('communityMessages') || '[]');
    setMessages(savedMessages);
  }, []);

  const categories = [
    { value: 'general', label: 'General Discussion', icon: '💬' },
    { value: 'programs', label: 'Programs & Events', icon: '📅' },
    { value: 'volunteer', label: 'Volunteer Opportunities', icon: '🤝' },
    { value: 'health', label: 'Health & Wellness', icon: '🏥' },
    { value: 'environment', label: 'Environment', icon: '🌱' },
    { value: 'feedback', label: 'Feedback & Suggestions', icon: '💡' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const message = {
        ...newMessage,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        replies: []
      };

      const updatedMessages = [message, ...messages];
      setMessages(updatedMessages);
      localStorage.setItem('communityMessages', JSON.stringify(updatedMessages));

      // Reset form
      setNewMessage({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
      setShowForm(false);

    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryInfo = (categoryValue) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-white">
      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Community Forum</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Connect, share ideas, and collaborate with fellow community members
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-primary-600">Community Messages</h2>
            <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-semibold">
              {messages.length} messages
            </span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors duration-200 font-semibold"
          >
            {showForm ? 'Cancel' : '+ New Message'}
          </button>
        </div>

        {/* New Message Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-primary-600 mb-4">Post a New Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newMessage.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newMessage.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={newMessage.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={newMessage.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Brief subject line"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  name="message"
                  value={newMessage.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Share your thoughts, questions, or ideas with the community..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                  }`}
                >
                  {isSubmitting ? 'Posting...' : 'Post Message'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Messages List */}
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No messages yet</h3>
              <p className="text-gray-500">Be the first to start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const categoryInfo = getCategoryInfo(message.category);
              return (
                <div key={message.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {message.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{message.name}</h4>
                        <p className="text-sm text-gray-500">{formatDate(message.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                      <span>{categoryInfo.icon}</span>
                      <span className="text-sm font-medium text-gray-600">{categoryInfo.label}</span>
                    </div>
                  </div>
                  
                  <h5 className="text-lg font-semibold text-primary-600 mb-2">{message.subject}</h5>
                  <p className="text-gray-700 leading-relaxed">{message.message}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Reply
                      </button>
                      <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Like
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Guidelines */}
        <div className="mt-12 bg-primary-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary-600 mb-3">Community Guidelines</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• Be respectful and constructive in your interactions</li>
            <li>• Stay on topic and use appropriate categories</li>
            <li>• Share relevant information and resources</li>
            <li>• Help build a positive community environment</li>
            <li>• Report any inappropriate content to our team</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
