import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function About() {
    const navigate = useNavigate();
    const [activeFaq, setActiveFaq] = useState(null);

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "What kind of questions can I ask TalkAI?",
            answer: "You can ask anything from simple facts to complex explanations, creative ideas, coding help, writing assistance, and more. TalkAI is versatile and ready to help with a wide range of topics."
        },
        {
            question: "Is my conversation data private?",
            answer: "Yes, your conversations are stored securely and are only accessible to you. We take privacy seriously and do not share your data with third parties."
        },
        {
            question: "How do I start a new conversation?",
            answer: 'Simply click the "+" button next to "Chats" in the sidebar, or start typing in the message input field to begin a new conversation automatically.'
        },
        {
            question: "Can I edit or delete my past messages?",
            answer: "Currently, you can delete entire chat conversations from your history, but individual messages cannot be edited. You can clear all your chat history from the Settings page."
        }
    ];

    return (
        <div className="about-container">
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
            <div className="about-content">
                <div className="about-section">
                    <h1>About TalkAI</h1>
                    <p>TalkAI is your personal, beginner-friendly AI chatbot designed to simplify complex tasks and provide instant, accurate answers. We believe that artificial intelligence should be accessible to everyone, and our mission is to make interacting with AI as intuitive and effortless as possible.</p>
                    <p>Our clean interface, soft aesthetics, and generous spacing are crafted to reduce cognitive load and offer a calming user experience. Whether you're looking for quick information, brainstorming ideas, or just curious about AI, TalkAI is here to assist you every step of the way.</p>
                </div>
                
                <div className="about-section">
                    <h2>How to Use It</h2>
                    <ul>
                        <li>
                            <strong>1️⃣ Start a New Chat:</strong>
                            <p>Click the "New Chat" button or simply type your first message in the input box at the bottom of the chat screen.</p>
                        </li>
                        <li>
                            <strong>2️⃣ Type Your Message:</strong>
                            <p>Enter your questions, prompts, or thoughts into the message input field.</p>
                        </li>
                        <li>
                            <strong>3️⃣ Send Your Message:</strong>
                            <p>Press 'Enter' or click the 'Send' button to get an instant response from TalkAI.</p>
                        </li>
                        <li>
                            <strong>4️⃣ Review Chat History:</strong>
                            <p>Access all your previous conversations via the sidebar to the left. Click on any chat title to resume or review it.</p>
                        </li>
                        <li>
                            <strong>5️⃣ Manage Your Account:</strong>
                            <p>Use the user menu in the top right corner to access your Profile, Settings, or get more About & Help information.</p>
                        </li>
                    </ul>
                </div>
                
                <div className="about-section">
                    <h2>Frequently Asked Questions</h2>
                    
                    {faqs.map((faq, index) => (
                        <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                            <button className="faq-question" onClick={() => toggleFaq(index)}>
                                {faq.question}
                                <span>▼</span>
                            </button>
                            <div className="faq-answer">
                                {faq.answer}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="about-section">
                    <h2>Need More Help?</h2>
                    <p>If you can't find the answer to your question here, or if you encounter any issues, our support team is ready to assist you.</p>
                    <button className="btn btn-primary" style={{ maxWidth: '200px' }}>Contact Support</button>
                </div>
            </div>
            <div className="footer">
                © 2026 TalkAI. All rights reserved.
            </div>
        </div>
    );
}

export default About;
