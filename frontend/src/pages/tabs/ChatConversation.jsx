import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatAPI } from '../../utils/api';
import socketService from '../../utils/socket';
import EmojiPicker from 'emoji-picker-react';

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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const menuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const inputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const audioPreviewRef = useRef(null);

    // Normalize message timestamp - ensure createdAt exists
    const normalizeMessage = (msg) => {
        return {
            ...msg,
            createdAt: msg.createdAt || msg.created_at || new Date().toISOString()
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
                    messageIds.includes(msg.id) ? { ...msg, isRead: true, status: 'READ' } : msg
                ));
            }
        });

        // Listen for delivery receipts
        socketService.on('message_delivered', ({ conversationId: deliveredConvId, messageId }) => {
            console.log('ChatConversation received message_delivered:', { deliveredConvId, messageId, currentConversationId: conversationId });
            if (deliveredConvId === conversationId) {
                console.log('Updating message', messageId, 'status to DELIVERED');
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId ? { ...msg, status: 'DELIVERED' } : msg
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
            socketService.off('message_delivered');
            socketService.off('user_status');
            socketService.off('message_deleted');
            
            // Cleanup recorded audio if user navigates away
            if (recordedAudio) {
                URL.revokeObjectURL(recordedAudio.url);
            }
        };
    }, [conversationId, otherUser, navigate, recordedAudio]);

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
        setShowEmojiPicker(false);
        
        // Stop typing indicator
        socketService.stopTyping(conversationId, otherUser.id);

        try {
            const newMsg = await chatAPI.sendMessage(conversationId, 'text', textToSend);
            console.log('Message sent, received response:', newMsg);
            // Normalize the sent message
            const normalizedMsg = normalizeMessage(newMsg);
            console.log('Normalized message:', normalizedMsg);
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
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Save for preview instead of auto-sending
                setRecordedAudio({ blob: audioBlob, url: audioUrl });
                setRecordedDuration(recordingTime);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
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

    const cancelPreview = () => {
        if (recordedAudio) {
            URL.revokeObjectURL(recordedAudio.url);
        }
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
        }
        setRecordedAudio(null);
        setRecordedDuration(0);
        setRecordingTime(0);
        setIsPlaying(false);
    };

    const togglePlayPause = () => {
        if (!audioPreviewRef.current) return;
        
        if (isPlaying) {
            audioPreviewRef.current.pause();
            setIsPlaying(false);
        } else {
            audioPreviewRef.current.play();
            setIsPlaying(true);
        }
    };

    const sendRecordedAudio = async () => {
        if (!recordedAudio) return;
        
        try {
            if (audioPreviewRef.current) {
                audioPreviewRef.current.pause();
            }
            await sendVoiceMessage(recordedAudio.blob, recordedDuration);
            URL.revokeObjectURL(recordedAudio.url);
            setRecordedAudio(null);
            setRecordedDuration(0);
            setRecordingTime(0);
            setIsPlaying(false);
        } catch (error) {
            console.error('Failed to send recorded audio:', error);
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
            
            const normalizedMsg = normalizeMessage(newMsg);
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
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        if (showMenu || showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu, showEmojiPicker]);

    const handleEmojiClick = (emojiObject) => {
        const emoji = emojiObject.emoji;
        const input = inputRef.current;
        
        if (input) {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const text = message;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newText = before + emoji + after;
            
            setMessage(newText);
            
            // Set cursor position after emoji
            setTimeout(() => {
                input.selectionStart = input.selectionEnd = start + emoji.length;
                input.focus();
            }, 0);
        } else {
            // Fallback: append to end
            setMessage(prev => prev + emoji);
        }
    };

    return (
        <div
            className="h-screen flex flex-col bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/bgs/faceverifybg.png')`
            }}
        >
            {/* Header */}
            <div className="bg-white/10  border-b border-white/20 pt-12 pb-4 px-4">
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

                        <button
                            onClick={() => navigate('/user-profile-info', { 
                                state: { 
                                    userId: otherUser?.id, 
                                    otherUser: otherUser 
                                } 
                            })}
                            className="flex-shrink-0"
                        >
                            <img
                                src={otherUser?.profilePicUrl || '/chatperson.png'}
                                alt={otherUser?.name || 'User'}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        </button>

                        <button
                            onClick={() => navigate('/user-profile-info', { 
                                state: { 
                                    userId: otherUser?.id, 
                                    otherUser: otherUser 
                                } 
                            })}
                            className="flex-1 text-left"
                        >
                            <h2 className="text-white font-semibold text-lg">{otherUser?.name || 'User'}</h2>
                            <div className="flex items-center gap-1.5">
                                {isOnline && (
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                                <p className="text-white/70 text-xs">
                                    {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </button>
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
                            <div className="absolute right-0 top-12 w-56 bg-white backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden z-[60]">
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
  className={`max-w-[75%] rounded-2xl px-4 py-3 overflow-hidden ${
    msg.isSent
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
                                        <div className="relative flex items-center ">
                                            {console.log('Rendering msg', msg.id, 'status:', msg.status, 'isRead:', msg.isRead)}
                                            {msg.status === 'READ' || msg.isRead ? (
                                                // Double blue ticks for read messages
                                                <div className="flex -space-x-2">
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            ) : msg.status === 'DELIVERED' ? (
                                                // Double grey ticks for delivered messages
                                                <div className="flex -space-x-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                // Single tick for sent but not delivered
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
           <div className="bg-gradient-to-t from-black/60 to-transparent px-4 py-4 pb-8 z-10 relative">
                {/* Emoji Picker */}
                {showEmojiPicker && !isRecording && !recordedAudio && (
                    <div ref={emojiPickerRef} className="absolute bottom-24 left-4 right-4 z-[15]">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width="100%"
                            height="350px"
                            theme="light"
                            searchDisabled={false}
                            skinTonesDisabled={false}
                            previewConfig={{ showPreview: false }}
                        />
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    {/* Voice Preview Mode - WhatsApp style */}
                    {recordedAudio ? (
                        <>
                            {/* Delete button */}
                            <button
                                type="button"
                                onClick={cancelPreview}
                                className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-all"
                                title="Delete"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>

                            {/* Audio preview bar */}
                            <div className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center gap-3 shadow-lg">
                                {/* Hidden audio element */}
                                <audio 
                                    ref={audioPreviewRef}
                                    src={recordedAudio.url}
                                    onEnded={() => setIsPlaying(false)}
                                    className="hidden"
                                />
                                
                                {/* Play/Pause button */}
                                <button
                                    type="button" 
                                    onClick={togglePlayPause}
                                    className="w-9 h-9 bg-[#00A884] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#008c6f] transition-all"
                                >
                                    {isPlaying ? (
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                        </svg>
                                    )}
                                </button>

                                {/* Waveform visualization */}
                                <div className="flex-1 flex items-center gap-0.5 h-6">
                                    {[...Array(30)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-gray-300 rounded-full"
                                            style={{
                                                height: `${Math.random() * 60 + 40}%`,
                                                minWidth: '2px'
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Duration */}
                                <span className="text-gray-600 text-sm font-medium tabular-nums">
                                    {Math.floor(recordedDuration / 60)}:{(recordedDuration % 60).toString().padStart(2, '0')}
                                </span>
                            </div>

                            {/* Send button */}
                            <button
                                type="button"
                                onClick={sendRecordedAudio}
                                className="w-11 h-11 bg-[#00A884] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#008c6f] transition-all shadow-lg"
                                title="Send"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </>
                    ) : isRecording ? (
                        /* Recording Mode */
                        <>
                            <button
                                type="button"
                                onClick={cancelRecording}
                                className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-red-600 transition-all shadow-lg"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            
                            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-full px-4 py-3 flex items-center justify-center">
                                <div className="flex items-center gap-3">
                                    {/* Recording indicator */}
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    
                                    {/* Timer */}
                                    <span className="text-white font-medium tabular-nums">
                                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                    </span>
                                    
                                    {/* Waveform animation */}
                                    <div className="flex items-center gap-0.5 h-6">
                                        {[...Array(15)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-0.5 bg-white/60 rounded-full animate-pulse"
                                                style={{
                                                    height: `${Math.random() * 60 + 40}%`,
                                                    animationDelay: `${i * 0.1}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="w-11 h-11 bg-[#00A884] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#008c6f] transition-all shadow-lg"
                            >
                                <div className="w-4 h-4 bg-white rounded-sm"></div>
                            </button>
                        </>
                    ) : (
                        /* Normal Mode - Text Input */
                        <>
                            <div className="flex-1 bg-white rounded-full px-4 py-3 flex items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={message}
                                    onChange={handleTyping}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Message"
                                    className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 outline-none text-sm"
                                />
                                <button
                                    type="button" 
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="ml-2"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>

                            {message.trim() ? (
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
                                >
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    type="button" 
                                    onClick={startRecording}
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
                                >
                                    <img src="/chatMic.svg" alt="Microphone" className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete Message Dialog */}
            {showDeleteDialog && selectedMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45] px-4">
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
