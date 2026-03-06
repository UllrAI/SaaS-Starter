import { allAuthors, allPosts } from "content-collections";

type BlogAuthor = (typeof allAuthors)[number];
type BlogPost = (typeof allPosts)[number];

const authorsBySlug = new Map<string, BlogAuthor>(
  allAuthors.map((author) => [author.slug, author]),
);

const sortedPosts = allPosts.toSorted((a, b) => {
  const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
  const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);

  if (dateA.getTime() !== dateB.getTime()) {
    return dateB.getTime() - dateA.getTime();
  }

  return a.title.localeCompare(b.title);
});

export type { BlogAuthor, BlogPost };

export function getAllPosts(): BlogPost[] {
  return sortedPosts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((post) => post.slug === slug);
}

export function getAuthorBySlug(slug?: string | null): BlogAuthor | undefined {
  if (!slug) {
    return undefined;
  }

  return authorsBySlug.get(slug);
}
