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
    title: t("fb69566ae615", "Blog"),
    description: t(
      "3c8a82874d5b",
      "Read implementation notes, tutorials, and insights about shipping agent-friendly SaaS products with strong auth, APIs, CLI tooling, and testing.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("d4cd40ad926d", "Blog"),
      description: t(
        "0d402cc9bcaa",
        "Read implementation notes, tutorials, and insights about shipping agent-friendly SaaS products with strong auth, APIs, CLI tooling, and testing.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("343ee1208c33", "Blog"),
      description: t(
        "b8db195501b8",
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
                {t("a1a06427fbc3", "BLOG_INDEX")}
              </span>
            </Badge>
            <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:mb-6 sm:text-4xl lg:text-5xl xl:text-6xl">
              {t("7395e77efd89", "Our Blog")}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed sm:text-xl">
              {t(
                "55a16e58d31c",
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
                {t("109e37fca92d", "No posts yet")}
              </h2>
              <p className="text-muted-foreground mx-auto max-w-md text-sm sm:text-base">
                {t(
                  "48159a678705",
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
                      {t("95a57be1116a", "Featured Posts")}
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {t(
                        "f012146ee30a",
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
                        {t("bdfd12b5d617", "All Posts")}
                      </h2>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {t(
                          "75bc78813c9f",
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
