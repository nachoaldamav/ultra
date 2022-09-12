import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getDoc } from "utils/getDoc";

export let loader = async ({ params }: any) => {
  try {
    const post = await getDoc(params.doc || "");
    let data = {
      post,
    };

    return json(data);
  } catch (e) {
    console.log(e);
    throw new Response("Not Found", {
      status: 404,
    });
  }
};

export default function DocsDetail() {
  const { post } = useLoaderData();

  return (
    <article
      className="prose prose-invert dark:prose-invert lg:prose-lg prose-pre:bg-transparent prose-pre:m-0 w-4/5 h-fit min-h-screen"
      dangerouslySetInnerHTML={{ __html: post.body }}
    />
  );
}
