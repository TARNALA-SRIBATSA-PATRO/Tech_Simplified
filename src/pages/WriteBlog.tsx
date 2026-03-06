import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUserAuth } from '@/lib/UserAuthContext';
import { apiSubmitBlog } from '@/lib/api';
import { ContentBlock } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ── Block Editor (same as admin) ──────────────────────────────────────────────
function BlockEditor({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (b: ContentBlock[]) => void }) {
  const addBlock = (type: ContentBlock['type']) =>
    onChange([...blocks, { id: crypto.randomUUID(), type, content: '' }]);
  const updateBlock = (id: string, content: string) =>
    onChange(blocks.map(b => (b.id === id ? { ...b, content } : b)));
  const removeBlock = (id: string) => onChange(blocks.filter(b => b.id !== id));
  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => (
        <div key={block.id} className="flex gap-2 items-start bg-secondary/50 rounded-lg p-3 border border-border/50">
          <div className="flex flex-col gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(idx, -1)}>↑</Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(idx, 1)}>↓</Button>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-primary uppercase mb-1 block">{block.type}</span>
            {block.type === 'text' ? (
              <Textarea
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder="Write your content..."
                className="bg-secondary border-border min-h-[100px]"
              />
            ) : (
              <Input
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder={block.type === 'image' ? 'Image URL...' : 'YouTube URL...'}
                className="bg-secondary border-border"
              />
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeBlock(block.id)}>
            ✕
          </Button>
        </div>
      ))}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => addBlock('text')}>+ Text</Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('image')}>+ Image URL</Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('video')}>+ YouTube</Button>
      </div>
    </div>
  );
}

// ── Block Preview Renderer ────────────────────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function BlockPreview({ block }: { block: ContentBlock }) {
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
      if (!ytId) return <p className="text-destructive text-sm">Invalid YouTube URL</p>;
      return (
        <div className="aspect-video rounded-xl overflow-hidden border border-border/50">
          <iframe src={`https://www.youtube.com/embed/${ytId}`} title="Video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      );
    }
    default: return null;
  }
}

// ── Main WriteBlog Page ───────────────────────────────────────────────────────
export default function WriteBlog() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserAuth();

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to write</h2>
        <p className="text-muted-foreground mb-6">You need to be signed in to submit a blog.</p>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    if (blocks.length === 0) { toast({ title: 'Add at least one content block', variant: 'destructive' }); return; }
    setSubmitDialogOpen(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      await apiSubmitBlog(title.trim(), JSON.stringify(blocks));
      setSubmitted(true);
      setSubmitDialogOpen(false);
    } catch (e) {
      toast({ title: 'Submission failed', description: String(e), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-3">Blog Submitted!</h2>
        <div className="bg-card border border-border/50 rounded-xl p-6 text-left space-y-3 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">What happens next?</span>
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary">1.</span> The Tech Simplified team will review your blog.</li>
            <li className="flex gap-2"><span className="text-primary">2.</span> Due to the volume of submissions, there may be a few working days' delay.</li>
            <li className="flex gap-2"><span className="text-primary">3.</span> If approved, it will be published and you'll receive an email notification.</li>
            <li className="flex gap-2"><span className="text-primary">4.</span> You can track the status and edit/delete your blogs from your dashboard.</li>
          </ul>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/dashboard">Go to My Dashboard</Link>
          </Button>
          <Button variant="outline" asChild className="border-border">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Write a Blog</h1>
          <p className="text-sm text-muted-foreground">Writing as <span className="text-primary">{user?.displayName}</span></p>
        </div>
      </div>

      {/* Preview toggle */}
      {showPreview ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <Eye className="h-4 w-4" /> Preview
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="border-border">
              ← Back to Editor
            </Button>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
            {/* Author line */}
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              {user?.profilePhotoBase64 ? (
                <img src={user.profilePhotoBase64} alt=""
                  className="w-10 h-10 rounded-full object-cover border border-border/50" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user?.displayName?.slice(0, 2).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground">Preview draft</p>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-foreground">{title || '(No title yet)'}</h1>
            {blocks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No content blocks yet.</p>
            ) : (
              <div className="space-y-4">
                {blocks.map(block => <BlockPreview key={block.id} block={block} />)}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <Input
            placeholder="Blog title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="bg-secondary border-border text-xl font-medium h-14"
          />
          <BlockEditor blocks={blocks} onChange={setBlocks} />
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Send className="h-4 w-4" /> Upload
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!title && blocks.length === 0}
              className="gap-2 border-border"
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your blog?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span className="block">Are you sure you want to submit "<strong className="text-foreground">{title}</strong>"?</span>
              <span className="block text-xs leading-relaxed">
                After submitting, the Tech Simplified team will review it. If approved and published,
                you'll receive an email. The process may take a few working days. You can track and
                edit/delete your submission from your dashboard at any time.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
