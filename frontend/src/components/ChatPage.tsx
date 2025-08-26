import React, { useState } from 'react';
import { Mic, Paperclip, Send, Settings } from 'lucide-react';
import AnimatedStars from './AnimatedStars';
import './ChatPage.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  reliability?: number;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm SatyaMatrix, your AI assistant. Click the microphone and start speaking, or use the text input below.",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const reliability = Math.random() * 100;
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I've analyzed your news content. Reliability score: ${reliability.toFixed(1)}%`,
        sender: 'bot',
        timestamp: new Date(),
        reliability,
      };

      setMessages(prev => [...prev, botResponse]);

      if (reliability < 60) {
        setCurrentAnalysis({
          content: inputText,
          reliability,
          reasons: ['Source credibility issues', 'Factual inconsistencies', 'Emotional language patterns']
        });
        setShowModal(true);
      }
    }, 1000);
  };

  return (
    <div className="chat-page-container">
      <AnimatedStars />
      <div className="chat-header">
        <h1>SatyaMatrix</h1>
        <button className="icon-btn">
          <Settings size={20} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              <p>{message.text}</p>
              {message.reliability !== undefined && (
                <div className={`reliability-score ${message.reliability < 60 ? 'low' : 'high'}`}>
                  Reliability: {message.reliability.toFixed(1)}%
                </div>
              )}
            </div>
            <span className="timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <button className={`icon-btn mic-btn ${isRecording ? 'recording' : ''}`} onClick={() => setIsRecording(!isRecording)}>
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="text-input"
          />
          <button className="icon-btn">
            <Paperclip size={20} />
          </button>
          <button className="send-btn" onClick={handleSendMessage}>
            <Send size={20} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Potential Misinformation Detected</h2>
            <div className="analysis-details">
              <p><strong>Content:</strong> {currentAnalysis?.content}</p>
              <p><strong>Reliability Score:</strong> {currentAnalysis?.reliability.toFixed(1)}%</p>
              <div className="reasons">
                <strong>Reasons for concern:</strong>
                <ul>
                  {currentAnalysis?.reasons.map((reason: string, index: number) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)} className="publish-btn">
                Publish to Community
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
