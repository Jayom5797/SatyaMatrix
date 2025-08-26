const express = require('express');
const { supabase, STORAGE_BUCKET } = require('../supabase');

const router = express.Router();

function pathFromPublicUrl(url) {
  try {
    const u = new URL(url);
    const key = `/object/public/${STORAGE_BUCKET}/`;
    const idx = u.pathname.indexOf(key);
    if (idx === -1) return null;
    const p = u.pathname.slice(idx + key.length);
    return decodeURIComponent(p);
  } catch {
    return null;
  }
}

async function requireAdmin(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'missing bearer token' });
      return null;
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({ error: 'invalid token' });
      return null;
    }
    const user = data.user;
    // Admin check: (1) email allowlist, or (2) app_metadata.role === 'admin' or includes in roles
    const allowlist = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const email = (user.email || '').toLowerCase();
    const am = user.app_metadata || {};
    const role = am.role || am.roles || null;
    const isRoleAdmin = (typeof role === 'string' && role === 'admin') || (Array.isArray(role) && role.includes('admin'));
    const isAdmin = isRoleAdmin || (allowlist.length > 0 && allowlist.includes(email));
    if (!isAdmin) {
      res.status(403).json({ error: 'admin only' });
      return null;
    }
    return user;
  } catch (e) {
    res.status(500).json({ error: e.message });
    return null;
  }
}

// Create a report
router.post('/reports', async (req, res) => {
  try {
    const payload = req.body || {};
    const insert = {
      title: payload.title || null,
      source_type: payload.source_type || null, // 'image' | 'headline' | 'link'
      source_url: payload.source_url || null,
      image_url: payload.image_url || null,
      headline: payload.headline || null,
      link: payload.link || null,
      analysis_text: payload.analysis_text || null,
      reliability: typeof payload.reliability === 'number' ? payload.reliability : null,
      tags: payload.tags || [], // JSON array
      reasons: payload.reasons || [], // JSON array of strings
      status: payload.status || 'published',
    };

    const { data, error } = await supabase.from('reports').insert(insert).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ report: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Get trending reports (latest published) and include like/dislike counts
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ error: error.message });

    // Fetch like/dislike counts for each report
    const reports = Array.isArray(data) ? data : [];
    const withVotes = await Promise.all(
      reports.map(async (r) => {
        const { data: counts, error: cntErr } = await supabase
          .from('report_votes')
          .select('vote', { count: 'exact', head: false })
          .eq('report_id', r.id);

        if (cntErr) {
          return { ...r, likes: 0, dislikes: 0 };
        }

        let likes = 0;
        let dislikes = 0;
        for (const row of counts || []) {
          if (row.vote === 1) likes += 1;
          if (row.vote === -1) dislikes += 1;
        }
        return { ...r, likes, dislikes };
      })
    );

    return res.json({ reports: withVotes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Get vote counts for a specific report
router.get('/reports/:id/votes', async (req, res) => {
  try {
    const reportId = req.params.id;
    const { data, error } = await supabase
      .from('report_votes')
      .select('vote')
      .eq('report_id', reportId);
    if (error) return res.status(500).json({ error: error.message });
    let likes = 0;
    let dislikes = 0;
    for (const row of data || []) {
      if (row.vote === 1) likes += 1;
      if (row.vote === -1) dislikes += 1;
    }
    return res.json({ likes, dislikes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Cast or change a vote for a report
// Body: { voter_id: string, vote: 1 | -1 }
router.post('/reports/:id/vote', async (req, res) => {
  try {
    const reportId = req.params.id;
    const { voter_id, vote } = req.body || {};
    if (!reportId) return res.status(400).json({ error: 'report id required' });
    if (!voter_id || typeof voter_id !== 'string') return res.status(400).json({ error: 'voter_id required' });
    if (![1, -1].includes(vote)) return res.status(400).json({ error: 'vote must be 1 or -1' });

    // Upsert vote
    const { error: upErr } = await supabase
      .from('report_votes')
      .upsert({ report_id: reportId, voter_id, vote }, { onConflict: 'report_id,voter_id' });
    if (upErr) return res.status(500).json({ error: upErr.message });

    // Return updated counts
    const { data, error } = await supabase
      .from('report_votes')
      .select('vote')
      .eq('report_id', reportId);
    if (error) return res.status(500).json({ error: error.message });
    let likes = 0;
    let dislikes = 0;
    for (const row of data || []) {
      if (row.vote === 1) likes += 1;
      if (row.vote === -1) dislikes += 1;
    }
    return res.json({ likes, dislikes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Delete a report (admin only)
router.delete('/reports/:id', async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return; // response already sent

    const reportId = req.params.id;
    if (!reportId) return res.status(400).json({ error: 'report id required' });

    // Fetch report to get any associated image path from its public URL
    const { data: reportRow, error: repErr } = await supabase
      .from('reports')
      .select('image_url')
      .eq('id', reportId)
      .single();
    if (repErr) {
      return res.status(500).json({ error: repErr.message });
    }

    // Delete votes first (no FK cascade assumed)
    const { error: delVotesErr } = await supabase
      .from('report_votes')
      .delete()
      .eq('report_id', reportId);
    if (delVotesErr) return res.status(500).json({ error: delVotesErr.message });

    // Delete associated image from storage if present
    const imgUrl = reportRow?.image_url;
    if (imgUrl) {
      const objectPath = pathFromPublicUrl(imgUrl);
      if (objectPath) {
        const { error: rmErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([objectPath]);
        if (rmErr) {
          // Not fatal: continue to delete DB record but report error message
          console.warn('Storage remove failed:', rmErr.message);
        }
      }
    }

    // Delete the report
    const { error: delRepErr } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);
    if (delRepErr) return res.status(500).json({ error: delRepErr.message });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
