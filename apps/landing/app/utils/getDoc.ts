import path from "path";
import prism from "prismjs";
import { marked } from "marked";
import fs from "fs/promises";
import parseFrontMatter from "front-matter";

import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";

type PostMarkdownAttributes = {
  title: string;
  date: string;
  description: string;
};

export async function getDoc(slug: string): Promise<any> {
  marked.setOptions({
    highlight: function (code, lang) {
      if (prism.languages[lang]) {
        return prism.highlight(code, prism.languages[lang], lang);
      } else {
        return code;
      }
    },
  });

  const pathToPosts = path.join(__dirname, "..", "docs");
  const filepath = path.join(pathToPosts, slug + ".mdx");
  const file = await fs.readFile(filepath);
  const { attributes, body } = parseFrontMatter<PostMarkdownAttributes>(
    file.toString()
  );
  const markdown = marked(body, {});

  return {
    slug,
    title: attributes.title,
    date: attributes.date,
    description: attributes.description,
    body: markdown,
  };
}
