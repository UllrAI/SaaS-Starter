import { config, fields, collection } from "@keystatic/core";

export const showAdminUI = process.env.NODE_ENV === "development";
import { APP_NAME } from "@/lib/config/constants";

export default config({
  storage: {
    // 仅在本地开发环境中可用管理面板
    kind: "local",
  },
  ui: {
    brand: { name: APP_NAME },
  },
  collections: {
    authors: collection({
      label: "Authors",
      slugField: "name",
      path: "content/authors/*",
      format: { data: "json" },
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        avatar: fields.image({
          label: "Avatar",
          directory: "public/avatars",
          publicPath: "/avatars/",
        }),
      },
    }),
    posts: collection({
      label: "Blog",
      slugField: "title",
      path: "content/blog/*",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        publishedDate: fields.date({ label: "Published Date" }),
        author: fields.relationship({
          label: "Author",
          collection: "authors",
        }),
        excerpt: fields.text({
          label: "Excerpt",
          description: "A brief summary of the blog post (optional)",
          multiline: true,
        }),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tags",
          itemLabel: (props) => props.value || "Tag",
        }),
        featured: fields.checkbox({
          label: "Featured Post",
          description: "Mark this post as featured",
        }),
        heroImage: fields.image({
          label: "Hero Image",
          description: "Featured image for the blog post (optional)",
          directory: "public/blog",
          publicPath: "/blog/",
        }),
        content: fields.markdoc({ label: "Content" }),
      },
    }),
  },
});
