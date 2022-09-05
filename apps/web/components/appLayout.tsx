import NavBar from "./navBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-[#222222] text-white">
      <NavBar />
      {children}
    </div>
  );
}
