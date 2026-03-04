import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Pencil, Send, FileText, Users, MessageSquare,
  UserMinus, Loader2, X, Search, CheckSquare, Square, Mail,
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
function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks.map(b => {
    if (b.type === 'text')
      return `<p style="font-size:15px;color:#cccccc;line-height:1.8;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;margin:0 0 16px;">${b.content}</p>`;
    if (b.type === 'image')
      return `<img src="${b.content}" alt="" style="max-width:100%;border-radius:8px;margin:0 0 16px;display:block;"/>`;
    if (b.type === 'video')
      return `<a href="${b.content}" style="color:#f97316;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${b.content}</a>`;
    return '';
  }).join('');
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ── Tab state (controlled so we can switch from Subscribers → Messages) ─────
  const [activeTab, setActiveTab] = useState('blogs');

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

  // ── Subscriber selection state ────────────────────────────────────────────
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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
        await apiCreateBlog(title.trim(), contentJson);
        toast({ title: 'Blog published! Subscribers notified.' });
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

  const resetEditor = () => { setEditingId(null); setTitle(''); setBlocks([]); };

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
      const htmlBody = blocksToHtml(msgBlocks);
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary mb-6">
          <TabsTrigger value="blogs" className="gap-1">
            <FileText className="h-4 w-4" /> Blogs
            {blogs.length > 0 && <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5">{blogs.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1">
            <Users className="h-4 w-4" /> Subscribers
            {subscribers.length > 0 && <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5">{subscribers.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1">
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
              <div className="flex gap-2">
                <Button onClick={handleSaveBlog} disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Blog' : 'Publish Blog'}
                </Button>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map(blog => {
                      const d = new Date(blog.createdAt);
                      return (
                        <TableRow key={blog.id}>
                          <TableCell className="font-medium">{blog.title}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUBSCRIBERS TAB ── */}
        <TabsContent value="subscribers">
          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
              <span className="text-sm font-medium text-primary">{selectedSubs.size} selected</span>
              <div className="flex items-center gap-2 ml-auto">
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
            <CardHeader><CardTitle className="text-lg">Verified Subscribers</CardTitle></CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : subscribers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No verified subscribers yet.</p>
              ) : (
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
                      <TableHead>Subscribed On</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map(sub => {
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
                          <TableCell className="font-medium">{sub.email}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          <TableCell className="text-right space-x-1">
                            {/* Quick message for this subscriber */}
                            <Button variant="ghost" size="icon" title="Send message"
                              onClick={() => {
                                setSendToMode('specific');
                                setMsgRecipients([sub.email]);
                                setActiveTab('messages');
                              }}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            {/* Delete single */}
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
    </div>
  );
}
