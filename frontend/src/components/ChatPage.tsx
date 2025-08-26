import React, { useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5050';

  const openPublishModalFor = (payload: { content: string; reliability?: number }) => {
    setCurrentAnalysis({
      content: payload.content,
      reliability: payload.reliability,
      reasons: ['Source credibility issues', 'Factual inconsistencies', 'Emotional language patterns']
    });
    setEditedContent(payload.content || '');
    setTagsInput('');
    setShowModal(true);
  };

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
    }, 1000);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: `Attached file: ${file.name} (${Math.round(file.size / 1024)} KB)`,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setSelectedFile(file);
    // reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const detectSourceType = (text: string, hasImage: boolean): 'image' | 'headline' | 'link' => {
    if (hasImage) return 'image';
    const urlRegex = /https?:\/\//i;
    if (urlRegex.test(text)) return 'link';
    return 'headline';
  };

  const publishCurrentAnalysis = async () => {
    try {
      if (!currentAnalysis) return;

      // 1) upload image if any
      let image_url: string | null = null;
      if (selectedFile) {
        const form = new FormData();
        form.append('file', selectedFile);
        const upRes = await fetch(`${API_BASE}/api/upload-image`, {
          method: 'POST',
          body: form,
        });
        if (!upRes.ok) throw new Error('Upload failed');
        const upJson = await upRes.json();
        image_url = upJson.url || null;
      }

      // 2) create report
      const contentText = (editedContent || currentAnalysis.content || '').trim();
      const reliabilityNum = typeof currentAnalysis.reliability === 'number' ? currentAnalysis.reliability : null;
      const source_type = detectSourceType(contentText, !!image_url);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const payload = {
        title: contentText.slice(0, 120),
        source_type,
        image_url,
        headline: source_type === 'headline' ? contentText : null,
        link: source_type === 'link' ? contentText : null,
        analysis_text: contentText,
        reliability: reliabilityNum,
        reasons: currentAnalysis.reasons || [],
        tags,
        status: 'published',
      };

      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Publish failed');
      // Optionally, show a confirmation message in chat
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        text: 'Report published successfully to community.',
        sender: 'bot',
        timestamp: new Date(),
      }]);
      setShowModal(false);
      setSelectedFile(null);
      setEditedContent('');
      setTagsInput('');
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 3).toString(),
        text: `Failed to publish: ${err.message}`,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    }
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
                <div className="reliability-row">
                  <div className={`reliability-score ${message.reliability < 60 ? 'low' : 'high'}`}>
                    Reliability: {message.reliability.toFixed(1)}%
                  </div>
                  {message.reliability < 60 && (
                    <button
                      className="publish-inline-btn"
                      onClick={() => openPublishModalFor({ content: message.text, reliability: message.reliability })}
                      title="Publish to Community"
                    >
                      Publish
                    </button>
                  )}
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
          <button className="icon-btn" onClick={handleAttachClick}>
            <Paperclip size={20} />
          </button>
          <button className="send-btn" onClick={handleSendMessage}>
            <Send size={20} />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Potential Misinformation Detected</h2>
            <div className="analysis-details">
              <div className="field">
                <label>Content</label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Edit the content/headline/link to publish"
                  rows={4}
                />
              </div>
              <p><strong>Reliability Score:</strong> {currentAnalysis?.reliability.toFixed(1)}%</p>
              <div className="reasons">
                <strong>Reasons for concern:</strong>
                <ul>
                  {currentAnalysis?.reasons.map((reason: string, index: number) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="field">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. health, hoax, politics"
                />
                {tagsInput.trim() && (
                  <div className="tags-preview">
                    {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                      <span key={t} className="tag-chip">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-attach">
                <strong>Attachment (optional):</strong>
                <div className="attach-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button className="publish-inline-btn" onClick={handleAttachClick}>Add/Change Image</button>
                  {selectedFile && (
                    <span className="attach-name">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
                  )}
                </div>
                {selectedFile && (
                  <div className="attach-preview">
                    <img src={URL.createObjectURL(selectedFile)} alt="Selected" />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={publishCurrentAnalysis} className="publish-btn">
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
