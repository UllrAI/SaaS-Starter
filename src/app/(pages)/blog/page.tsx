import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { Sparkles, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import {
  ReadingContainer,
  SectionContainer,
} from "@/components/layout/page-container";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { calculateReadingTime } from "@/lib/utils";
import {
  getAllPosts,
  getAuthorBySlug,
  getLocalizedBlogPostPath,
} from "@/lib/content/blog";
export async function buildBlogMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/blog", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("blog_title", "Blog"),
    description: t(
      "blog_read_implementation_notes_tutorials_insights_about",
      "Read implementation notes, tutorials, and insights about shipping agent-friendly SaaS products with strong auth, APIs, CLI tooling, and testing.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("blog_title", "Blog"),
      description: t(
        "blog_read_implementation_notes_tutorials_insights_about",
        "Read implementation notes, tutorials, and insights about shipping agent-friendly SaaS products with strong auth, APIs, CLI tooling, and testing.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("blog_title", "Blog"),
      description: t(
        "blog_read_implementation_notes_tutorials_insights_about",
        "Read implementation notes, tutorials, and insights about shipping agent-friendly SaaS products with strong auth, APIs, CLI tooling, and testing.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildBlogMetadata(SOURCE_LOCALE);
}
export function BlogPageContent({ locale }: { locale: SupportedLocale }) {
  const { t } = getStaticTranslations(locale);
  const sortedPosts = getAllPosts(locale);
  const featuredPosts = sortedPosts.filter((post) => post.featured);
  const regularPosts = sortedPosts.filter((post) => !post.featured);
  const renderPostCard = (
    post: (typeof sortedPosts)[number],
    variant: "featured" | "regular",
  ) => {
    const author = getAuthorBySlug(post.author);
    return (
      <BlogPostCard
        key={post.slug}
        slug={post.slug}
        href={getLocalizedBlogPostPath(post.slug, locale)}
        title={post.title}
        excerpt={post.excerpt || undefined}
        heroImage={post.heroImage || undefined}
        publishedDate={post.publishedDate || undefined}
        featured={post.featured}
        variant={variant}
        author={author?.name}
        readingMinutes={calculateReadingTime(post.content)}
        locale={locale}
      />
    );
  };
  const featuredPostCards = featuredPosts.map((post) =>
    renderPostCard(post, "featured"),
  );
  const regularPostCards = regularPosts.map((post) =>
    renderPostCard(post, "regular"),
  );
  return (
    <>
      {/* Hero Section */}
      <section className="bg-muted/40 relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <BackgroundPattern />

        <ReadingContainer>
          <div className="text-center">
            <Badge className="border-border bg-background/50 mb-4 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm sm:mb-6">
              <Sparkles className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("blog_index", "BLOG_INDEX")}
              </span>
            </Badge>
            <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:mb-6 sm:text-4xl lg:text-5xl xl:text-6xl">
              {t("blog_title_page", "Our Blog")}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed sm:text-xl">
              {t(
                "blog_discover_implementation_notes_tutorials_release_updates",
                "Discover implementation notes, tutorials, and release updates on how we build, test, and market an agent-friendly SaaS starter in practice.",
              )}
            </p>
          </div>
        </ReadingContainer>
      </section>

      {/* Blog Content */}
      <section className="bg-background py-12 sm:py-16">
        <SectionContainer>
          {sortedPosts.length === 0 ? (
            <div className="py-16 text-center sm:py-20">
              <div className="bg-muted mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20">
                <BookOpen className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h2 className="text-foreground mb-4 text-xl font-semibold sm:text-2xl">
                {t("blog_no_posts_yet", "No posts yet")}
              </h2>
              <p className="text-muted-foreground mx-auto max-w-md text-sm sm:text-base">
                {t(
                  "blog_we_working_some_great_content_check",
                  "We are working on some great content. Check back soon!",
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {/* Featured Posts */}
              {featuredPosts.length > 0 && (
                <section>
                  <div className="mb-6 text-center sm:mb-8">
                    <h2 className="text-foreground mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                      {t("blog_featured_posts", "Featured Posts")}
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {t(
                        "blog_most_popular_insightful_articles_about_saa",
                        "Our most popular and insightful articles about SaaS foundations, agent workflows, and product delivery",
                      )}
                    </p>
                  </div>
                  <div className="grid gap-6 sm:gap-8 lg:gap-12">
                    {featuredPostCards}
                  </div>
                </section>
              )}

              {/* Regular Posts */}
              {regularPosts.length > 0 && (
                <section>
                  {featuredPosts.length > 0 && (
                    <div className="mb-6 text-center sm:mb-8">
                      <h2 className="text-foreground mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        {t("blog_all_posts", "All Posts")}
                      </h2>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {t(
                          "blog_explore_complete_collection_articles",
                          "Explore our complete collection of articles",
                        )}
                      </p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8">
                    {regularPostCards}
                  </div>
                </section>
              )}
            </div>
          )}
        </SectionContainer>
      </section>
    </>
  );
}
export default function BlogPage() {
  return <BlogPageContent locale={SOURCE_LOCALE} />;
}
