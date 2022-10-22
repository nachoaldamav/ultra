export default function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="flex h-auto w-3/5 mx-auto md:mx-0 md:h-32 md:w-1/4 flex-col items-center justify-start gap-2 bg-transparent p-4">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-center text-base text-[#71717A]">{description}</p>
    </article>
  );
}
