import { Outlet } from "react-router-dom";
import AppHeader from "./header/app-header";
import AppFooter from "./footer/app-footer";

export default function MainLayout() {
  return (
    <>
      <div className="flex flex-col justify-between min-h-screen">
        <header>
          <AppHeader />
        </header>
        <main>
          <Outlet />
        </main>
        <footer>
          <AppFooter />
        </footer>
      </div>
    </>
  );
}
