import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ChatConversation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { chat } = location.state || {};
    const [message, setMessage] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hi! Jacob!!', time: '12:34 pm', isSent: false },
        { id: 2, text: 'Hi Sana!!', time: '12:34 pm', isSent: true },
        { id: 3, text: "How's your day?", time: '12:34 pm', isSent: false },
        { id: 4, text: 'Pretty chill. Just got back from work. You?', time: '12:34 pm', isSent: true },
        { id: 5, text: 'Same. Trying to survive emails 😅', time: '12:34 pm', isSent: false },
    ]);

    const handleSendMessage = () => {
        if (message.trim()) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const newMessage = {
                id: messages.length + 1,
                text: message,
                time: timeString.toLowerCase(),
                isSent: true
            };

            setMessages([...messages, newMessage]);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    return (
        <div
            className="h-screen flex flex-col bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/bgs/faceverifybg.png')`
            }}
        >
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 pt-12 pb-4 px-4">
                <div className="flex items-center justify-between">
                    {/* Back button and profile */}
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            onClick={() => navigate('/home', { state: { selectedTab: 'chats' } })}
                            className="w-8 h-8 flex items-center justify-center"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <img
                            src={chat?.image || '/chatperson.png'}
                            alt={chat?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                        />

                        <div>
                            <h2 className="text-white font-semibold text-lg">{chat?.name || 'Jacob Jones'}</h2>
                            <p className="text-white/70 text-xs">Mumbai</p>
                        </div>
                    </div>

                    {/* More options button */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-8 h-8 flex items-center justify-center"
                        >
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                        </button>

                        {/* Apple-style dropdown menu */}
                        {showMenu && (
                            <div className="absolute right-0 top-12 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden z-50">
                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors text-left"
                                >
                                    <span className="text-gray-800 font-medium">Mute</span>
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                </button>

                                <div className="h-px bg-gray-300" />

                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors text-left"
                                >
                                    <span className="text-gray-800 font-medium">Clear chat</span>
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>

                                <div className="h-px bg-gray-300" />

                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors text-left"
                                >
                                    <span className="text-gray-800 font-medium">Unmatch</span>
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                                    </svg>
                                </button>

                                <div className="h-px bg-gray-300" />

                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-50 transition-colors text-left"
                                >
                                    <span className="text-red-500 font-medium">Delete</span>
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.isSent
                                ? 'bg-white text-gray-800 rounded-br-md'
                                : 'bg-[#3A3A3C] text-white rounded-bl-md'
                                }`}
                        >
                            <p className="text-sm">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 justify-end ${msg.isSent ? 'text-gray-500' : 'text-white/60'}`}>
                                <span className="text-xs">{msg.time}</span>
                                {msg.isSent && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="bg-gradient-to-t from-black/60 to-transparent px-4 py-4 pb-8">
                <div className="flex items-center gap-2">
                    {/* Camera button */}
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <img src="/chatCam.svg" alt="Camera" className="w-5 h-5" />
                    </button>

                    {/* Message input */}
                    <div className="flex-1 bg-white rounded-full px-4 py-3 flex items-center">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Message"
                            className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 outline-none text-sm"
                        />
                        <button className="ml-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Send/Microphone button */}
                    {message.trim() ? (
                        <button
                            onClick={handleSendMessage}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
                        >
                            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    ) : (
                        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                            <img src="/chatMic.svg" alt="Microphone" className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
