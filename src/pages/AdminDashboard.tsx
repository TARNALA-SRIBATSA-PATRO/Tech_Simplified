import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Send, FileText, Users, MessageSquare, UserMinus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { isAdminLoggedIn } from '@/lib/store';
import {
  apiGetBlogs, apiCreateBlog, apiUpdateBlog, apiDeleteBlog, ApiBlog,
  apiGetSubscribers, apiDeleteSubscriber, apiSendNewsletter, ApiSubscriber,
} from '@/lib/api';
import { ContentBlock } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

// ── Block Editor ──────────────────────────────────────────────────────────────

function BlockEditor({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (b: ContentBlock[]) => void }) {
  const addBlock = (type: ContentBlock['type']) => {
    onChange([...blocks, { id: crypto.randomUUID(), type, content: '' }]);
  };
  const updateBlock = (id: string, content: string) => {
    onChange(blocks.map(b => (b.id === id ? { ...b, content } : b)));
  };
  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };
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

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Data state
  const [blogs, setBlogs] = useState<ApiBlog[]>([]);
  const [subscribers, setSubs] = useState<ApiSubscriber[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [saving, setSaving] = useState(false);

  // Message state
  const [sendTo, setSendTo] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin');
    }
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
      // Show only verified subscribers
      setSubs(data.filter(s => s.verified));
    } catch {
      toast({ title: 'Failed to load subscribers', variant: 'destructive' });
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
    fetchSubs();
  }, [fetchBlogs, fetchSubs]);

  // ── Blog handlers ───────────────────────────────────────────────────────────
  const handleSaveBlog = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    if (blocks.length === 0) {
      toast({ title: 'Add at least one content block', variant: 'destructive' });
      return;
    }
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
    try {
      setBlocks(JSON.parse(blog.content));
    } catch {
      setBlocks([{ id: crypto.randomUUID(), type: 'text', content: blog.content }]);
    }
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

  const resetEditor = () => {
    setEditingId(null);
    setTitle('');
    setBlocks([]);
  };

  // ── Message handler ─────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!msgSubject.trim()) {
      toast({ title: 'Subject is required', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'Message is empty', variant: 'destructive' });
      return;
    }
    if (sendTo === 'one' && !selectedEmail) {
      toast({ title: 'Select a subscriber', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await apiSendNewsletter(msgSubject.trim(), message.trim());
      toast({ title: 'Message sent!', description: `Delivered to ${sendTo === 'all' ? 'all subscribers' : selectedEmail}` });
      setMessage('');
      setMsgSubject('');
    } catch {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Tabs defaultValue="blogs">
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
                {editingId && (
                  <Button variant="ghost" onClick={resetEditor}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Blog History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBlogs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
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
                                    Are you sure you want to delete <span className="font-medium text-foreground">"{blog.title}"</span>? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(blog.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
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
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Verified Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No verified subscribers yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscribed On</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map(sub => {
                      const d = new Date(sub.subscribedAt);
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.email}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          <TableCell className="text-right">
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
                                    Are you sure you want to remove <span className="font-medium text-foreground">{sub.email}</span>? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async () => {
                                      try {
                                        await apiDeleteSubscriber(sub.id);
                                        setSubs(prev => prev.filter(s => s.id !== sub.id));
                                        toast({ title: 'Subscriber removed', description: sub.email });
                                      } catch {
                                        toast({ title: 'Failed to remove subscriber', variant: 'destructive' });
                                      }
                                    }}
                                  >
                                    Remove
                                  </AlertDialogAction>
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
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Send Message to Subscribers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={sendTo} onValueChange={setSendTo}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Send to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscribers ({subscribers.length})</SelectItem>
                  <SelectItem value="one">One Subscriber</SelectItem>
                </SelectContent>
              </Select>

              {sendTo === 'one' && (
                <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select subscriber..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subscribers.length === 0 ? (
                      <SelectItem value="none" disabled>No subscribers yet</SelectItem>
                    ) : (
                      subscribers.map(s => (
                        <SelectItem key={s.id} value={s.email}>{s.email}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}

              <Input
                placeholder="Email subject..."
                value={msgSubject}
                onChange={e => setMsgSubject(e.target.value)}
                className="bg-secondary border-border"
              />

              <Textarea
                placeholder="Write your message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="bg-secondary border-border min-h-[120px]"
              />

              <Button onClick={handleSendMessage} disabled={sending} className="bg-primary hover:bg-primary/90">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
