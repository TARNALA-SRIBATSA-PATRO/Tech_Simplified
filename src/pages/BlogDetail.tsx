import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Share2, Loader2, Heart, Eye, User } from 'lucide-react';
import {
  apiGetBlog, ApiBlog, apiGetBlogStats, apiToggleLike, apiIncrementView,
} from '@/lib/api';
import { ContentBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useUserAuth } from '@/lib/UserAuthContext';
import CommentSection from '@/components/CommentSection';

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="prose prose-invert prose-orange max-w-none">
          {block.content.split('\n').map((p, i) => (
            <p key={i} className="text-foreground/90 leading-relaxed mb-4">{p}</p>
          ))}
        </div>
      );
    case 'image':
      return (
        <div className="rounded-xl overflow-hidden border border-border/50">
          <img src={block.content} alt="" className="w-full object-cover" loading="lazy" />
        </div>
      );
    case 'video': {
      const ytId = extractYoutubeId(block.content);
      if (!ytId) return <p className="text-destructive">Invalid video URL</p>;
      return (
        <div className="aspect-video rounded-xl overflow-hidden border border-border/50">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title="Video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    default: return null;
  }
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, isLoggedIn } = useUserAuth();

  const [blog, setBlog] = useState<ApiBlog | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [liking, setLiking] = useState(false);

  // Author info (resolved from blog)
  const [authorName, setAuthorName] = useState('Tech Simplified');
  const [authorPhoto, setAuthorPhoto] = useState('');

  const viewTracked = useRef(false);

  // ── Load blog ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    apiGetBlog(id)
      .then(data => {
        setBlog(data);
        try { setBlocks(JSON.parse(data.content)); }
        catch { setBlocks([{ id: '1', type: 'text', content: data.content }]); }
        setViewCount(data.viewCount || 0);
      })
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Load stats & track view ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    apiGetBlogStats(id)
      .then(stats => {
        setLikeCount(stats.likeCount);
        setViewCount(stats.viewCount);
        setLikedByMe(stats.likedByMe);
      })
      .catch(() => {});

    // Track view once per session
    const viewKey = `viewed_blog_${id}`;
    if (!viewTracked.current && !sessionStorage.getItem(viewKey)) {
      viewTracked.current = true;
      apiIncrementView(id)
        .then(res => setViewCount(res.viewCount))
        .catch(() => {});
      sessionStorage.setItem(viewKey, '1');
    }
  }, [id]);

  // ── Handle like/unlike ─────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast({ title: 'Sign in to like posts', description: 'Create a free profile to interact with blogs.' });
      return;
    }
    if (!id) return;
    setLiking(true);
    try {
      const res = await apiToggleLike(id);
      setLikedByMe(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      toast({ title: 'Failed to update like', variant: 'destructive' });
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = blog ? `"${blog.title}" — read on Tech Simplified` : url;
    if (navigator.share) {
      try { await navigator.share({ title: blog?.title ?? 'Tech Simplified', text, url }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Blog URL copied to clipboard.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Button asChild variant="ghost"><Link to="/">← Back to Home</Link></Button>
      </div>
    );
  }

  const date = new Date(blog.createdAt);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Top nav */}
      <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
        <Button variant="outline" size="sm"
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
          onClick={handleShare}>
          <Share2 className="h-4 w-4" />Share
        </Button>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Author + Stats bar at top */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            {blog.authorSubscriberId ? (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/30">
                <User className="h-5 w-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/30">
                TS
              </div>
            )}
            <div>
              <p className="font-medium text-sm">
                {blog.authorSubscriberId ? 'Community Author' : 'Tech Simplified'}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{date.toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          {/* View + like counts */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> {viewCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className={`h-4 w-4 ${likedByMe ? 'fill-primary text-primary' : ''}`} />
              {likeCount.toLocaleString()}
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-8">{blog.title}</h1>

        {/* Content blocks */}
        <div className="space-y-8">
          {blocks.map(block => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>

        {/* Like / Share bar at bottom */}
        <div className="mt-12 pt-8 border-t border-border/50 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all
                ${likedByMe
                  ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30'
                  : 'bg-secondary border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40'
                }`}
            >
              {liking
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Heart className={`h-4 w-4 ${likedByMe ? 'fill-current' : ''}`} />}
              {likedByMe ? 'Liked' : 'Like'} · {likeCount}
            </button>
          </div>
          <Button variant="outline"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
            onClick={handleShare}>
            <Share2 className="h-4 w-4" />Share this post
          </Button>
        </div>

        {/* Comments Section */}
        {id && <CommentSection blogId={id} />}
      </motion.article>
    </div>
  );
}
