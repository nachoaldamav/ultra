import parseFrontMatter from "front-matter";
import fs from "fs/promises";
import path from "path";

type PostMarkdownAttributes = {
  meta: { title: string; date: string; description: string; order: number };
};

export async function getDocs(): Promise<any> {
  // `${__dirname}/../../app/docs`
  const pathToPosts = path.join(__dirname, "..", "docs");
  const allPostFiles = await fs
    .readdir(pathToPosts)
    .then((files) => files.filter((file) => file.endsWith(".mdx")))
    .catch(async (err) => {
      console.error(err);
      // Read cwd contents
      console.log("CWD Content: ", [
        await fs.readdir(path.join(__dirname)),
        await fs.readdir(path.join(__dirname, "..")),
        await fs.readdir(path.join(__dirname, "..", "..")),
        await fs.readdir(path.join(__dirname, "..", "..", "..")),
        await fs.readdir(path.join(__dirname, "..", "..", "..", "..")),
      ]);
      return [];
    });

  const posts = await Promise.all(
    allPostFiles.map(async (filename) => {
      const file = await fs.readFile(path.join(pathToPosts, filename));
      const { attributes, body } = parseFrontMatter<PostMarkdownAttributes>(
        file.toString()
      );

      return {
        slug: filename.replace(/\.mdx$/, ""),
        title: attributes.meta.title,
        date: attributes.meta.date,
        description: attributes.meta.description,
        order: attributes.meta.order,
      };
    })
  );

  return posts.sort((a, b) => {
    return a.order - b.order;
  });
}
