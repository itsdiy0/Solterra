import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop only */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-20 flex flex-col min-h-screen">
        {/* Header */}
        <Header title={title} />
        
        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 overflow-x-hidden max-w-full">
           {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
}