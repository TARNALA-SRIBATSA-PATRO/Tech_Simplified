import { useState, useEffect } from 'react';
import { MessageSquare, Heart, Reply, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUserAuth } from '@/lib/UserAuthContext';
import {
  apiGetComments, apiAddComment, apiAddReply,
  apiDeleteComment, apiToggleCommentLike, ApiComment,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: ApiComment;
  blogId: string;
  currentUserId: string | null;
  onDeleted: (id: string) => void;
  onLikeToggled: (id: string, liked: boolean, likeCount: number) => void;
  onReplyAdded: (parentId: string, reply: ApiComment) => void;
  depth?: number;
}

function CommentItem({
  comment, blogId, currentUserId, onDeleted, onLikeToggled, onReplyAdded, depth = 0,
}: CommentItemProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [liking, setLiking] = useState(false);

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const handleLike = async () => {
    if (!currentUserId) {
      toast({ title: 'Sign in to like comments', variant: 'destructive' });
      return;
    }
    setLiking(true);
    try {
      const res = await apiToggleCommentLike(blogId, comment.id);
      onLikeToggled(comment.id, res.liked, res.likeCount);
    } catch {
      toast({ title: 'Failed to like', variant: 'destructive' });
    } finally {
      setLiking(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setReplying(true);
    try {
      const reply = await apiAddReply(blogId, comment.id, replyContent.trim());
      onReplyAdded(comment.id, reply);
      setReplyContent('');
      setShowReplyBox(false);
      setShowReplies(true);
    } catch {
      toast({ title: 'Failed to post reply', variant: 'destructive' });
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiDeleteComment(blogId, comment.id);
      onDeleted(comment.id);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 sm:ml-10 border-l-2 border-border/40 pl-4' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {comment.authorPhoto ? (
            <img src={comment.authorPhoto} alt=""
              className="w-8 h-8 rounded-full object-cover border border-border/50" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {initials(comment.authorName || 'U')}
            </div>
          )}
        </div>

        {/* Comment body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all
                hover:bg-primary/10 ${comment.likedByMe ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${comment.likedByMe ? 'fill-current' : ''}`} />
              {comment.likeCount > 0 && comment.likeCount}
            </button>

            {depth < 2 && (
              <button
                onClick={() => setShowReplyBox(v => !v)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium
                  text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}

            {currentUserId === comment.subscriberId && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium
                  text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Reply box */}
          {showReplyBox && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[70px] bg-secondary border-border text-sm resize-none"
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={handleReply} disabled={replying || !replyContent.trim()}
                  className="bg-primary hover:bg-primary/90 px-3">
                  {replying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reply'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReplyBox(false)}
                  className="text-muted-foreground px-3">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(v => !v)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium mb-2"
              >
                {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
              {showReplies && (
                <div className="space-y-4">
                  {comment.replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      blogId={blogId}
                      currentUserId={currentUserId}
                      onDeleted={onDeleted}
                      onLikeToggled={onLikeToggled}
                      onReplyAdded={onReplyAdded}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CommentSection ───────────────────────────────────────────────────────
interface CommentSectionProps { blogId: string; }

export default function CommentSection({ blogId }: CommentSectionProps) {
  const { user, isLoggedIn } = useUserAuth();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    apiGetComments(blogId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [blogId]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const comment = await apiAddComment(blogId, newComment.trim());
      // Add author info from current user
      const enriched: ApiComment = {
        ...comment,
        authorName: user!.displayName,
        authorPhoto: user!.profilePhotoBase64,
        likedByMe: false,
        replies: [],
      };
      setComments(prev => [enriched, ...prev]);
      setNewComment('');
    } catch {
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const handleDeleted = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id).map(c => ({
      ...c,
      replies: c.replies?.filter(r => r.id !== id) ?? [],
    })));
  };

  const handleLikeToggled = (id: string, liked: boolean, likeCount: number) => {
    const updateList = (list: ApiComment[]): ApiComment[] =>
      list.map(c => c.id === id
        ? { ...c, likedByMe: liked, likeCount }
        : { ...c, replies: updateList(c.replies ?? []) }
      );
    setComments(prev => updateList(prev));
  };

  const handleReplyAdded = (parentId: string, reply: ApiComment) => {
    const enriched: ApiComment = {
      ...reply,
      authorName: user!.displayName,
      authorPhoto: user!.profilePhotoBase64,
      likedByMe: false,
      replies: [],
    };
    setComments(prev => prev.map(c =>
      c.id === parentId
        ? { ...c, replies: [...(c.replies ?? []), enriched] }
        : c
    ));
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section className="mt-12 border-t border-border/50 pt-10">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        Comments {totalCount > 0 && <span className="text-muted-foreground font-normal text-base">({totalCount})</span>}
      </h3>

      {/* Comment input */}
      {isLoggedIn ? (
        <div className="flex gap-3 mb-8">
          <div className="shrink-0">
            {user?.profilePhotoBase64 ? (
              <img src={user.profilePhotoBase64} alt=""
                className="w-9 h-9 rounded-full object-cover border border-border/50" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user?.displayName?.slice(0, 2).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px] bg-secondary border-border resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handlePost}
                disabled={posting || !newComment.trim()}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Post Comment'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-secondary/50 border border-border/50 rounded-xl p-5 text-center mb-8">
          <p className="text-muted-foreground text-sm mb-3">Sign in to join the discussion</p>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No comments yet — be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              blogId={blogId}
              currentUserId={user?.id ?? null}
              onDeleted={handleDeleted}
              onLikeToggled={handleLikeToggled}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </section>
  );
}
