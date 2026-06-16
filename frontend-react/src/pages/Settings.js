import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function Settings() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        // Load settings from localStorage
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedLanguage = localStorage.getItem('language') || 'en';
        
        setDarkMode(isDarkMode);
        setLanguage(savedLanguage);

        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);

        if (newDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    const changeLanguage = (newLanguage) => {
        setLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
        const langName = newLanguage === 'en' ? 'English' : newLanguage === 'es' ? 'Spanish' : 'French';
        alert(`Language changed to: ${langName}\n\nNote: Full translation is not yet implemented. This setting is saved for future use.`);
    };

    const clearChatHistory = async () => {
        if (!window.confirm('Are you sure you want to delete all your chats? This cannot be undone.')) {
            return;
        }

        try {
            const { chats } = await api.getChats(token);
            
            for (const chat of chats) {
                await api.deleteChat(token, chat.id);
            }

            alert('Chat history cleared successfully');
            navigate('/chat');
        } catch (error) {
            alert('Failed to clear chat history');
        }
    };

    return (
        <div className="settings-container">
            <div className="header">
                <div className="logo" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>
                    <div className="logo-icon">✨</div>
                    <span>TalkAI</span>
                </div>
                <div className="header-actions">
                    <button className="icon-btn" onClick={() => navigate('/chat')}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="settings-content">
                <h1>Settings</h1>
                
                <div className="settings-section">
                    <h2>Appearance</h2>
                    <div className="settings-item">
                        <label>Dark Mode</label>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox" 
                                checked={darkMode}
                                onChange={toggleDarkMode}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div className="settings-section">
                    <h2>General</h2>
                    <div className="settings-item">
                        <label>Language</label>
                        <select 
                            className="select-control" 
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                        </select>
                    </div>
                </div>
                
                <div className="settings-section">
                    <h2>Data Management</h2>
                    <div className="settings-item">
                        <label>Clear Chat History</label>
                        <button className="btn-clear" onClick={clearChatHistory}>Clear</button>
                    </div>
                </div>
            </div>
            <div className="footer">
                © 2026 TalkAI. All rights reserved.
            </div>
        </div>
    );
}

export default Settings;
