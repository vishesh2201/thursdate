import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI, userAPI } from '../../utils/api';
import socketService from '../../utils/socket';
import { Clock } from "lucide-react";

export default function MessagesTab() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [conversations, setConversations] = useState([]);
  const [mutualMatches, setMutualMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Get current user ID from token
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).userId;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    loadConversations();
    loadMutualMatches();

    // Listen for new messages to update conversation list
    socketService.onNewMessage(({ conversationId, message }) => {
      const currentUserId = getCurrentUserId();
      // Calculate isSent based on current user
      const isSent = message.senderId === currentUserId;
      console.log('MessagesTab received new message:', { conversationId, message, currentUserId, isSent });
      
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.conversationId === conversationId) {
            return {
              ...conv,
              lastMessage: { ...message, isSent },
              unreadCount: isSent ? conv.unreadCount : conv.unreadCount + 1,
              updatedAt: message.createdAt || message.created_at || new Date().toISOString()


            };
          }
          return conv;
        });
        // Sort by updated time
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });

    // Listen for match moved to chat (when first message sent or replied)
    socketService.onMatchMovedToChat(({ conversationId, otherUserId }) => {
      console.log('Match moved to chat:', { conversationId, otherUserId });
      // Reload matched profiles to remove the moved match
      loadMutualMatches();
    });

    // Listen for read receipts to update message status
    socketService.onMessagesRead(({ conversationId, messageIds }) => {
      console.log('MessagesTab received messages_read:', { conversationId, messageIds });
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.conversationId === conversationId && conv.lastMessage && messageIds.includes(conv.lastMessage.id)) {
            console.log('Updating lastMessage status to READ for conv:', conversationId, 'msg:', conv.lastMessage.id);
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                status: 'READ',
                isRead: true
              }
            };
          }
          return conv;
        });
      });
    });

    // Listen for delivery receipts to update message status
    socketService.on('message_delivered', ({ conversationId, messageId }) => {
      console.log('MessagesTab received message_delivered:', { conversationId, messageId });
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.conversationId === conversationId && conv.lastMessage && conv.lastMessage.id === messageId) {
            console.log('Updating lastMessage status to DELIVERED for conv:', conversationId, 'msg:', messageId);
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                status: 'DELIVERED'
              }
            };
          }
          return conv;
        });
      });
    });

    return () => {
      socketService.off('new_message');
      socketService.off('match_moved_to_chat');
      socketService.off('messages_read');
      socketService.off('message_delivered');
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

  const loadMutualMatches = async () => {
    try {
      const data = await userAPI.getMatchedProfiles();
      setMutualMatches(data.matches || []);
    } catch (error) {
      console.error('Failed to load mutual matches:', error);
    }
  };

  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 0;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays); // Don't show negative days
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return '';
    }
    
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

      {/* Matched Users Section */}
    

{mutualMatches.length > 0 && (
  <div className="px-6 mb-6">
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
      {mutualMatches.map((match) => {
        const daysRemaining = calculateDaysRemaining(match.expiresAt);

        return (
          <div
            key={match.id}
            className="flex-shrink-0 w-20 cursor-pointer active:opacity-70"
            onClick={() => {
              chatAPI.createConversation(match.id)
                .then(({ conversationId }) => {
                  navigate("/chat-conversation", {
                    state: {
                      conversationId,
                      otherUser: {
                        id: match.id,
                        name: `${match.firstName} ${match.lastName}`,
                        profilePicUrl: match.profilePicUrl
                      }
                    }
                  });
                })
                .catch(err =>
                  console.error("Failed to create conversation:", err)
                );
            }}
          >
            <div className="relative flex flex-col items-center">
              <img
                src={match.profilePicUrl || "/chatperson.png"}
                alt={`${match.firstName} ${match.lastName}`}
                className="w-14 h-14 rounded-[14px] object-cover"
              />

              <div className="absolute -bottom-2 flex items-center gap-1 bg-white text-black text-[10px] font-semibold px-2 py-[2px] rounded-full shadow">
                <Clock size={12} strokeWidth={2} />
                <span>{daysRemaining}d left</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}


      {/* Filter Tabs */}
      <div className="px-6 mb-4 -mt-2">
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
      <div className="px-6 -mt-3">
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
                      {conv.lastMessage ? formatTime(conv.lastMessage.time || conv.lastMessage.createdAt || conv.lastMessage.created_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.lastMessage?.isSent && (
                      <>
                        {console.log('Rendering tick for conv:', conv.conversationId, 'status:', conv.lastMessage.status, 'isRead:', conv.lastMessage.isRead)}
                        {conv.lastMessage.status === 'READ' ? (
                          // Double blue ticks for read messages
                          <div className="flex -space-x-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : conv.lastMessage.status === 'DELIVERED' ? (
                          // Double grey ticks for delivered messages
                          <div className="flex -space-x-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          // Single tick for sent but not delivered
                          <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </>
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