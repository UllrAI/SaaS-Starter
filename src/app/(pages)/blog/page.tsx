import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";
import { Sparkles, BookOpen } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import type { Metadata } from "next";
import { renderMarkdoc } from "@/lib/utils";

export const metadata: Metadata = createMetadata({
  title: "Blog",
  description:
    "Read our latest blog posts and insights about technology, development, and industry trends.",
});

const reader = createReader(process.cwd(), keystaticConfig);

export default async function BlogPage() {
  const posts = await reader.collections.posts.all();

  // Sort posts by published date (newest first), then by title
  const sortedPosts = posts.sort((a, b) => {
    const dateA = a.entry.publishedDate
      ? new Date(a.entry.publishedDate)
      : new Date(0);
    const dateB = b.entry.publishedDate
      ? new Date(b.entry.publishedDate)
      : new Date(0);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime(); // Newest first
    }

    return a.entry.title.localeCompare(b.entry.title);
  });

  // Separate featured posts
  const featuredPosts = sortedPosts.filter((post) => post.entry.featured);
  const regularPosts = sortedPosts.filter((post) => !post.entry.featured);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-muted/40 relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <BackgroundPattern />

        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="border-border bg-background/50 mb-4 inline-flex items-center rounded-full border px-3 py-1 text-sm backdrop-blur-sm sm:mb-6">
              <Sparkles className="text-primary mr-2 h-3 w-3" />
              <span className="text-muted-foreground">
                Latest insights and updates
              </span>
            </div>
            <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:mb-6 sm:text-4xl lg:text-5xl xl:text-6xl">
              Our Blog
            </h1>
            <p className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed sm:text-xl">
              Discover insights, tutorials, and updates from our team. Stay
              informed about the latest trends in technology and development.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            {sortedPosts.length === 0 ? (
              <div className="py-16 text-center sm:py-20">
                <div className="bg-muted mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20">
                  <BookOpen className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <h2 className="text-foreground mb-4 text-xl font-semibold sm:text-2xl">
                  No posts yet
                </h2>
                <p className="text-muted-foreground mx-auto max-w-md text-sm sm:text-base">
                  We are working on some great content. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-12 sm:space-y-16">
                {/* Featured Posts */}
                {featuredPosts.length > 0 && (
                  <section>
                    <div className="mb-6 text-center sm:mb-8">
                      <h2 className="text-foreground mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        Featured Posts
                      </h2>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Our most popular and insightful articles
                      </p>
                    </div>
                    <div className="grid gap-6 sm:gap-8 lg:gap-12">
                      {await Promise.all(
                        featuredPosts.map(async (post) => {
                          const content = await post.entry.content();
                          const author = post.entry.author
                            ? await reader.collections.authors.read(
                                post.entry.author,
                              )
                            : null;
                          return (
                            <BlogPostCard
                              key={post.slug}
                              slug={post.slug}
                              title={post.entry.title}
                              excerpt={post.entry.excerpt || undefined}
                              heroImage={post.entry.heroImage || undefined}
                              publishedDate={
                                post.entry.publishedDate || undefined
                              }
                              featured={post.entry.featured}
                              variant="featured"
                              content={renderMarkdoc(content.node)}
                              author={author?.name || "Anonymous"}
                            />
                          );
                        }),
                      )}
                    </div>
                  </section>
                )}

                {/* Regular Posts */}
                {regularPosts.length > 0 && (
                  <section>
                    {featuredPosts.length > 0 && (
                      <div className="mb-6 text-center sm:mb-8">
                        <h2 className="text-foreground mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                          All Posts
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base">
                          Explore our complete collection of articles
                        </p>
                      </div>
                    )}
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8">
                      {await Promise.all(
                        regularPosts.map(async (post) => {
                          const content = await post.entry.content();
                          const author = post.entry.author
                            ? await reader.collections.authors.read(
                                post.entry.author,
                              )
                            : null;
                          return (
                            <BlogPostCard
                              key={post.slug}
                              slug={post.slug}
                              title={post.entry.title}
                              excerpt={post.entry.excerpt || undefined}
                              heroImage={post.entry.heroImage || undefined}
                              publishedDate={
                                post.entry.publishedDate || undefined
                              }
                              featured={post.entry.featured}
                              variant="regular"
                              content={renderMarkdoc(content.node)}
                              author={author?.name || "Anonymous"}
                            />
                          );
                        }),
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
