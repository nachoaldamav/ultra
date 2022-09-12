import path from "path";
import fs from "fs/promises";
import parseFrontMatter from "front-matter";

// Path to the docs directory
const docsPath = path.join(__dirname, "..", "app", "routes", "docs");

export async function getDocs() {
  const postsPath = await fs.readdir(docsPath, {
    withFileTypes: true,
  });

  const posts = await Promise.all(
    postsPath
      .filter((post) => post.name.endsWith(".mdx"))
      .map(async (dirent) => {
        const file = await fs.readFile(path.join(docsPath, dirent.name));

        const { attributes }: { attributes: DocsInfo } = parseFrontMatter(
          file.toString()
        );

        return {
          slug: dirent.name.replace(/\.mdx$/, ""),
          title: attributes.meta.title,
          date: attributes.meta.date,
          description: attributes.meta.description,
          order: attributes.meta.order,
        };
      })
  );

  return posts;
}

export type DocsInfo = {
  meta: {
    title: string;
    date: string;
    description: string;
    order: number;
  };
};
