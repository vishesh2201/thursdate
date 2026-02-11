import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatAPI } from '../../utils/api';
import socketService from '../../utils/socket';
import LevelUpPopup from './LevelUpPopup';
import Level2UnlockedPopup from './Level2UnlockedPopup';
import ConsentReminderBanner from '../../components/ConsentReminderBanner';

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
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const menuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const inputRef = useRef(null);
    const audioPreviewRef = useRef(null);

    // ✅ Level system state
    const [levelStatus, setLevelStatus] = useState(null);
    const [showLevel2Unlocked, setShowLevel2Unlocked] = useState(false);
    // ❌ REMOVED: Frontend local state for popups - now driven entirely by backend
    // const [showLevel2Popup, setShowLevel2Popup] = useState(false);
    // const [showLevel3Popup, setShowLevel3Popup] = useState(false);
    // const [pendingLevel2Threshold, setPendingLevel2Threshold] = useState(false);
    // const [pendingLevel3Threshold, setPendingLevel3Threshold] = useState(false);

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

        // Listen for conversation unmatch events
        socketService.on('conversation_unmatched', ({ conversationId: unmatchedConvId }) => {
            console.log('Conversation unmatched:', unmatchedConvId);
            if (unmatchedConvId === conversationId) {
                // Navigate back to messages tab
                navigate('/home', { state: { selectedTab: 'chats' } });
            }
        });

        // ✅ Listen for level threshold reached
        socketService.on('level_threshold_reached', ({ conversationId: convId, threshold }) => {
            console.log('[Level] Threshold reached:', threshold, 'in conversation', convId);
            if (convId === conversationId) {
                // ✅ Just reload status - popup visibility is driven by backend's popupPending flags
                console.log('[Level] Threshold reached for this conversation, reloading status...');
                loadLevelStatus();
            }
        });

        // ✅ Listen for Level 2 unlocked (both users completed)
        socketService.on('level2_unlocked', ({ conversationId: convId }) => {
            console.log('[Level] Level 2 unlocked in conversation', convId);
            if (convId === conversationId) {
                setShowLevel2Unlocked(true);
                // ✅ Reload status to clear popup flags
                loadLevelStatus();
            }
        });

        // ✅ Listen for Level 3 unlocked (both users consented)
        socketService.on('level3_unlocked', ({ conversationId: convId }) => {
            console.log('[Level] Level 3 unlocked in conversation', convId);
            if (convId === conversationId) {
                // ✅ Reload status to clear popup flags
                loadLevelStatus();
            }
        });

        // ✅ Load initial level status
        loadLevelStatus();

        return () => {
            socketService.leaveConversation(conversationId);
            socketService.off('new_message');
            socketService.off('user_typing');
            socketService.off('messages_read');
            socketService.off('message_delivered');
            socketService.off('user_status');
            socketService.off('message_deleted');
            socketService.off('conversation_unmatched');
            socketService.off('level_threshold_reached');
            socketService.off('level2_unlocked');
            socketService.off('level3_unlocked');

            // Cleanup recorded audio if user navigates away
            if (recordedAudio) {
                URL.revokeObjectURL(recordedAudio.url);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, otherUser, navigate, recordedAudio]);

    // ✅ Reload level status when page becomes visible (e.g., returning from profile questions)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('[Level] Page visible, reloading status and messages...');
                loadLevelStatus();
                loadMessages(); // Also reload messages to ensure we have fresh data
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

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

    // ✅ Load level status for this conversation
    const loadLevelStatus = async () => {
        try {
            const status = await chatAPI.getLevelStatus(conversationId);
            setLevelStatus(status);
            console.log('[Level] Status loaded:', status);
            console.log('[Level] Popup pending - Level 2:', status?.level2PopupPending, 'Level 3:', status?.level3PopupPending);
        } catch (error) {
            console.error('[Level] Failed to load status:', error);
        }
    };

    // ✅ REMOVED: Old useEffects that triggered popups based on local state
    // Popups are now driven directly by backend's popupPending flags in levelStatus

    // ✅ Handle Level 2 popup - redirect to questions based on action
    const handleLevel2FillInfo = () => {
        const action = levelStatus?.level2Action;
        console.log('[Level2] Fill Info clicked, action:', action);
        
        // ✅ CRITICAL: Frontend ONLY redirects if backend says FILL_INFORMATION
        if (action === 'FILL_INFORMATION') {
            console.log('[Level2] Action is FILL_INFORMATION - navigating to profile-questions');
            navigate('/profile-questions', { 
                state: { 
                    levelOnly: 2,
                    returnTo: '/chat-conversation',
                    returnState: { 
                        conversationId,
                        otherUser,
                        selectedTab: 'chats'
                    }
                } 
            });
        } else {
            console.error('[Level2] Invalid action for Fill Info button:', action);
        }
    };

    // ✅ Handle Level 2 consent - YES
    const handleLevel2Yes = async () => {
        try {
            await chatAPI.setLevel2Consent(conversationId, true);
            // ✅ Reload status to clear popup_pending flag from backend
            await loadLevelStatus();
        } catch (error) {
            console.error('[Level] Failed to set Level 2 consent:', error);
        }
    };

    // ✅ Handle Level 2 consent - NO  
    const handleLevel2No = async () => {
        try {
            // ✅ Still call backend to clear popup_pending flag
            await chatAPI.setLevel2Consent(conversationId, false);
            // ✅ Reload status to clear popup_pending flag from backend
            await loadLevelStatus();
        } catch (error) {
            console.error('[Level] Failed to decline Level 2 consent:', error);
        }
    };

    // ✅ Handle Level 3 popup - redirect to questions OR show consent
    const handleLevel3FillInfo = () => {
        const action = levelStatus?.level3Action;
        console.log('[Level3] Fill Info clicked, action:', action);
        
        // ✅ CRITICAL: Frontend ONLY redirects if backend says FILL_INFORMATION
        if (action === 'FILL_INFORMATION') {
            console.log('[Level3] Action is FILL_INFORMATION - navigating to profile-questions');
            navigate('/profile-questions', { 
                state: { 
                    levelOnly: 3,
                    returnTo: '/chat-conversation',
                    returnState: { 
                        conversationId,
                        otherUser,
                        selectedTab: 'chats'
                    }
                } 
            });
        } else {
            // If no Level 3 questions needed, just auto-consent
            console.log('[Level3] No Level 3 questions, auto-consenting');
            handleLevel3Yes();
        }
    };

    // ✅ Handle Level 3 consent - YES
    const handleLevel3Yes = async () => {
        try {
            await chatAPI.setLevel3Consent(conversationId, true);
            // ✅ Reload status to clear popup_pending flag from backend
            await loadLevelStatus();
        } catch (error) {
            console.error('[Level] Failed to set Level 3 consent:', error);
        }
    };

    // ✅ Handle Level 3 consent - NO
    const handleLevel3No = async () => {
        try {
            // ✅ Still call backend to clear popup_pending flag
            await chatAPI.setLevel3Consent(conversationId, false);
            // ✅ Reload status to clear popup_pending flag from backend
            await loadLevelStatus();
        } catch (error) {
            console.error('[Level] Failed to decline Level 3 consent:', error);
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

        // Create optimistic message (show immediately)
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            content: textToSend,
            messageType: 'text',
            isSent: true,
            status: 'SENDING',
            createdAt: new Date().toISOString(),
            senderId: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId
        };

        // Add message to UI immediately
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

        try {
            const newMsg = await chatAPI.sendMessage(conversationId, 'text', textToSend);
            console.log('Message sent, received response:', newMsg);

            // Replace optimistic message with real message
            const normalizedMsg = normalizeMessage(newMsg);
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? normalizedMsg : msg
            ));
        } catch (error) {
            console.error('Failed to send message:', error);
            // Mark message as failed
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, status: 'FAILED' } : msg
            ));
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
        // Create temporary URL for optimistic message (before upload)
        const tempAudioUrl = URL.createObjectURL(audioBlob);
        const tempId = `temp-${Date.now()}`;

        // Create optimistic voice message IMMEDIATELY (before upload)
        const optimisticMessage = {
            id: tempId,
            content: tempAudioUrl, // Use temporary blob URL
            messageType: 'voice',
            isSent: true,
            status: 'SENDING',
            createdAt: new Date().toISOString(),
            voiceDuration: Math.round(duration),
            senderId: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId
        };

        // Show message immediately
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

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

            // Replace optimistic message with real message (with Cloudinary URL)
            const normalizedMsg = normalizeMessage(newMsg);
            setMessages(prev => prev.map(msg => {
                if (msg.id === tempId) {
                    // Clean up the temporary blob URL
                    URL.revokeObjectURL(tempAudioUrl);
                    return normalizedMsg;
                }
                return msg;
            }));
        } catch (error) {
            console.error('Failed to send voice message:', error);
            // Mark message as failed
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, status: 'FAILED' } : msg
            ));
            alert('Failed to send voice message. Please try again.');
        }
    };

    const handleMessageLongPress = (msg) => {
        setSelectedMessage(msg);
        setShowDeleteDialog(true);
    };

    const handleUnsendMessage = async () => {
        if (!selectedMessage) return;

        try {
            // Immediately remove from UI for better UX
            const messageIdToDelete = selectedMessage.id;
            setMessages(prev => prev.filter(msg => msg.id !== messageIdToDelete));

            setShowDeleteDialog(false);
            setSelectedMessage(null);

            // Call API to unsend (delete for everyone)
            await chatAPI.deleteMessage(messageIdToDelete);
            console.log('Message unsent successfully:', messageIdToDelete);
        } catch (error) {
            console.error('Failed to unsend message:', error);
            alert(error.message || 'Failed to unsend message. Please try again.');
            // Reload messages on error
            loadMessages();
        }
    };

    const canUnsendMessage = (msg) => {
        if (!msg || !msg.isSent) return false;
        
        // Check if message is within 12 hours
        const messageTime = new Date(msg.createdAt).getTime();
        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;
        
        return (now - messageTime) <= twelveHours;
    };

    const handleBlock = async () => {
        try {
            setShowBlockDialog(false);
            setShowMenu(false);
            
            // Call API to block user (also unmatches and deletes conversation)
            await chatAPI.blockUser(conversationId);
            console.log('User blocked successfully');
            
            // Navigate back to messages tab immediately
            navigate('/home', { state: { selectedTab: 'chats' } });
        } catch (error) {
            console.error('Failed to block user:', error);
            alert('Failed to block user. Please try again.');
        }
    };

    const handleUnmatch = async () => {
        try {
            setShowUnmatchDialog(false);
            setShowMenu(false);
            
            // Call API to unmatch (notifies both users)
            await chatAPI.unmatch(conversationId);
            console.log('Unmatched successfully');
            
            // Navigate back to messages tab
            navigate('/home', { state: { selectedTab: 'chats' } });
        } catch (error) {
            console.error('Failed to unmatch:', error);
            alert('Failed to unmatch. Please try again.');
        }
    };

    const handleReport = async () => {
        try {
            if (!reportReason) {
                alert('Please select a reason for reporting');
                return;
            }

            // Call API to submit report
            await chatAPI.reportUser(
                otherUser.id,
                conversationId,
                reportReason,
                reportDescription.trim()
            );

            console.log('Report submitted successfully');
            
            // Close dialog and reset form
            setShowReportDialog(false);
            setReportReason('');
            setReportDescription('');
            
            // Show confirmation
            alert('Thanks for reporting. Our team will review this.');
            
        } catch (error) {
            console.error('Failed to submit report:', error);
            if (error.message.includes('already reported')) {
                alert('You have already reported this user recently. Please wait 24 hours before reporting again.');
            } else {
                alert('Failed to submit report. Please try again.');
            }
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
                                    conversationId: conversationId
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
                                    conversationId: conversationId
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
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowReportDialog(true);
                                    }}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors text-left"
                                >
                                    <span className="text-gray-800 font-medium">Report</span>
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </button>

                                <div className="h-px bg-gray-300" />

                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowBlockDialog(true);
                                    }}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-50 transition-colors text-left"
                                >
                                    <span className="text-red-500 font-medium">Block</span>
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                </button>

                                <div className="h-px bg-gray-300" />

                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowUnmatchDialog(true);
                                    }}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors text-left"
                                >
                                    <span className="text-gray-800 font-medium">Unmatch</span>
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ Consent Reminder Banners - Show when consent is PENDING but user clicked "NO" */}
            <ConsentReminderBanner
                show={
                    levelStatus?.level2PopupPending === true && 
                    levelStatus?.level2ConsentState === 'DECLINED_TEMPORARY'
                }
                level={2}
                partnerName={otherUser?.firstName || otherUser?.name || 'Your match'}
                onShareNow={handleLevel2Yes}
            />
            
            <ConsentReminderBanner
                show={
                    levelStatus?.level3PopupPending === true && 
                    levelStatus?.level3ConsentState === 'DECLINED_TEMPORARY'
                }
                level={3}
                partnerName={otherUser?.firstName || otherUser?.name || 'Your match'}
                onShareNow={handleLevel3Yes}
            />

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
                                className={`max-w-[75%] rounded-2xl px-4 py-3 overflow-hidden ${msg.isSent
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
                                            {msg.status === 'SENDING' ? (
                                                // Clock icon for sending messages
                                                <svg className="w-4 h-4 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                                                </svg>
                                            ) : msg.status === 'FAILED' ? (
                                                // Warning icon for failed messages
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : msg.status === 'READ' || msg.isRead ? (
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
                {/* ✅ Level Up Popups - Only show if NOT declined temporarily */}
                <LevelUpPopup
                    show={
                        levelStatus?.level2PopupPending === true && 
                        levelStatus?.level2ConsentState !== 'DECLINED_TEMPORARY'
                    }
                    type="LEVEL_2"
                    action={levelStatus?.level2Action}
                    partnerName={otherUser?.firstName || otherUser?.name || 'Your match'}
                    onFillInfo={handleLevel2FillInfo}
                    onYes={handleLevel2Yes}
                    onNo={handleLevel2No}
                />
                
                <LevelUpPopup
                    show={
                        levelStatus?.level3PopupPending === true && 
                        levelStatus?.level3ConsentState !== 'DECLINED_TEMPORARY'
                    }
                    type="LEVEL_3"
                    action={levelStatus?.level3Action}
                    partnerName={otherUser?.firstName || otherUser?.name || 'Your match'}
                    onFillInfo={handleLevel3FillInfo}
                    onYes={handleLevel3Yes}
                    onNo={handleLevel3No}
                />
                
                <Level2UnlockedPopup
                    show={showLevel2Unlocked}
                    onDismiss={() => setShowLevel2Unlocked(false)}
                />
                
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
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
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
                                    onClick={() => inputRef.current?.focus()}
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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
  >
    <path
      d="M17.5158 2.01275C17.9478 0.81775 16.7898 -0.34025 15.5948 0.0927503L0.989804 5.37475C-0.209196 5.80875 -0.354196 7.44475 0.748804 8.08375L5.4108 10.7828L9.5738 6.61975C9.76241 6.43759 10.015 6.3368 10.2772 6.33908C10.5394 6.34135 10.7902 6.44652 10.9756 6.63193C11.161 6.81734 11.2662 7.06815 11.2685 7.33035C11.2708 7.59255 11.17 7.84515 10.9878 8.03375L6.8248 12.1968L9.5248 16.8587C10.1628 17.9618 11.7988 17.8158 12.2328 16.6178L17.5158 2.01275Z"
      fill="url(#paint0_linear_3584_5867)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_3584_5867"
        x1="8.80409"
        y1="0"
        x2="8.80409"
        y2="17.6072"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#DD9200" />
        <stop offset="1" stopColor="#F9C900" />
      </linearGradient>
    </defs>
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

            {/* Unsend Message Dialog */}
            {showDeleteDialog && selectedMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45] px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Unsend message?</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                {canUnsendMessage(selectedMessage)
                                    ? 'This message will be removed for both you and the recipient.'
                                    : 'Messages can only be unsent within 12 hours of sending.'}
                            </p>

                            <div className="space-y-3">
                                {canUnsendMessage(selectedMessage) && (
                                    <button
                                        onClick={handleUnsendMessage}
                                        className="w-full py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Unsend
                                    </button>
                                )}
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

            {/* Block Dialog */}
            {showBlockDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45] px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Block {otherUser?.firstName || otherUser?.name}?</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Blocked users won't be able to message you. This will also remove your match and conversation. This action cannot be undone.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleBlock}
                                    className="w-full py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                                >
                                    Block
                                </button>
                                <button
                                    onClick={() => setShowBlockDialog(false)}
                                    className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Dialog */}
            {showReportDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45] px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 overflow-y-auto">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Report {otherUser?.firstName || otherUser?.name}</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Help us understand what's wrong. Your report is anonymous and will be reviewed by our team.
                            </p>

                            {/* Reason Selection */}
                            <div className="space-y-2 mb-4">
                                <label className="text-sm font-medium text-gray-700">Reason *</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'inappropriate_messages', label: 'Inappropriate messages' },
                                        { value: 'fake_profile', label: 'Fake profile' },
                                        { value: 'harassment', label: 'Harassment' },
                                        { value: 'spam', label: 'Spam' },
                                        { value: 'other', label: 'Other' }
                                    ].map((option) => (
                                        <label 
                                            key={option.value}
                                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="radio"
                                                name="reportReason"
                                                value={option.value}
                                                checked={reportReason === option.value}
                                                onChange={(e) => setReportReason(e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-gray-800 text-sm">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Description (Optional) */}
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium text-gray-700">
                                    Additional details (optional)
                                </label>
                                <textarea
                                    value={reportDescription}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 500) {
                                            setReportDescription(e.target.value);
                                        }
                                    }}
                                    placeholder="Provide any additional context..."
                                    className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 transition-colors"
                                    rows={4}
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 text-right">
                                    {reportDescription.length}/500
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleReport}
                                    disabled={!reportReason}
                                    className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                                        reportReason 
                                            ? 'bg-red-500 text-white hover:bg-red-600' 
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Submit Report
                                </button>
                                <button
                                    onClick={() => {
                                        setShowReportDialog(false);
                                        setReportReason('');
                                        setReportDescription('');
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

            {/* Unmatch Dialog */}
            {showUnmatchDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[45] px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Unmatch with {otherUser?.firstName || otherUser?.name}?</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                This will remove your match and delete all messages for both of you. This action cannot be undone.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleUnmatch}
                                    className="w-full py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                                >
                                    Unmatch
                                </button>
                                <button
                                    onClick={() => setShowUnmatchDialog(false)}
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
