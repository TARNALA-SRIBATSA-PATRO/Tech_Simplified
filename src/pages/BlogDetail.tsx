import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Share2, Loader2 } from 'lucide-react';
import { apiGetBlog, ApiBlog } from '@/lib/api';
import { ContentBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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
    default:
      return null;
  }
}

function parseBlog(api: ApiBlog) {
  let content: ContentBlock[] = [];
  try {
    content = JSON.parse(api.content);
  } catch {
    content = [{ id: '1', type: 'text', content: api.content }];
  }
  return {
    id: api.id,
    title: api.title,
    content,
    created_at: api.createdAt,
  };
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<ReturnType<typeof parseBlog> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiGetBlog(id)
      .then(data => setBlog(parseBlog(data)))
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [id]);

  /** Native system share sheet (falls back to clipboard copy) */
  const handleShare = async () => {
    const url = window.location.href;
    const text = blog ? `"${blog.title}" — read on Tech Simplified` : url;

    if (navigator.share) {
      try {
        await navigator.share({ title: blog?.title ?? 'Tech Simplified', text, url });
      } catch {
        // User cancelled — ignore
      }
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
        <Button asChild variant="ghost">
          <Link to="/">← Back to Home</Link>
        </Button>
      </div>
    );
  }

  const date = new Date(blog.created_at);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>

        {/* Share Button — uses system native share sheet */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">{blog.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {date.toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="space-y-8">
          {blog.content.map(block => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>

        {/* Share button at bottom too */}
        <div className="mt-14 pt-8 border-t border-border/50 flex justify-center">
          <Button
            variant="outline"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" /> Share this post
          </Button>
        </div>
      </motion.article>
    </div>
  );
}
