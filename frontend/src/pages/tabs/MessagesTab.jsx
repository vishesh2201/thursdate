import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MessagesTab() {
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  // Mock data for stories
  const stories = [
    { id: 1, name: 'Sarah', image: '/chatperson.png', duration: '7d' },
    { id: 2, name: 'Mike', image: '/chatperson.png', duration: '7d' },
    { id: 3, name: 'Emma', image: '/chatperson.png', duration: '7d' },
    { id: 4, name: 'John', image: '/chatperson.png', duration: '7d' },
    { id: 5, name: 'Lisa', image: '/chatperson.png', duration: '7d' },
  ];

  // Mock data for chats
  const allChats = [
    {
      id: 0,
      name: 'Jacob Jones',
      message: 'New match! Play games to connect',
      time: 'Just now',
      image: '/chatperson.png',
      isNewMatch: true,
      isHidden: false
    },
    {
      id: 1,
      name: 'Sarah Johnson',
      message: "I'll be free all afternoon, just let me know...",
      time: '4:00 pm',
      image: '/chatperson.png',
      unread: 4,
      hasCheckmark: true,
      isHidden: false
    },
    {
      id: 2,
      name: 'Jacob Jones',
      message: 'Sure, what time are you free this monda...',
      time: '12:34 pm',
      image: '/chatperson.png',
      hasCheckmark: true,
      isHidden: false
    },
    {
      id: 3,
      name: 'David Lee',
      message: 'How about we catch up over coffee nex...',
      time: '12:34 pm',
      image: '/chatperson.png',
      hasCheckmark: true,
      isHidden: false
    },
    {
      id: 4,
      name: 'Michael Brown',
      message: "Let's meet tomorrow instead, does that...",
      time: '3:20 pm',
      image: '/chatperson.png',
      unread: 3,
      isHidden: false
    },
    {
      id: 5,
      name: 'Anna Garcia',
      message: 'I can do any time after 2 pm on Wedne...',
      time: '6:30 pm',
      image: '/chatperson.png',
      unread: 6,
      isHidden: false
    },
    {
      id: 6,
      name: 'Emily Wilson',
      message: 'That sounds great! See you then',
      time: 'Yesterday',
      image: '/chatperson.png',
      hasCheckmark: true,
      isHidden: false
    },
    {
      id: 7,
      name: 'Ryan Martinez',
      message: 'Thanks for the recommendation!',
      time: 'Yesterday',
      image: '/chatperson.png',
      unread: 1,
      isHidden: false
    },
    {
      id: 8,
      name: 'Jessica Taylor',
      message: 'I think that would work perfectly',
      time: 'Tuesday',
      image: '/chatperson.png',
      hasCheckmark: true,
      isHidden: true
    },
    {
      id: 9,
      name: 'Chris Anderson',
      message: 'Looking forward to it!',
      time: 'Tuesday',
      image: '/chatperson.png',
      unread: 2,
      isHidden: true
    },
    {
      id: 10,
      name: 'Olivia Thomas',
      message: 'Can we reschedule for next week?',
      time: 'Monday',
      image: '/chatperson.png',
      hasCheckmark: true,
      isHidden: false
    },
    {
      id: 11,
      name: 'Daniel Moore',
      message: "I'll bring the documents with me",
      time: 'Monday',
      image: '/chatperson.png',
      unread: 5,
      isHidden: true
    },
    {
      id: 12,
      name: 'Sophia White',
      message: 'Perfect timing! Thanks',
      time: 'Sunday',
      image: '/chatperson.png',
      hasCheckmark: true,
      isHidden: false
    },
  ];

  // Filter chats based on active filter
  const chats = allChats.filter(chat => {
    if (activeFilter === 'All') return !chat.isHidden;
    if (activeFilter === 'Unread') return chat.unread && !chat.isHidden;
    if (activeFilter === 'Hidden') return chat.isHidden;
    return true;
  }); return (
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

      {/* Stories Section */}
      <div className="px-6 mb-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 p-[2px]">
                <div className="w-full h-full rounded-full bg-[#2C2C2E] p-[2px]">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#2C2C2E] rounded-full px-2 py-0.5 border border-white/20">
                <span className="text-white text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {story.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-3">
          {['All', 'Unread', 'Hidden'].map((filter) => (
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
        {chats.map((chat, index) => (
          <div key={chat.id}>
            <div
              className="py-4 flex items-center gap-3 cursor-pointer active:opacity-70"
              onClick={() => navigate(chat.isNewMatch ? '/game-connection' : '/chat-conversation', { state: { chat } })}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={chat.image}
                  alt={chat.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-semibold text-base">{chat.name}</h3>
                  <span className="text-white/60 text-sm flex-shrink-0">{chat.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  {chat.hasCheckmark && (
                    <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <p className="text-white/60 text-sm truncate">{chat.message}</p>
                </div>
              </div>

              {/* Unread Badge */}
              {chat.unread && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{chat.unread}</span>
                </div>
              )}
            </div>
            {/* Separator line */}
            {index < chats.length - 1 && (
              <div className="border-b border-white/20" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 