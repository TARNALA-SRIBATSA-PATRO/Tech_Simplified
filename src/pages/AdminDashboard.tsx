import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Pencil, Send, FileText, Users, MessageSquare,
  UserMinus, Loader2, X, Search, CheckSquare, Square, Mail, Eye, Calendar, Clock, Menu, ChevronDown,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { isAdminLoggedIn } from '@/lib/store';
import {
  apiGetBlogs, apiCreateBlog, apiUpdateBlog, apiDeleteBlog, ApiBlog,
  apiGetSubscribers, apiDeleteSubscriber, apiDeleteSubscribersBulk,
  apiSendNewsletter, ApiSubscriber, apiGetMessageLogs, ApiMessageLog,
} from '@/lib/api';
import { ContentBlock } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

// ── Block Editor ──────────────────────────────────────────────────────────────

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
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => addBlock('text')}>+ Text</Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('image')}>+ Image</Button>
        <Button variant="outline" size="sm" onClick={() => addBlock('video')}>+ Video</Button>
      </div>
    </div>
  );
}

// ── Subscriber Multi-Select Tag Picker ────────────────────────────────────────

function SubscriberTagPicker({
  subscribers,
  selected,
  onChange,
}: {
  subscribers: ApiSubscriber[];
  selected: string[];
  onChange: (emails: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = subscribers.filter(
    s => !selected.includes(s.email) && s.email.toLowerCase().includes(query.toLowerCase()),
  );

  const add = (email: string) => { onChange([...selected, email]); setQuery(''); };
  const remove = (email: string) => onChange(selected.filter(e => e !== email));

  return (
    <div ref={ref} className="relative">
      <div className="min-h-[42px] flex flex-wrap gap-1.5 items-center border border-border rounded-md px-3 py-2 bg-secondary cursor-text"
        onClick={() => setOpen(true)}>
        {selected.map(email => (
          <span key={email} className="flex items-center gap-1 bg-primary/15 text-primary text-xs font-medium rounded-full px-2.5 py-1">
            {email}
            <button onClick={e => { e.stopPropagation(); remove(email); }}
              className="hover:text-destructive transition-colors ml-0.5">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
            placeholder={selected.length === 0 ? 'Search and select subscribers...' : 'Add more...'}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
        </div>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button key={s.id} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors"
              onMouseDown={e => { e.preventDefault(); add(s.email); }}>
              {s.email}
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-xl p-3 text-sm text-muted-foreground">
          No matching subscribers found.
        </div>
      )}
    </div>
  );
}

// ── Blocks to plain text helper (for email textContent fallback) ──────────────
function blocksToText(blocks: ContentBlock[]): string {
  return blocks.map(b => {
    if (b.type === 'text') return b.content;
    if (b.type === 'image') return `[Image: ${b.content}]`;
    if (b.type === 'video') return `[Video: ${b.content}]`;
    return '';
  }).join('\n\n');
}

// ── Blocks to simple HTML (for email htmlContent) ────────────────────────────
function blocksToHtml(blocks: ContentBlock[], subject?: string): string {
  const heading = subject
    ? `<h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">${subject}</h2>`
    : '';
  const body = blocks.map(b => {
    if (b.type === 'text')
      return `<p style="font-size:15px;color:#cccccc;line-height:1.8;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;margin:0 0 16px;">${b.content}</p>`;
    if (b.type === 'image')
      return `<img src="${b.content}" alt="" style="max-width:100%;border-radius:8px;margin:0 0 16px;display:block;"/>`;
    if (b.type === 'video')
      return `<p style="margin:0 0 16px;"><a href="${b.content}" style="color:#f97316;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${b.content}</a></p>`;
    return '';
  }).join('');
  return heading + body;
}

// ── YouTube ID helper (for preview) ───────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Block renderer used inside the preview overlay ──────────────────────
function BlockPreviewRenderer({ block }: { block: ContentBlock }) {
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

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ── Tab state (controlled so we can switch from Subscribers → Messages) ─────
  const [activeTab, setActiveTab] = useState('blogs');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [blogs, setBlogs] = useState<ApiBlog[]>([]);
  const [subscribers, setSubs] = useState<ApiSubscriber[]>([]);
  const [messageLogs, setMessageLogs] = useState<ApiMessageLog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // ── Blog editor state ─────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(true);

  // ── Preview state ──────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [previewNotify, setPreviewNotify] = useState(true);

  // ── Subscriber selection state ────────────────────────────────────────────
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [subSearch, setSubSearch] = useState('');

  // ── Message compose state ─────────────────────────────────────────────────
  const [sendToMode, setSendToMode] = useState<'all' | 'specific'>('all');
  const [msgRecipients, setMsgRecipients] = useState<string[]>([]);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBlocks, setMsgBlocks] = useState<ContentBlock[]>([{ id: crypto.randomUUID(), type: 'text', content: '' }]);
  const [sending, setSending] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdminLoggedIn()) navigate('/admin');
  }, [navigate]);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchBlogs = useCallback(async () => {
    setLoadingBlogs(true);
    try {
      const data = await apiGetBlogs();
      setBlogs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      toast({ title: 'Failed to load blogs', variant: 'destructive' });
    } finally {
      setLoadingBlogs(false);
    }
  }, []);

  const fetchSubs = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const data = await apiGetSubscribers();
      setSubs(data.filter(s => s.verified));
    } catch {
      toast({ title: 'Failed to load subscribers', variant: 'destructive' });
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      setMessageLogs(await apiGetMessageLogs());
    } catch {
      // Silently ignore — history is non-critical
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => { fetchBlogs(); fetchSubs(); fetchLogs(); }, [fetchBlogs, fetchSubs, fetchLogs]);

  // ── Blog handlers ───────────────────────────────────────────────────────────
  const handleSaveBlog = async () => {
    if (!title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    if (blocks.length === 0) { toast({ title: 'Add at least one content block', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const contentJson = JSON.stringify(blocks);
      if (editingId) {
        await apiUpdateBlog(editingId, title.trim(), contentJson);
        toast({ title: 'Blog updated!' });
      } else {
        await apiCreateBlog(title.trim(), contentJson, notifySubscribers);
        toast({
          title: 'Blog published!',
          description: notifySubscribers
            ? 'Subscribers have been notified by email.'
            : 'No email notification sent.',
        });
      }
      resetEditor();
      fetchBlogs();
    } catch (e: unknown) {
      toast({ title: 'Failed to save blog', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (blog: ApiBlog) => {
    setEditingId(blog.id);
    setTitle(blog.title);
    try { setBlocks(JSON.parse(blog.content)); }
    catch { setBlocks([{ id: crypto.randomUUID(), type: 'text', content: blog.content }]); }
    setActiveTab('blogs');
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteBlog(id);
      setBlogs(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Blog deleted' });
    } catch {
      toast({ title: 'Failed to delete blog', variant: 'destructive' });
    }
  };

  const resetEditor = () => { setEditingId(null); setTitle(''); setBlocks([]); setNotifySubscribers(true); setShowPreview(false); };

  const openPreview = () => {
    if (!title.trim() && blocks.length === 0) {
      toast({ title: 'Nothing to preview', description: 'Add a title and some content first.', variant: 'destructive' });
      return;
    }
    setPreviewNotify(notifySubscribers);
    setShowPreview(true);
  };

  const handlePublishFromPreview = async () => {
    if (!title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    if (blocks.length === 0) { toast({ title: 'Add at least one content block', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const contentJson = JSON.stringify(blocks);
      await apiCreateBlog(title.trim(), contentJson, previewNotify);
      toast({
        title: 'Blog published!',
        description: previewNotify ? 'Subscribers have been notified.' : 'No email notification sent.',
      });
      resetEditor();
      fetchBlogs();
      setPublishConfirmOpen(false);
    } catch (e: unknown) {
      toast({ title: 'Failed to publish', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Subscriber selection ────────────────────────────────────────────────────
  const allSubIds = subscribers.map(s => s.id);
  const allSelected = allSubIds.length > 0 && allSubIds.every(id => selectedSubs.has(id));
  const someSelected = selectedSubs.size > 0;

  const toggleSub = (id: string) => {
    setSelectedSubs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelectedSubs(allSelected ? new Set() : new Set(allSubIds));
  };

  const handleBulkDelete = async () => {
    try {
      await apiDeleteSubscribersBulk([...selectedSubs]);
      setSubs(prev => prev.filter(s => !selectedSubs.has(s.id)));
      setSelectedSubs(new Set());
      toast({ title: `${selectedSubs.size} subscriber(s) removed` });
    } catch {
      toast({ title: 'Failed to delete subscribers', variant: 'destructive' });
    }
    setBulkDeleteOpen(false);
  };

  const handleMessageSelected = () => {
    const emails = subscribers.filter(s => selectedSubs.has(s.id)).map(s => s.email);
    setSendToMode('specific');
    setMsgRecipients(emails);
    setActiveTab('messages');
  };

  // ── Delete single subscriber ────────────────────────────────────────────────
  const handleDeleteSingle = async (id: string, email: string) => {
    try {
      await apiDeleteSubscriber(id);
      setSubs(prev => prev.filter(s => s.id !== id));
      setSelectedSubs(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast({ title: 'Subscriber removed', description: email });
    } catch {
      toast({ title: 'Failed to remove subscriber', variant: 'destructive' });
    }
  };

  // ── Message send ────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!msgSubject.trim()) { toast({ title: 'Subject is required', variant: 'destructive' }); return; }
    const hasContent = msgBlocks.some(b => b.content.trim());
    if (!hasContent) { toast({ title: 'Message body is empty', variant: 'destructive' }); return; }
    if (sendToMode === 'specific' && msgRecipients.length === 0) {
      toast({ title: 'Add at least one recipient', variant: 'destructive' }); return;
    }

    setSending(true);
    try {
      const htmlBody = blocksToHtml(msgBlocks, msgSubject.trim());
      const recipients = sendToMode === 'specific' ? msgRecipients : [];
      await apiSendNewsletter(msgSubject.trim(), htmlBody, recipients);
      toast({
        title: 'Message sent!',
        description: sendToMode === 'all'
          ? `Delivered to all ${subscribers.length} subscribers`
          : `Delivered to ${msgRecipients.length} subscriber(s)`,
      });
      // Reset compose
      setMsgSubject('');
      setMsgBlocks([{ id: crypto.randomUUID(), type: 'text', content: '' }]);
      setMsgRecipients([]);
      setSendToMode('all');
      fetchLogs();
    } catch {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setMobileMenuOpen(false); }}>

        {/* ── Mobile dropdown nav (visible on small screens only) ── */}
        <div className="relative mb-6 sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              {activeTab === 'blogs' && <><FileText className="h-4 w-4 text-primary" /> Blogs {blogs.length > 0 && <span className="text-xs bg-primary/20 text-primary rounded-full px-1.5">{blogs.length}</span>}</>}
              {activeTab === 'subscribers' && <><Users className="h-4 w-4 text-primary" /> Subscribers {subscribers.length > 0 && <span className="text-xs bg-primary/20 text-primary rounded-full px-1.5">{subscribers.length}</span>}</>}
              {activeTab === 'messages' && <><MessageSquare className="h-4 w-4 text-primary" /> Messages</>}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
              {[{value:'blogs', icon:<FileText className="h-4 w-4" />, label:'Blogs', badge: blogs.length > 0 ? blogs.length : null},
                {value:'subscribers', icon:<Users className="h-4 w-4" />, label:'Subscribers', badge: subscribers.length > 0 ? subscribers.length : null},
                {value:'messages', icon:<MessageSquare className="h-4 w-4" />, label:'Messages', badge: null},
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => { setActiveTab(item.value); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-secondary transition-colors ${
                    activeTab === item.value ? 'text-primary font-semibold bg-primary/10' : 'text-foreground'
                  }`}
                >
                  <span className={activeTab === item.value ? 'text-primary' : 'text-muted-foreground'}>{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="ml-auto text-xs bg-primary/20 text-primary rounded-full px-1.5">{item.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop tabs (visible on sm+ only) ── */}
        <TabsList className="hidden sm:flex bg-secondary mb-6 w-full">
          <TabsTrigger value="blogs" className="gap-1 flex-1">
            <FileText className="h-4 w-4" /> Blogs
            {blogs.length > 0 && <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5">{blogs.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1 flex-1">
            <Users className="h-4 w-4" /> Subscribers
            {subscribers.length > 0 && <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5">{subscribers.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1 flex-1">
            <MessageSquare className="h-4 w-4" /> Messages
          </TabsTrigger>
        </TabsList>

        {/* ── BLOGS TAB ── */}
        <TabsContent value="blogs">
          <Card className="bg-card border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {editingId ? 'Edit Blog' : 'Create New Blog'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Blog title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-secondary border-border text-lg font-medium"
              />
              <BlockEditor blocks={blocks} onChange={setBlocks} />
              {/* Notify toggle — only shown for new posts */}
              {!editingId && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Notify subscribers?</span>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="notifySubscribers"
                        checked={notifySubscribers === true}
                        onChange={() => setNotifySubscribers(true)}
                        className="accent-primary"
                      />
                      <span>Yes, notify</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="notifySubscribers"
                        checked={notifySubscribers === false}
                        onChange={() => setNotifySubscribers(false)}
                        className="accent-primary"
                      />
                      <span>Don't notify</span>
                    </label>
                  </div>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSaveBlog} disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Blog' : 'Publish Blog'}
                </Button>
                {!editingId && (
                  <Button variant="outline" onClick={openPreview} disabled={saving} className="gap-1.5 border-border">
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                )}
                {editingId && <Button variant="ghost" onClick={resetEditor}>Cancel</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader><CardTitle className="text-lg">Blog History</CardTitle></CardHeader>
            <CardContent>
              {loadingBlogs ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : blogs.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No blogs yet — create your first one above!</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead className="hidden sm:table-cell">Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogs.map(blog => {
                        const d = new Date(blog.createdAt);
                        return (
                          <TableRow key={blog.id}>
                            <TableCell className="font-medium">{blog.title}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{d.toLocaleDateString()}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(blog)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Blog</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Delete <span className="font-medium text-foreground">"{blog.title}"</span>? This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDelete(blog.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUBSCRIBERS TAB ── */}
        <TabsContent value="subscribers">
          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
              <span className="text-sm font-medium text-primary">{selectedSubs.size} selected</span>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <Button size="sm" variant="outline" className="gap-1.5 border-border"
                  onClick={handleMessageSelected}>
                  <Mail className="h-3.5 w-3.5" /> Message
                </Button>
                <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedSubs.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {selectedSubs.size} Subscriber(s)</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove {selectedSubs.size} subscriber(s). This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleBulkDelete}>Remove All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button size="sm" variant="ghost" onClick={() => setSelectedSubs(new Set())}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Verified Subscribers</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={subSearch}
                    onChange={e => setSubSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-secondary border border-border/60 outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground"
                  />
                  {subSearch && (
                    <button onClick={() => setSubSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : subscribers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No verified subscribers yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <button onClick={toggleAll} className="flex items-center justify-center">
                            {allSelected
                              ? <CheckSquare className="h-4 w-4 text-primary" />
                              : someSelected
                                ? <CheckSquare className="h-4 w-4 text-primary/50" />
                                : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Subscribed On</TableHead>
                        <TableHead className="hidden sm:table-cell">Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.filter(s => s.email.toLowerCase().includes(subSearch.toLowerCase())).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">
                            No subscribers match "{subSearch}"
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {subscribers.filter(s => s.email.toLowerCase().includes(subSearch.toLowerCase())).map(sub => {
                        const d = new Date(sub.subscribedAt);
                        const isChecked = selectedSubs.has(sub.id);
                        return (
                          <TableRow key={sub.id} className={isChecked ? 'bg-primary/5' : ''}>
                            <TableCell>
                              <button onClick={() => toggleSub(sub.id)} className="flex items-center justify-center">
                                {isChecked
                                  ? <CheckSquare className="h-4 w-4 text-primary" />
                                  : <Square className="h-4 w-4 text-muted-foreground" />}
                              </button>
                            </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm break-all">{sub.email}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{d.toLocaleDateString()}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" title="Send message"
                                onClick={() => {
                                  setSendToMode('specific');
                                  setMsgRecipients([sub.email]);
                                  setActiveTab('messages');
                                }}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Subscriber</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Remove <span className="font-medium text-foreground">{sub.email}</span>? This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDeleteSingle(sub.id, sub.email)}>Remove</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MESSAGES TAB ── */}
        <TabsContent value="messages">
          {/* Compose card */}
          <Card className="bg-card border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Send to mode */}
              <Select value={sendToMode} onValueChange={v => { setSendToMode(v as 'all' | 'specific'); setMsgRecipients([]); }}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Send to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscribers ({subscribers.length})</SelectItem>
                  <SelectItem value="specific">Specific Subscribers</SelectItem>
                </SelectContent>
              </Select>

              {/* Multi-select tag picker */}
              {sendToMode === 'specific' && (
                <SubscriberTagPicker
                  subscribers={subscribers}
                  selected={msgRecipients}
                  onChange={setMsgRecipients}
                />
              )}

              {/* Subject */}
              <Input
                placeholder="Email subject..."
                value={msgSubject}
                onChange={e => setMsgSubject(e.target.value)}
                className="bg-secondary border-border"
              />

              {/* Rich block editor */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Message body</p>
                <BlockEditor blocks={msgBlocks} onChange={setMsgBlocks} />
              </div>

              <Button onClick={handleSendMessage} disabled={sending} className="bg-primary hover:bg-primary/90">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Message history */}
          <Card className="bg-card border-border/50">
            <CardHeader><CardTitle className="text-lg">Sent Messages</CardTitle></CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : messageLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No messages sent yet.</p>
              ) : (
                <div className="space-y-3">
                  {messageLogs.map(log => {
                    const d = new Date(log.sentAt);
                    const recipientList = log.recipients ? log.recipients.split(',') : [];
                    return (
                      <div key={log.id} className="border border-border/50 rounded-lg p-4 bg-secondary/30">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <p className="font-medium text-sm leading-tight">{log.subject}</p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {d.toLocaleDateString()} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {log.recipientCount} recipient{log.recipientCount !== 1 ? 's' : ''}
                          </span>
                          {recipientList.length > 0 && recipientList.length <= 3 && (
                            <span>{recipientList.join(', ')}</span>
                          )}
                          {recipientList.length > 3 && (
                            <span>{recipientList.slice(0, 3).join(', ')} +{recipientList.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── BLOG PREVIEW OVERLAY ──────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">

          {/* Floating action bar — top right */}
          <div className="fixed top-3 right-3 z-[60] flex items-center gap-1.5 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/60 bg-background/90 backdrop-blur-sm"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-4 w-4" /> <span className="sm:inline hidden">Close</span> Preview
            </Button>

            <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1.5">
                  <Send className="h-4 w-4" /> Publish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Ready to publish?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will make{' '}
                    <span className="font-medium text-foreground">"{title || 'this post'}"</span>{' '}
                    live on your site.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Notify toggle inside confirm dialog */}
                <div className="flex items-center gap-5 py-1">
                  <span className="text-sm font-medium text-muted-foreground">Notify subscribers?</span>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="previewNotify"
                      checked={previewNotify === true}
                      onChange={() => setPreviewNotify(true)}
                      className="accent-primary"
                    />
                    Yes, notify
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="previewNotify"
                      checked={previewNotify === false}
                      onChange={() => setPreviewNotify(false)}
                      className="accent-primary"
                    />
                    Don't notify
                  </label>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Go back</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-primary hover:bg-primary/90"
                    onClick={handlePublishFromPreview}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Yes, Publish!
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Preview content — mirrors BlogDetail layout */}
          <div className="container mx-auto max-w-3xl px-4 py-16">
            <div className="flex items-center gap-3 mb-8">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1"
                onClick={() => setShowPreview(false)}
              >
                ← Back to Editor
              </Button>
              <span className="text-xs bg-primary/20 text-primary rounded-full px-3 py-1 font-medium tracking-wide">
                Preview
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              {title || <span className="text-muted-foreground italic font-normal">Untitled post</span>}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {blocks.length === 0 ? (
              <p className="text-muted-foreground italic">No content blocks yet.</p>
            ) : (
              <div className="space-y-8">
                {blocks.map(block => (
                  <BlockPreviewRenderer key={block.id} block={block} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
