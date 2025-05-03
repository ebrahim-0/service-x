import { PublicGuard } from "@/guards";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <PublicGuard />
      {children}
    </>
  );
};

export default layout;
