import { Outlet } from "react-router-dom";
import SideBar from "../ui/Components/SideBar";

function AppLayout() {
  return (
    <div className="min-h-screen bg-cream-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <SideBar />
      <main id="main-content" role="main" className="md:ml-[260px] transition-all duration-200">
        <div className="p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
