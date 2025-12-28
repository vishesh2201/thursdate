import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatAPI } from '../../utils/api';
import socketService from '../../utils/socket';

export default function ChatConversation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { conversationId, otherUser } = location.state || {};
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const menuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);

    // Normalize message timestamp - ensure createdAt exists
   const normalizeMessage = (msg, isLocal = false) => {
    return {
        ...msg,
        createdAt: isLocal
            ? new Date().toISOString()   // FORCE current time for sent messages
            : msg.createdAt || msg.created_at
    };
};


    useEffect(() => {
        if (!conversationId || !otherUser) {
            navigate('/home', { state: { selectedTab: 'chats' } });
            return;
        }

        loadMessages();
        
        // Ensure socket is connected before joining
        const token = localStorage.getItem('token');
        if (token && !socketService.isConnected()) {
            console.log('Socket not connected, connecting now...');
            socketService.connect(token);
        }
        
        // Join conversation room (with slight delay to ensure socket is ready)
        setTimeout(() => {
            console.log('Joining conversation room:', conversationId, 'Socket connected:', socketService.isConnected());
            socketService.joinConversation(conversationId);
        }, 100);

        // Listen for new messages
        socketService.onNewMessage(({ conversationId: msgConvId, message: newMsg }) => {
            if (msgConvId === conversationId) {
                // Get current user from localStorage to set isSent properly
                const token = localStorage.getItem('token');
                const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).userId : null;
                
                // Ensure isSent is set correctly based on current user
                const messageWithCorrectSent = normalizeMessage({
                    ...newMsg,
                    isSent: newMsg.senderId === currentUserId
                });
                
                setMessages(prev => [...prev, messageWithCorrectSent]);
                scrollToBottom();
                
                // Mark as read if not sent by current user
                if (!messageWithCorrectSent.isSent) {
                    socketService.markMessagesAsRead(conversationId, [newMsg.id]);
                    chatAPI.markAsRead(conversationId);
                }
            }
        });

        // Listen for typing events
        socketService.onUserTyping(({ conversationId: typingConvId, userId, isTyping: typing }) => {
            if (typingConvId === conversationId && userId === otherUser.id) {
                setIsTyping(typing);
            }
        });

        // Listen for read receipts
        socketService.onMessagesRead(({ conversationId: readConvId, messageIds }) => {
            if (readConvId === conversationId) {
                setMessages(prev => prev.map(msg => 
                    messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
                ));
            }
        });

        // Listen for user status changes
        socketService.onUserStatus(({ userId, isOnline: online }) => {
            if (userId === otherUser.id) {
                setIsOnline(online);
            }
        });

        // Request current status of other user
        socketService.requestUserStatus(otherUser.id);

        // Listen for message deletions
        socketService.on('message_deleted', (data) => {
            console.log('Received message_deleted event:', data);
            if (data.deleteType === 'for_everyone') {
                setMessages(prev => {
                    console.log('Filtering message ID:', data.messageId, 'from', prev.length, 'messages');
                    return prev.filter(msg => msg.id !== data.messageId);
                });
            }
        });

        return () => {
            socketService.leaveConversation(conversationId);
            socketService.off('new_message');
            socketService.off('user_typing');
            socketService.off('messages_read');
            socketService.off('user_status');
            socketService.off('message_deleted');
        };
    }, [conversationId, otherUser, navigate]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await chatAPI.getMessages(conversationId);
            // Normalize all loaded messages
            const normalizedMessages = data.map(normalizeMessage);
            setMessages(normalizedMessages);
            scrollToBottom();
            
            // Mark unread messages as read
            const unreadIds = normalizedMessages.filter(msg => !msg.isRead && !msg.isSent).map(msg => msg.id);
            if (unreadIds.length > 0) {
                await chatAPI.markAsRead(conversationId);
                socketService.markMessagesAsRead(conversationId, unreadIds);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        const textToSend = message.trim();
        setMessage('');
        
        // Stop typing indicator
        socketService.stopTyping(conversationId, otherUser.id);

        try {
            const newMsg = await chatAPI.sendMessage(conversationId, 'text', textToSend);
            // Normalize the sent message
            const normalizedMsg = normalizeMessage(newMsg, true );
            setMessages(prev => [...prev, normalizedMsg]);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
            // Optionally show error to user
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleTyping = (e) => {
        setMessage(e.target.value);
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Start typing
        if (e.target.value.length > 0) {
            socketService.startTyping(conversationId, otherUser.id);
            
            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socketService.stopTyping(conversationId, otherUser.id);
            }, 2000);
        } else {
            socketService.stopTyping(conversationId, otherUser.id);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendVoiceMessage(audioBlob, recordingTime);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                // Reset recording state
                setRecordingTime(0);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Microphone access denied. Please allow microphone access to send voice messages.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingTime(0);
            
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            
            // Stop all tracks without sending
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
            
            audioChunksRef.current = [];
        }
    };

    const sendVoiceMessage = async (audioBlob, duration) => {
        try {
            // Upload audio to backend
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice-message.webm');
            
            const token = localStorage.getItem('token');
            const uploadResponse = await fetch(
                `${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api'}/upload/voice-message`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            );
            
            if (!uploadResponse.ok) {
                throw new Error('Failed to upload voice message');
            }
            
            const uploadData = await uploadResponse.json();
            
            // Send voice message
            const newMsg = await chatAPI.sendMessage(
                conversationId,
                'voice',
                uploadData.url,
                Math.round(duration)
            );
            
            const normalizedMsg = normalizeMessage(newMsg, true);
            setMessages(prev => [...prev, normalizedMsg]);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send voice message:', error);
            alert('Failed to send voice message. Please try again.');
        }
    };

    const handleMessageLongPress = (msg) => {
        setSelectedMessage(msg);
        setShowDeleteDialog(true);
    };

    const handleDeleteMessage = async (deleteType) => {
        if (!selectedMessage) return;

        try {
            // Immediately remove from UI for better UX
            const messageIdToDelete = selectedMessage.id;
            setMessages(prev => prev.filter(msg => msg.id !== messageIdToDelete));
            
            setShowDeleteDialog(false);
            setSelectedMessage(null);
            
            // Call API in background
            await chatAPI.deleteMessage(messageIdToDelete, deleteType);
            console.log('Message deleted successfully:', messageIdToDelete, 'deleteType:', deleteType);
        } catch (error) {
            console.error('Failed to delete message:', error);
            alert('Failed to delete message. Please try again.');
            // Reload messages on error
            loadMessages();
        }
    };

 const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp); // UTC → LOCAL happens here

    if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return '';
    }

    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
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
                            src={otherUser?.profilePicUrl || '/chatperson.png'}
                            alt={otherUser?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                        />

                        <div>
                            <h2 className="text-white font-semibold text-lg">{otherUser?.name || 'User'}</h2>
                            <div className="flex items-center gap-1.5">
                                {isOnline && (
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                                <p className="text-white/70 text-xs">
                                    {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
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
                {loading ? (
                    <div className="text-center text-white/60 py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-white/60 py-8">No messages yet. Say hi!</div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleMessageLongPress(msg);
                            }}
                            onClick={(e) => {
                                // Long press simulation for mobile
                                if (e.detail === 2) { // Double click
                                    handleMessageLongPress(msg);
                                }
                            }}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.isSent
                                    ? 'bg-white text-gray-800 rounded-br-md'
                                    : 'bg-[#3A3A3C] text-white rounded-bl-md'
                                    }`}
                            >
                                {msg.messageType === 'voice' || msg.type === 'VOICE' ? (
                                    <audio 
                                        src={msg.content} 
                                        controls 
                                        className="max-w-full"
                                        style={{ 
                                            height: '32px',
                                            filter: msg.isSent ? 'invert(0)' : 'invert(1)'
                                        }}
                                    />
                                ) : (
                                    <p className="text-sm">{msg.content}</p>
                                )}
                                <div className={`flex items-center gap-1 mt-1 justify-end ${msg.isSent ? 'text-gray-500' : 'text-white/60'}`}>
                                    <span className="text-xs">{formatTime(msg.createdAt)}</span>
                                    {msg.isSent && (
                                        <div className="relative flex items-center">
                                            {msg.isRead ? (
                                                // Two ticks for read messages
                                                <div className="flex -space-x-1">
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                // One tick for sent but not read
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
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
                            onChange={handleTyping}
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
                    {isRecording ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={cancelRecording}
                                className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                            </div>
                            <button
                                onClick={stopRecording}
                                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    ) : message.trim() ? (
                        <button
                            onClick={handleSendMessage}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
                        >
                            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    ) : (
                        <button 
                            onClick={startRecording}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
                        >
                            <img src="/chatMic.svg" alt="Microphone" className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Delete Message Dialog */}
            {showDeleteDialog && selectedMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete message?</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                {selectedMessage.isSent 
                                    ? 'Choose who you want to delete this message for'
                                    : 'This message will be deleted for you only'}
                            </p>
                            
                            <div className="space-y-3">
                                {selectedMessage.isSent && (
                                    <button
                                        onClick={() => handleDeleteMessage('for_everyone')}
                                        className="w-full py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Delete for everyone
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteMessage('for_me')}
                                    className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Delete for me
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteDialog(false);
                                        setSelectedMessage(null);
                                    }}
                                    className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
