import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { getBlog } from '@/lib/store';
import { ContentBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';

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

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const blog = getBlog(id || '');

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
      <Button asChild variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
      </Button>

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
      </motion.article>
    </div>
  );
}
