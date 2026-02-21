import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Plus, Trash2, Pencil, Send, FileText, Users, MessageSquare, UserMinus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isAdminLoggedIn, adminLogout, getBlogs, saveBlog, deleteBlog, getSubscribers, deleteSubscriber } from '@/lib/store';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Blog, ContentBlock, Subscriber } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

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
                placeholder="Write your text..."
                className="bg-background border-border min-h-[80px]"
              />
            ) : (
              <Input
                value={block.content}
                onChange={e => updateBlock(block.id, e.target.value)}
                placeholder={block.type === 'image' ? 'Image URL...' : 'YouTube URL...'}
                className="bg-background border-border"
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [subscribers, setSubs] = useState<Subscriber[]>([]);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Message state
  const [sendTo, setSendTo] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin');
      return;
    }
    refresh();
  }, [navigate]);

  const refresh = () => {
    setBlogs(getBlogs().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setSubs(getSubscribers().filter(s => s.is_verified));
  };

  const handleSaveBlog = () => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    if (blocks.length === 0) {
      toast({ title: 'Add at least one content block', variant: 'destructive' });
      return;
    }
    const now = new Date().toISOString();
    const blog: Blog = {
      id: editingId || crypto.randomUUID(),
      title: title.trim(),
      content: blocks,
      created_at: editingId ? (getBlogs().find(b => b.id === editingId)?.created_at || now) : now,
      updated_at: now,
    };
    saveBlog(blog);
    resetEditor();
    refresh();
    toast({ title: editingId ? 'Blog updated!' : 'Blog created!' });
  };

  const handleEdit = (blog: Blog) => {
    setEditingId(blog.id);
    setTitle(blog.title);
    setBlocks([...blog.content]);
  };

  const handleDelete = (id: string) => {
    deleteBlog(id);
    refresh();
    toast({ title: 'Blog deleted' });
  };

  const resetEditor = () => {
    setEditingId(null);
    setTitle('');
    setBlocks([]);
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({ title: 'Message is empty', variant: 'destructive' });
      return;
    }
    if (sendTo === 'one' && !selectedEmail) {
      toast({ title: 'Select a subscriber', variant: 'destructive' });
      return;
    }
    const target = sendTo === 'all' ? 'all subscribers' : selectedEmail;
    toast({ title: 'Message sent!', description: `Sent to ${target} (demo — enable Cloud for real emails)` });
    setMessage('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold"
        >
          Admin Dashboard
        </motion.h1>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => { adminLogout(); navigate('/admin'); }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="blogs">
        <TabsList className="bg-secondary mb-6">
          <TabsTrigger value="blogs" className="gap-1"><FileText className="h-4 w-4" /> Blogs</TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1"><Users className="h-4 w-4" /> Subscribers</TabsTrigger>
          <TabsTrigger value="messages" className="gap-1"><MessageSquare className="h-4 w-4" /> Messages</TabsTrigger>
        </TabsList>

        {/* BLOGS TAB */}
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
                <Button onClick={handleSaveBlog} className="bg-primary hover:bg-primary/90">
                  {editingId ? 'Update Blog' : 'Publish Blog'}
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
              {blogs.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No blogs yet.</p>
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
                      const d = new Date(blog.created_at);
                      return (
                        <TableRow key={blog.id}>
                          <TableCell className="font-medium">{blog.title}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(blog)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(blog.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* SUBSCRIBERS TAB */}
        <TabsContent value="subscribers">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Verified Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              {subscribers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No subscribers yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map(sub => {
                      const d = new Date(sub.subscribed_at);
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
                                    Are you sure you want to remove <span className="font-medium text-foreground">{sub.email}</span>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => {
                                      deleteSubscriber(sub.id);
                                      refresh();
                                      toast({ title: 'Subscriber removed', description: sub.email });
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

        {/* MESSAGES TAB */}
        <TabsContent value="messages">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Send Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={sendTo} onValueChange={setSendTo}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Send to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscribers</SelectItem>
                  <SelectItem value="one">One Subscriber</SelectItem>
                </SelectContent>
              </Select>

              {sendTo === 'one' && (
                <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select subscriber..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subscribers.map(s => (
                      <SelectItem key={s.id} value={s.email}>{s.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Textarea
                placeholder="Write your message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="bg-secondary border-border min-h-[120px]"
              />

              <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
