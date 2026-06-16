import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import About from './pages/About';

// Protected Route Component
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

// Public Route Component (redirects to chat if already logged in)
function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <Navigate to="/welcome" /> : children;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route 
                        path="/login" 
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        } 
                    />
                    <Route 
                        path="/signup" 
                        element={
                            <PublicRoute>
                                <Signup />
                            </PublicRoute>
                        } 
                    />
                    <Route 
                        path="/welcome" 
                        element={
                            <ProtectedRoute>
                                <Welcome />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/chat" 
                        element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/settings" 
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/about" 
                        element={
                            <ProtectedRoute>
                                <About />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
