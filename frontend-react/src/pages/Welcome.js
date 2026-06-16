import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function Welcome() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const getProfilePictureUrl = () => {
        return user?.profilePicture 
            ? api.getProfilePictureUrl(user.profilePicture)
            : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366F1"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
    };

    return (
        <div className="welcome-container">
            <div className="header">
                <div className="logo" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>
                    <div className="logo-icon">✨</div>
                    <span>TalkAI</span>
                </div>
                <div className="header-actions">
                    <img 
                        src={getProfilePictureUrl()} 
                        alt="Avatar" 
                        className="user-avatar" 
                        onClick={() => navigate('/profile')}
                    />
                </div>
            </div>
            <div className="welcome-content">
                <h1>Welcome to TalkAI!</h1>
                <p className="subtitle">Your journey to smarter conversations starts here.</p>
                
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">💬</div>
                        <h3>Chat with AI</h3>
                        <p>Engage in natural conversations and get instant, intelligent responses.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔖</div>
                        <h3>Save Conversations</h3>
                        <p>Easily store and revisit your chat history, never lose an idea.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Get Instant Answers</h3>
                        <p>Ask anything from facts to creative ideas, and get quick results.</p>
                    </div>
                </div>
                
                <button 
                    className="btn btn-primary" 
                    style={{ maxWidth: '200px' }} 
                    onClick={() => navigate('/chat')}
                >
                    Start Chatting
                </button>
            </div>
            <div className="footer">
                © 2026 TalkAI. All rights reserved.
            </div>
        </div>
    );
}

export default Welcome;
