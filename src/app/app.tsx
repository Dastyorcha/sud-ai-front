import { lazy, Suspense } from "react";
import { Frame } from "lucide-react";
import { Link, Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import MainLayout from "@/shared/components/layout/main-layout";
import NotFound from "@/pages/notFound";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY } from "@/shared/lib/i18n/locale";
import { LocaleProvider, useTranslation } from "@/shared/lib/i18n/locale-context";
import ScrollToTop from "@/shared/custom/scroll-to-top";
import { AuthGuard } from "@/widgets/layout/auth-guard/auth-guard";
import { AppShell } from "@/widgets/layout/app-shell/app-shell";

// public lazy imports
const ToolsPage = lazy(() => import("@/pages/tools/toolsPage"));

// auth pages lazy imports
const LoginPage = lazy(() => import("@/pages/auth/login/loginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/register/registerPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/resetPassword/resetPasswordPage"));

// product views lazy imports (rendered inside the protected app shell)
const Dashboard = lazy(() => import("@/views/dashboard/dashboard"));
const UsersView = lazy(() => import("@/views/users/users"));
const CasesView = lazy(() => import("@/views/cases/cases"));
const CaseDetailView = lazy(() => import("@/views/cases/case-detail"));

// system/error views lazy imports
const Forbidden = lazy(() => import("@/views/errors/forbidden"));
const NotFoundView = lazy(() => import("@/views/errors/not-found"));
const Maintenance = lazy(() => import("@/views/errors/maintenance"));

/** Strips the leading slash so a locale-less `ROUTE_PATHS` pattern can be
 * registered as a route nested under `/:lang`. */
function relative(path: string): string {
  return path.replace(/^\//, "");
}

/** `/` → the user's last-picked locale (localStorage), else `DEFAULT_LOCALE`. */
function RootRedirect() {
  const location = useLocation();
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  const preferred = isLocale(stored) ? stored : DEFAULT_LOCALE;
  return <Navigate to={{ pathname: `/${preferred}`, search: location.search }} replace />;
}

/** Floating shortcut to `/tools` — localhost only (design playground). */
function ToolsShortcut() {
  const { locale } = useTranslation();
  if (!window.location.host.includes("localhost")) return null;
  return (
    <Link className="fixed bottom-7 right-7" to={withLocale(locale, ROUTE_PATHS.TOOLS)}>
      <Button variant="icon" size="icon">
        <Frame className="size-5" />
      </Button>
    </Link>
  );
}

/**
 * Validates the `:lang` segment. An unsupported locale renders the 404 (in
 * the default-locale context, so it still reads); a valid one provides the
 * locale context to the rest of the app via `<Outlet />`.
 */
function LocaleRoot() {
  const { lang } = useParams();
  const validLocale = isLocale(lang);

  return (
    <LocaleProvider>
      <ScrollToTop />
      {validLocale ? (
        <>
          <Outlet />
          <ToolsShortcut />
        </>
      ) : (
        <NotFound />
      )}
    </LocaleProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/:lang" element={<LocaleRoot />}>
        {/* product shell — protected, dashboard is the index route */}
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route
            index
            element={
              <Suspense>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path={relative(ROUTE_PATHS.CASES)}
            element={
              <Suspense>
                <CasesView />
              </Suspense>
            }
          />
          <Route
            path={relative(ROUTE_PATHS.CASE_DETAIL)}
            element={
              <Suspense>
                <CaseDetailView />
              </Suspense>
            }
          />
          <Route
            path={relative(ROUTE_PATHS.USERS)}
            element={
              <Suspense>
                <UsersView />
              </Suspense>
            }
          />
        </Route>

        {/* system / error pages — bare, no shell */}
        <Route
          path={relative(ROUTE_PATHS.FORBIDDEN)}
          element={
            <Suspense>
              <Forbidden />
            </Suspense>
          }
        />
        <Route
          path={relative(ROUTE_PATHS.NOT_FOUND)}
          element={
            <Suspense>
              <NotFoundView />
            </Suspense>
          }
        />
        <Route
          path={relative(ROUTE_PATHS.MAINTENANCE)}
          element={
            <Suspense>
              <Maintenance />
            </Suspense>
          }
        />

        {/* public routes (shared header/footer shell) */}
        <Route element={<MainLayout />}>
          <Route path={relative(ROUTE_PATHS.TOOLS)} element={<ToolsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* auth pages */}
        <Route path={relative(ROUTE_PATHS.LOGIN)} element={<LoginPage />} />
        <Route path={relative(ROUTE_PATHS.REGISTER)} element={<RegisterPage />} />
        <Route path={relative(ROUTE_PATHS.RESET_PASSWORD)} element={<ResetPasswordPage />} />
      </Route>
    </Routes>
  );
}

export default App;
