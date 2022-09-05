import Link from "next/link";

type MiniLinkProps = {
  name: string;
  description: string;
  slug: string;
};

export default function PkgMiniLink({
  name,
  description,
  slug,
}: MiniLinkProps) {
  return (
    <article className="flex flex-col w-full h-full mt-7 pb-2 border-b">
      <Link href={`/package/[id]`} as={`/package/${slug}`}>
        <a className="text-xl font-bold text-left">{name}</a>
      </Link>
      <p className="text-left mt-2">{description.slice(0, 100)}</p>
    </article>
  );
}
