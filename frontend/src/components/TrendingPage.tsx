import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Eye, Calendar, Search, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './TrendingPage.css';

interface ReportItem {
  id: string;
  title: string | null;
  analysis_text: string | null;
  reliability: number | null;
  reasons: string[] | null;
  created_at: string;
  views: number;
  tags: string[] | null;
  image_url: string | null;
  likes?: number;
  dislikes?: number;
}

const TrendingPage: React.FC = () => {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5050';
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Generate or read a stable anonymous voter id
  const getVoterId = () => {
    const key = 'satya_voter_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setSessionToken(data.session?.access_token || null);
    setAuthUserEmail(data.session?.user?.email || null);
    setAuthEmail('');
    setAuthPassword('');
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionToken(null);
    setAuthUserEmail(null);
  };

  const handleDelete = async (reportId: string) => {
    if (!sessionToken) {
      alert('Login required');
      return;
    }
    if (!confirm('Delete this report permanently?')) return;
    const res = await fetch(`${API_BASE}/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Delete failed');
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== reportId));
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/trending`);
        if (!res.ok) throw new Error(`Failed to load trending: ${res.status}`);
        const json = await res.json();
        setItems(json.reports || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Load local vote choices
  useEffect(() => {
    const saved = localStorage.getItem('satya_user_votes');
    if (saved) {
      try {
        setUserVotes(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Listen for auth changes and keep token
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data.session;
      setSessionToken(sess?.access_token || null);
      setAuthUserEmail(sess?.user?.email || null);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setSessionToken(session?.access_token || null);
      setAuthUserEmail(session?.user?.email || null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const persistVotes = (map: Record<string, 1 | -1 | 0>) => {
    localStorage.setItem('satya_user_votes', JSON.stringify(map));
  };

  const applyOptimistic = (reportId: string, vote: 1 | -1) => {
    const prev = userVotes[reportId] ?? 0;
    if (prev === vote) return; // no-op
    setItems((prevItems) =>
      prevItems.map((it) => {
        if (it.id !== reportId) return it;
        let likes = it.likes ?? 0;
        let dislikes = it.dislikes ?? 0;
        if (prev === 0) {
          if (vote === 1) likes += 1; else dislikes += 1;
        } else if (prev === 1 && vote === -1) {
          likes = Math.max(0, likes - 1);
          dislikes += 1;
        } else if (prev === -1 && vote === 1) {
          dislikes = Math.max(0, dislikes - 1);
          likes += 1;
        }
        return { ...it, likes, dislikes };
      })
    );
    const nextVotes = { ...userVotes, [reportId]: vote };
    setUserVotes(nextVotes);
    persistVotes(nextVotes);
  };

  const handleVote = async (reportId: string, vote: 1 | -1) => {
    const voter_id = getVoterId();
    const prev = userVotes[reportId] ?? 0;
    if (prev === vote) return; // avoid duplicate
    applyOptimistic(reportId, vote);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${reportId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id, vote }),
      });
      if (!res.ok) throw new Error('Vote failed');
      const json = await res.json();
      // Sync exact counts from server response
      setItems((prevItems) =>
        prevItems.map((it) => (it.id === reportId ? { ...it, likes: json.likes ?? it.likes, dislikes: json.dislikes ?? it.dislikes } : it))
      );
    } catch (e) {
      // Rollback on error
      setItems((prevItems) =>
        prevItems.map((it) => {
          if (it.id !== reportId) return it;
          // simple refetch fallback
          return it;
        })
      );
      // revert local vote choice
      const nextVotes = { ...userVotes, [reportId]: prev as 1 | -1 | 0 };
      setUserVotes(nextVotes);
      persistVotes(nextVotes);
    }
  };

  return (
    <div className="trending-page-container">
      <div className="trending-header">
        <div className="header-bar">
          <div className="left-spacer" />
          <div className="right-actions">
            {sessionToken ? (
              <>
                <span className="signed-in">{authUserEmail}</span>
                <button className="btn small" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className="btn small" onClick={() => setShowLoginModal(true)}>Admin Login</button>
            )}
          </div>
        </div>
        <h1>Trending Misinformation</h1>
        <p>Community-verified fake news and misinformation alerts.</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, text, or #tag"
        />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}
      <div className="news-grid">
        {items
          .filter((item) => {
            if (!query.trim()) return true;
            const q = query.trim().toLowerCase();
            const inTitle = (item.title || '').toLowerCase().includes(q);
            const inText = (item.analysis_text || '').toLowerCase().includes(q);
            const inTags = (item.tags || []).some((t) => `#${t}`.toLowerCase().includes(q) || t.toLowerCase().includes(q));
            return inTitle || inText || inTags;
          })
          .map((item) => (
          <div key={item.id} className="news-card">
            {item.image_url ? (
              <div className="news-image">
                <img src={item.image_url} alt={item.title || 'Report image'} loading="lazy" />
              </div>
            ) : null}
            <div className="news-content">
              <div className="reliability-badge">
                <span className={`reliability-score ${(item.reliability ?? 0) < 40 ? 'low' : 'high'}`}>
                  {(item.reliability ?? 0).toFixed(1)}% Reliable
                </span>
              </div>
              <h3 className="news-title">{item.title || 'Community Report'}</h3>
              <p className="news-description">{item.analysis_text || ''}</p>
              <div className="reasons-section">
                <strong>Reasons for concern:</strong>
                <ul>
                  {(item.reasons || []).map((reason, index) => <li key={index}>{reason}</li>)}
                </ul>
              </div>
              <div className="tags">
                {(item.tags || []).map((tag) => <span key={tag} className="tag">#{tag}</span>)}
              </div>
              <div className="news-meta">
                <div className="meta-item">
                  <Eye size={16} /> <span>{(item.likes ?? 0) + (item.dislikes ?? 0)}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={16} /> <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="news-actions">
                <div className="vote-section">
                  <button
                    className="vote-btn"
                    onClick={() => handleVote(item.id, 1)}
                  >
                    <ThumbsUp size={16} /> {item.likes ?? 0}
                  </button>
                  <button
                    className="vote-btn"
                    onClick={() => handleVote(item.id, -1)}
                  >
                    <ThumbsDown size={16} /> {item.dislikes ?? 0}
                  </button>
                </div>
                {sessionToken && (
                  <div className="admin-actions">
                    <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                )}
                <div className="action-buttons">
                  <button className="action-btn"><Search size={18} />Share</button>
                  <button className="action-btn report-btn"><Flag size={18} />Report</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showLoginModal && !sessionToken && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Admin Login</h2>
            <div className="modal-fields">
              <label>Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowLoginModal(false)}>Cancel</button>
              <button className="publish-btn" onClick={handleLogin}>Login</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingPage;
