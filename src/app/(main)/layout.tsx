import { TopNavbar } from "@/components/top-navbar";
import { BottomNav } from "@/components/bottom-nav";
import { ProgressHydrator } from "@/components/progress-hydrator";
import { AuthGuard } from "@/components/auth-guard";

type Props = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <AuthGuard>
      <ProgressHydrator />
      <TopNavbar />
      <main className="flex-1 pt-14 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6 h-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </AuthGuard>
  );
};

export default MainLayout;
