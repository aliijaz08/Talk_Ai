import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function Profile() {
    const navigate = useNavigate();
    const { user, logout, updateUser, token } = useAuth();
    const fileInputRef = useRef(null);

    const getProfilePictureUrl = () => {
        return user?.profilePicture 
            ? api.getProfilePictureUrl(user.profilePicture)
            : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366F1"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('❌ Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('❌ Image size must be less than 5MB. Your image is ' + (file.size / 1024 / 1024).toFixed(2) + 'MB');
            return;
        }

        try {
            const data = await api.uploadProfilePicture(token, file);
            
            if (data.user) {
                updateUser(data.user);
                alert('✅ Profile picture updated successfully!');
            } else {
                alert(data.error || 'Failed to upload profile picture');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(error instanceof Error ? error.message : 'Failed to upload profile picture');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="profile-container">
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
            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-avatar-container">
                        <img 
                            src={getProfilePictureUrl()} 
                            alt="Profile" 
                            className="profile-avatar"
                        />
                        <button 
                            className="btn-upload-avatar" 
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <h2>{user?.username || 'User'}</h2>
                    <p className="email">{user?.email || ''}</p>
                    <button className="btn btn-secondary">Change Password</button>
                    <button className="btn btn-danger" onClick={handleLogout}>Log out</button>
                </div>
            </div>
            <div className="footer">
                © 2026 TalkAI. All rights reserved.
            </div>
        </div>
    );
}

export default Profile;
