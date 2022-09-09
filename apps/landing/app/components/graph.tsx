export default function Graph() {
  const data = [
    {
      name: "Yarn",
      value: 2.17,
    },
    {
      name: "NPM",
      value: 1.87,
    },
    {
      name: "PNPM",
      value: 1.53,
    },
    {
      name: "SNPM",
      value: 1.46,
    },
  ];

  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="mt-10 flex w-full max-w-2xl flex-col gap-2">
      {data.reverse().map((item, index) => (
        <div className="flex flex-row items-center gap-2" key={index}>
          <h4 className="w-16 text-xl font-semibold text-white">{item.name}</h4>
          <Progress value={(item.value / max) * 100} secs={item.value} />
        </div>
      ))}
    </div>
  );
}

function Progress({ value, secs }: { value: number; secs: number }) {
  return (
    <div className="h-8 w-full rounded-xl rounded-l-none bg-transparent">
      <span className="absolute ml-4 text-xl font-semibold text-white">
        {secs}s
      </span>
      <div
        className="h-8 rounded rounded-l-none bg-blue-600"
        style={{
          width: `${value}%`,
        }}
      />
    </div>
  );
}
