import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, Share2, Eye, Calendar } from 'lucide-react';
import './TrendingPage.css';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  reliabilityScore: number;
  reasons: string[];
  publishedAt: Date;
  votes: { up: number; down: number };
  views: number;
  tags: string[];
}

const TrendingPage: React.FC = () => {
  const [newsItems] = useState<NewsItem[]>([
    {
      id: '1',
      title: 'Breaking: Local Celebrity Spotted at Unusual Location',
      content: 'A viral image claims to show a famous personality at a controversial event. Our analysis suggests this may be digitally manipulated.',
      reliabilityScore: 23.5,
      reasons: ['Image metadata inconsistencies', 'Lighting anomalies', 'Source credibility issues'],
      publishedAt: new Date('2024-01-15'),
      votes: { up: 156, down: 23 },
      views: 2847,
      tags: ['celebrity', 'image-manipulation', 'viral'],
    },
    {
      id: '2',
      title: 'Health Miracle Cure Claims Spreading on Social Media',
      content: 'Multiple posts claim a common household item can cure serious diseases. Medical experts have debunked these claims.',
      reliabilityScore: 15.2,
      reasons: ['No scientific evidence', 'Contradicts medical consensus', 'Emotional manipulation'],
      publishedAt: new Date('2024-01-14'),
      votes: { up: 289, down: 45 },
      views: 4521,
      tags: ['health', 'misinformation', 'social-media'],
    },
  ]);

  return (
    <div className="trending-page-container">
      <div className="trending-header">
        <h1>Trending Misinformation</h1>
        <p>Community-verified fake news and misinformation alerts.</p>
      </div>

      <div className="filters">
        <button className="filter-btn active">All</button>
        <button className="filter-btn">Health</button>
        <button className="filter-btn">Politics</button>
        <button className="filter-btn">Technology</button>
      </div>

      <div className="news-grid">
        {newsItems.map((item) => (
          <div key={item.id} className="news-card">
            <div className="news-content">
              <div className="reliability-badge">
                <span className={`reliability-score ${item.reliabilityScore < 40 ? 'low' : 'high'}`}>
                  {item.reliabilityScore.toFixed(1)}% Reliable
                </span>
              </div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-description">{item.content}</p>
              <div className="reasons-section">
                <strong>Reasons for concern:</strong>
                <ul>
                  {item.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
                </ul>
              </div>
              <div className="tags">
                {item.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
              </div>
              <div className="news-meta">
                <div className="meta-item"><Calendar size={16} /><span>{item.publishedAt.toLocaleDateString()}</span></div>
                <div className="meta-item"><Eye size={16} /><span>{item.views.toLocaleString()} views</span></div>
              </div>
              <div className="news-actions">
                <div className="vote-section">
                  <button className="vote-btn"><ThumbsUp size={18} /><span>{item.votes.up}</span></button>
                  <button className="vote-btn"><ThumbsDown size={18} /><span>{item.votes.down}</span></button>
                </div>
                <div className="action-buttons">
                  <button className="action-btn"><Share2 size={18} />Share</button>
                  <button className="action-btn report-btn"><Flag size={18} />Report</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPage;
