export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-gray-800 text-white p-4">
        {children}
    </div>
  );
}