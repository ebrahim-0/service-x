import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PublicGuard } from "@/guards";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="absolute top-5 rtl:left-5 ltr:right-5 z-10">
        <LanguageSwitcher />
      </div>
      <PublicGuard />
      {children}
    </>
  );
};

export default layout;
