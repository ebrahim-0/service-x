import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { PrivateGuard } from "@/guards";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <PrivateGuard />

      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default layout;
