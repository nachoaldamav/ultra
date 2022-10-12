export default function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="flex h-auto w-4/5 mx-auto md:mx-0 md:h-32 md:w-1/3 flex-col items-center justify-center gap-4 rounded-lg border border-gray-400 bg-secondary bg-transparent p-4 transition duration-150 ease-in-out hover:border-transparent hover:bg-secondary">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-center text-lg font-extralight text-white">
        {description}
      </p>
    </article>
  );
}
