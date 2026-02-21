import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { ApiBlog } from '@/lib/api';
import { ContentBlock } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function getPreview(contentJson: string): string {
  try {
    const blocks: ContentBlock[] = JSON.parse(contentJson);
    const textBlock = blocks.find(b => b.type === 'text');
    if (!textBlock) return 'No preview available.';
    return textBlock.content.length > 120
      ? textBlock.content.slice(0, 120) + '...'
      : textBlock.content;
  } catch {
    return contentJson.slice(0, 120) + '...';
  }
}

export function BlogCard({ blog, index }: { blog: ApiBlog; index: number }) {
  const date = new Date(blog.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="group h-full border-border/50 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
            {blog.title}
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{getPreview(blog.content)}</p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
            <Link to={`/blog/${blog.id}`}>Read More →</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
