import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../../utils/api';
import socketService from '../../utils/socket';

export default function MessagesTab() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();

    // Listen for new messages to update conversation list
    socketService.onNewMessage(({ conversationId, message }) => {
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.conversationId === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              unreadCount: message.isSent ? conv.unreadCount : conv.unreadCount + 1,
              updatedAt: message.createdAt || message.created_at || new Date().toISOString()


            };
          }
          return conv;
        });
        // Sort by updated time
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });

    return () => {
      socketService.off('new_message');
    };
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // This week
    if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Older
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) {
      return 'Start a conversation';
    }
    
    if (conv.lastMessage.type === 'voice') {
      return '🎤 Voice message';
    }
    
    const prefix = conv.lastMessage.isSent ? '' : '';
    return prefix + (conv.lastMessage.content || '');
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery) {
      const name = conv.otherUser.name.toLowerCase();
      if (!name.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    
    // Tab filter
    if (activeFilter === 'Unread') {
      return conv.unreadCount > 0;
    }
    
    return true;
  });

  const handleChatClick = (conv) => {
    navigate('/chat-conversation', { 
      state: { 
        conversationId: conv.conversationId,
        otherUser: conv.otherUser
      } 
    });
  };

  return (
    <div
      className="h-screen overflow-y-auto bg-cover bg-center bg-no-repeat pb-20 scrollbar-hide"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/bgs/faceverifybg.png')`
      }}
    >
      {/* Header */}
      <div className="pt-12 pb-4 px-6">
        <h1 className="text-white text-2xl font-semibold text-center mb-4">Chats</h1>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search for messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/60 focus:outline-none focus:border-white/40"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-3">
          {['All', 'Unread'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === filter
                ? 'bg-white/20 text-white backdrop-blur-md border border-white/30'
                : 'bg-white/10 text-white/70 backdrop-blur-md border border-white/10'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="px-6">
        {loading ? (
          <div className="text-center text-white/60 py-8">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            {searchQuery ? 'No conversations found' : 'No messages yet. Start by matching with someone!'}
          </div>
        ) : (
          filteredConversations.map((conv, index) => (
            <div key={conv.conversationId}>
              <div
                className="py-4 flex items-center gap-3 cursor-pointer active:opacity-70"
                onClick={() => handleChatClick(conv)}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={conv.otherUser.profilePicUrl || '/chatperson.png'}
                    alt={conv.otherUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold text-base">{conv.otherUser.name}</h3>
                    <span className="text-white/60 text-sm flex-shrink-0">
                      {conv.lastMessage ? formatTime(conv.lastMessage.createdAt || conv.lastMessage.created_at) : ''}

                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.lastMessage?.isSent && (
                      <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <p className="text-white/60 text-sm truncate">{getLastMessagePreview(conv)}</p>
                  </div>
                </div>

                {/* Unread Badge */}
                {conv.unreadCount > 0 && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">{conv.unreadCount}</span>
                  </div>
                )}
              </div>
              {/* Separator line */}
              {index < filteredConversations.length - 1 && (
                <div className="border-b border-white/20" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 