import { motion } from 'framer-motion';
import { getBlogs } from '@/lib/store';
import { BlogCard } from '@/components/BlogCard';
import { NewsletterSection } from '@/components/NewsletterSection';

const Index = () => {
  const blogs = getBlogs().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
        >
          Welcome to <span className="text-gradient">Tech Simplified</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-xl mx-auto"
        >
          Tech insights, tutorials, and stories — delivered fresh.
        </motion.p>
      </section>

      {/* Blog Grid */}
      <section className="container mx-auto px-4 pb-16">
        {blogs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No blog posts yet.</p>
            <p className="text-sm mt-1">Head to the admin dashboard to create your first post!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog, i) => (
              <BlogCard key={blog.id} blog={blog} index={i} />
            ))}
          </div>
        )}
      </section>

      <NewsletterSection />
    </div>
  );
};

export default Index;
