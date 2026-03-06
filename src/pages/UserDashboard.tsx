import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Bell, HelpCircle, Loader2, Pencil, Trash2, Eye, ThumbsUp,
  MessageSquare, X, ChevronDown, CheckCircle2, Clock, XCircle, Send, Trash,
  Info, AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserAuth } from '@/lib/UserAuthContext';
import {
  apiGetMyBlogs, apiDeleteMyBlog, apiGetBlogStats,
  apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead,
  apiDeleteNotification, apiDeleteAllNotifications,
  apiSendHelp, ApiUserBlogRequest, ApiNotification,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ContentBlock } from '@/lib/types';

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const configs = {
    PENDING: { icon: <Clock className="h-3 w-3" />, label: 'Pending Review', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    APPROVED: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Published', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    REJECTED: { icon: <XCircle className="h-3 w-3" />, label: 'Not Approved', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const c = configs[status as keyof typeof configs] || configs.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ── Notification Item ─────────────────────────────────────────────────────────
function NotificationItem({
  notif, onRead, onDelete,
}: { notif: ApiNotification; onRead: (id: string) => void; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [deleted, setDeleted] = useState(false);

  const handleClick = () => {
    if (!notif.read) onRead(notif.id);
    if (notif.relatedBlogId) navigate(`/blog/${notif.relatedBlogId}`);
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const handleTouchStart = (e: React.TouchEvent) => setStartX(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    const dx = e.touches[0].clientX - startX;
    if (dx < 0) setSwipeX(Math.max(dx, -120));
  };
  const handleTouchEnd = () => {
    if (swipeX < -80) {
      setDeleted(true);
      setTimeout(() => onDelete(notif.id), 300);
    } else {
      setSwipeX(0);
    }
    setStartX(null);
  };

  if (deleted) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
        notif.read ? 'border-border/30 bg-card/50' : 'border-primary/20 bg-primary/5'
      }`}
      style={{ transform: `translateX(${swipeX}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 flex gap-3 items-start cursor-pointer" onClick={handleClick}>
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.read ? 'bg-transparent' : 'bg-primary'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
            {notif.message}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
          className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 p-0.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main UserDashboard ────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, isLoading } = useUserAuth();

  const [activeTab, setActiveTab] = useState('blogs');
  const [myBlogs, setMyBlogs] = useState<ApiUserBlogRequest[]>([]);
  const [blogStats, setBlogStats] = useState<Record<string, { likeCount: number; viewCount: number }>>({});
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const [helpMsg, setHelpMsg] = useState('');
  const [sendingHelp, setSendingHelp] = useState(false);
  const [showNameInfo, setShowNameInfo] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isLoggedIn) navigate('/login');
  }, [isLoading, isLoggedIn, navigate]);

  // ── Fetch my blogs ──────────────────────────────────────────────────────────
  const fetchMyBlogs = useCallback(async () => {
    setLoadingBlogs(true);
    try {
      const data = await apiGetMyBlogs();
      setMyBlogs(data);
      // Fetch stats for approved/published blogs
      const statsMap: Record<string, { likeCount: number; viewCount: number }> = {};
      await Promise.all(
        data.filter(b => b.publishedBlogId).map(async b => {
          try {
            const s = await apiGetBlogStats(b.publishedBlogId!);
            statsMap[b.id] = { likeCount: s.likeCount, viewCount: s.viewCount };
          } catch {}
        })
      );
      setBlogStats(statsMap);
    } catch {
      toast({ title: 'Failed to load blogs', variant: 'destructive' });
    } finally {
      setLoadingBlogs(false);
    }
  }, []);

  // ── Fetch notifications ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const data = await apiGetNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {} finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) { fetchMyBlogs(); fetchNotifications(); }
  }, [isLoggedIn, fetchMyBlogs, fetchNotifications]);

  // ── Delete blog ─────────────────────────────────────────────────────────────
  const handleDeleteBlog = async (id: string) => {
    try {
      await apiDeleteMyBlog(id);
      setMyBlogs(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Blog submission removed' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
    setDeleteConfirm(null);
  };

  // ── Notifications ───────────────────────────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleDeleteNotif = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    try {
      await apiDeleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleDeleteAll = async () => {
    try {
      await apiDeleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
    setDeleteAllOpen(false);
  };

  // ── Help ────────────────────────────────────────────────────────────────────
  const handleSendHelp = async () => {
    if (!helpMsg.trim()) { toast({ title: 'Please enter a message', variant: 'destructive' }); return; }
    setSendingHelp(true);
    try {
      await apiSendHelp(helpMsg.trim());
      toast({ title: 'Message sent!', description: 'Our team will get back to you soon.' });
      setHelpMsg('');
    } catch {
      toast({ title: 'Failed to send', variant: 'destructive' });
    } finally {
      setSendingHelp(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {user?.profilePhotoBase64 ? (
          <img src={user.profilePhotoBase64} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/30">
            {user?.displayName?.slice(0, 2).toUpperCase() || '?'}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{user?.displayName}</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link to="/write-blog">+ Write Blog</Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary mb-6 w-full">
          <TabsTrigger value="blogs" className="flex-1 gap-1.5">
            <FileText className="h-4 w-4" />My Blogs
            {myBlogs.length > 0 && <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5">{myBlogs.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 gap-1.5">
            <Bell className="h-4 w-4" />Notifications
            {unreadCount > 0 && <span className="ml-1 text-xs bg-primary rounded-full px-1.5 text-white">{unreadCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="help" className="flex-1 gap-1.5">
            <HelpCircle className="h-4 w-4" />Help
          </TabsTrigger>
        </TabsList>

        {/* ── MY BLOGS TAB ── */}
        <TabsContent value="blogs">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">My Blog Submissions</CardTitle>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                  <Link to="/write-blog">+ Write New</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBlogs ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : myBlogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No blogs submitted yet.</p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/write-blog">Write Your First Blog</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBlogs.map(blog => {
                    const stats = blogStats[blog.id];
                    return (
                      <div key={blog.id}
                        className="border border-border/50 rounded-xl p-4 hover:border-border transition-colors">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <StatusBadge status={blog.status} />
                              {blog.publishedBlogId && (
                                <Link to={`/blog/${blog.publishedBlogId}`}
                                  className="text-xs text-primary hover:underline">
                                  View post →
                                </Link>
                              )}
                            </div>
                            <h3 className="font-semibold text-sm sm:text-base truncate">{blog.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span>Submitted {new Date(blog.submittedAt).toLocaleDateString()}</span>
                              {blog.reviewedAt && <span>Reviewed {new Date(blog.reviewedAt).toLocaleDateString()}</span>}
                              {stats && (
                                <>
                                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{stats.viewCount}</span>
                                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{stats.likeCount}</span>
                                </>
                              )}
                              {blog.commentCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />{blog.commentCount} comments
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Actions — only for PENDING */}
                          {blog.status === 'PENDING' && (
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/write-blog?edit=${blog.id}`}><Pencil className="h-4 w-4" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive"
                                onClick={() => setDeleteConfirm(blog.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* ── NOTIFICATIONS TAB ── */}
        <TabsContent value="notifications">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({unreadCount} unread)
                    </span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button size="sm" variant="outline" className="border-border text-xs"
                      onClick={async () => {
                        await apiMarkAllNotificationsRead();
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        setUnreadCount(0);
                      }}>
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button size="sm" variant="ghost" className="text-destructive text-xs gap-1"
                      onClick={() => setDeleteAllOpen(true)}>
                      <Trash className="h-3.5 w-3.5" />Delete All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingNotifs ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    Tip: Swipe left on a notification to delete it.
                  </p>
                  {notifications.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onRead={handleMarkRead}
                      onDelete={handleDeleteNotif}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HELP TAB ── */}
        <TabsContent value="help">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Help & Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Your name</label>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowNameInfo(true)}
                      onMouseLeave={() => setShowNameInfo(false)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    {showNameInfo && (
                      <div className="absolute left-5 top-0 z-50 w-64 bg-card border border-border rounded-lg p-3 shadow-xl text-xs text-muted-foreground leading-relaxed">
                        This will allow the team to recognize that this message is from you, which will help us resolve the problem as soon as possible.
                      </div>
                    )}
                  </div>
                </div>
                <Input
                  value={user?.displayName || ''}
                  disabled
                  className="bg-secondary/50 border-border text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  value={helpMsg}
                  onChange={e => setHelpMsg(e.target.value)}
                  placeholder="Describe your issue or feedback in detail..."
                  className="min-h-[140px] bg-secondary border-border"
                />
              </div>
              <Button
                onClick={handleSendHelp}
                disabled={sendingHelp || !helpMsg.trim()}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                {sendingHelp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete blog confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete submission?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove your blog submission.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDeleteBlog(deleteConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all notifications confirmation */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />Delete All Notifications?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your notifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAll}>
              Yes, Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
