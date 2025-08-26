import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MessageCircle, TrendingUp } from 'lucide-react';
import ChatPage from './components/ChatPage';
import TrendingPage from './components/TrendingPage';
import './App.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <Link 
        to="/"
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
        <MessageCircle size={20} />
        Chat
      </Link>
      <Link 
        to="/trending"
        className={`nav-link ${location.pathname === '/trending' ? 'active' : ''}`}>
        <TrendingUp size={20} />
        Trending
      </Link>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/trending" element={<TrendingPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
