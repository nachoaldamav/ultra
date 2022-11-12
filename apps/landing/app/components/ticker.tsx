import { useState, useEffect } from "react";
import { useHover } from "@react-aria/interactions";

export default function Ticker() {
  const [count, setCount] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1);
    }, 400);

    return () => clearInterval(interval);
  }, [count]);

  let { hoverProps, isHovered } = useHover({
    onHoverStart: () => setHovered(true),
    onHoverEnd: () => setHovered(false),
  });

  return (
    <span
      {...hoverProps}
      className="fixed bottom-0 right-0 m-2 cursor-pointer z-50 w-52 text-white snippet text-center transform transition hover:opacity-100 opacity-50 duration-150 ease-in-out"
    >
      {!hovered && <span>Installed Axios {count} times with cache</span>}
      {hovered && (
        <span>Installed Axios {(count / 2.5).toFixed(0)} times clean</span>
      )}
    </span>
  );
}
