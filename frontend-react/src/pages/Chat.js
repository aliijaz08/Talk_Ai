import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE_URL_EXPORT } from '../utils/api';
import { markdownToHtml, escapeHtml } from '../utils/markdown';

function Chat() {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [abortController, setAbortController] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const loadChats = useCallback(async () => {
        if (!token) return;
        try {
            const data = await api.getChats(token);
            setChats(data.chats || []);
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    }, [token]);

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    useEffect(() => {
        // Auto-scroll to bottom when messages change
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [messageInput]);

    const createNewChat = async () => {
        try {
            const data = await api.createChat(token, 'New Chat');
            setCurrentChat(data.chat);
            setMessages([]);
            loadChats();
            return data.chat;
        } catch (error) {
            console.error('Failed to create chat:', error);
            return null;
        }
    };

    const loadChat = async (chatId) => {
        try {
            const data = await api.getChat(token, chatId);
            setCurrentChat(data.chat);
            setMessages(data.chat.messages || []);
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    };

    const renameChat = async (chatId, currentTitle) => {
        const newTitle = prompt('Enter new chat title:', currentTitle);
        if (!newTitle || newTitle === currentTitle) return;

        try {
            await api.updateChat(token, chatId, newTitle);
            loadChats();
            if (currentChat?.id === chatId) {
                setCurrentChat({ ...currentChat, title: newTitle });
            }
        } catch (error) {
            alert('Failed to rename chat');
        }
    };

    const togglePin = async (chatId) => {
        try {
            await api.togglePin(token, chatId);
            loadChats();
        } catch (error) {
            alert('Failed to toggle pin');
        }
    };

    const deleteChat = async (chatId) => {
        if (!window.confirm('Are you sure you want to delete this chat?')) return;

        try {
            await api.deleteChat(token, chatId);
            if (currentChat?.id === chatId) {
                setCurrentChat(null);
                setMessages([]);
            }
            loadChats();
        } catch (error) {
            alert('Failed to delete chat');
        }
    };

    const sendMessage = async () => {
        const message = messageInput.trim();
        if (!message) return;

        // Resolve chat synchronously: setState from createNewChat is async, so `currentChat`
        // in this closure would stay stale until the next render.
        let chat = currentChat;
        if (!chat) {
            chat = await createNewChat();
            if (!chat) {
                alert('Failed to create chat');
                return;
            }
        }

        setMessageInput('');

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        // Create abort controller
        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);

        try {
            const response = await fetch(`${API_BASE_URL_EXPORT}/api/ai/chat/${chat.id}/stream`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message }),
                signal: controller.signal,
                cache: 'no-store'
            });

            if (!response.ok) {
                const text = await response.text();
                let detail = 'Failed to send message';
                try {
                    const j = JSON.parse(text);
                    if (j.error) detail = j.error;
                } catch {
                    if (text) detail = text.slice(0, 300);
                }
                throw new Error(detail);
            }

            if (!response.body) {
                throw new Error('No response body from server');
            }

            // Create placeholder for AI message
            const aiMessage = {
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString(),
                streaming: true
            };
            setMessages(prev => [...prev, aiMessage]);

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.error) {
                                alert(data.error);
                                break;
                            }

                            if (data.event === 'end') {
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].streaming = false;
                                    return updated;
                                });
                                break;
                            }

                            if (data.chunk) {
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].content += data.chunk;
                                    return updated;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing stream data:', e);
                        }
                    }
                }
            }

            // Reload chats to update order
            setTimeout(() => loadChats(), 100);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped by user');
            } else {
                console.error('Send message error:', error);
                const msg = error instanceof Error ? error.message : 'Failed to connect to server';
                alert(msg);
            }
        } finally {
            setIsGenerating(false);
            setAbortController(null);
        }
    };

    const stopGenerating = () => {
        if (abortController) {
            abortController.abort();
            setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1].streaming = false;
                }
                return updated;
            });
        }
    };

    const getProfilePictureUrl = () => {
        return user?.profilePicture 
            ? api.getProfilePictureUrl(user.profilePicture)
            : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366F1"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Chats</h2>
                    <button className="new-chat-btn" onClick={createNewChat}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
                <div className="chat-list">
                    {chats.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No chats yet</div>
                    ) : (
                        chats.map(chat => (
                            <div 
                                key={chat.id} 
                                className={`chat-item ${currentChat?.id === chat.id ? 'active' : ''}`}
                                onClick={() => loadChat(chat.id)}
                            >
                                <div className="chat-item-icon">
                                    {chat.isPinned ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="chat-item-title">{chat.title}</div>
                                <div className="chat-item-actions" onClick={(e) => e.stopPropagation()}>
                                    <button className="chat-action-btn" onClick={() => togglePin(chat.id)} title={chat.isPinned ? 'Unpin' : 'Pin'}>
                                        {chat.isPinned ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button className="chat-action-btn" onClick={() => renameChat(chat.id, chat.title)} title="Rename">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                    <button className="chat-action-btn chat-delete-btn" onClick={() => deleteChat(chat.id)} title="Delete">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="chat-main">
                <div className="chat-header">
                    <div className="logo" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>
                        <div className="logo-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0"/>
                                <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>
                            </svg>
                        </div>
                        <span>TalkAI</span>
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>
                        <button className="icon-btn" onClick={() => navigate('/about')} title="About">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                        </button>
                        <img 
                            src={getProfilePictureUrl()} 
                            alt="Avatar" 
                            className="user-avatar" 
                            onClick={() => navigate('/profile')}
                        />
                    </div>
                </div>
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <h2>What can I help you with today?</h2>
                            <p>TalkAI is here to assist you. Start typing to begin your conversation.</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => {
                                const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                });

                                return (
                                    <div key={index} className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                                        <div className="message-avatar">
                                            {msg.role === 'user' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M16.5 7.5h-9v9h9v-9Z" />
                                                    <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 0 1 9 3v.75h2.25V3a.75.75 0 0 1 1.5 0v.75H15V3a.75.75 0 0 1 1.5 0v.75h.75a3 3 0 0 1 3 3v.75H21A.75.75 0 0 1 21 9h-.75v2.25H21a.75.75 0 0 1 0 1.5h-.75V15H21a.75.75 0 0 1 0 1.5h-.75v.75a3 3 0 0 1-3 3h-.75V21a.75.75 0 0 1-1.5 0v-.75h-2.25V21a.75.75 0 0 1-1.5 0v-.75H9V21a.75.75 0 0 1-1.5 0v-.75h-.75a3 3 0 0 1-3-3v-.75H3A.75.75 0 0 1 3 15h.75v-2.25H3a.75.75 0 0 1 0-1.5h.75V9H3a.75.75 0 0 1 0-1.5h.75v-.75a3 3 0 0 1 3-3h.75V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="message-content">
                                            <div 
                                                className="message-bubble"
                                                dangerouslySetInnerHTML={{
                                                    __html: msg.role === 'assistant' 
                                                        ? markdownToHtml(msg.content) + (msg.streaming ? '<span class="typing-cursor"></span>' : '')
                                                        : escapeHtml(msg.content)
                                                }}
                                            />
                                            <div className="message-time">{time}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
                <div className="chat-input-container">
                    {isGenerating && (
                        <button className="stop-generating-btn" onClick={stopGenerating} style={{ display: 'flex' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8Z" clipRule="evenodd" />
                            </svg>
                            Stop generating
                        </button>
                    )}
                    <div className="chat-input-wrapper">
                        <textarea 
                            ref={textareaRef}
                            className="chat-input" 
                            placeholder="Type your message here..." 
                            rows="1"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isGenerating}
                        />
                        <button className="send-btn" onClick={sendMessage} disabled={isGenerating || !messageInput.trim()}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="19" x2="12" y2="5"/>
                                <polyline points="5 12 12 5 19 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chat;
