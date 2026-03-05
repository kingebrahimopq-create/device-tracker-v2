import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceForm from "./pages/DeviceForm";
import DeviceEdit from "./pages/DeviceEdit";
import DeviceDetail from "./pages/DeviceDetail";
import ActivityLogs from "./pages/ActivityLogs";
import Alerts from "./pages/Alerts";
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import Map from "./pages/Map";
import ClientBuilder from "./pages/ClientBuilder";
import { useEffect } from "react";
import { applyRTLStyles } from "./lib/rtl";

function Router() {
  return (
    <Switch>
      <Route path={"\\"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/devices"} component={Devices} />
      <Route path={"/devices/new"} component={DeviceForm} />
      <Route path={"/devices/:id/edit"} component={DeviceEdit} />
      <Route path={"/devices/:id"} component={DeviceDetail} />
      <Route path={"/activity-logs"} component={ActivityLogs} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/users"} component={UserManagement} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/map"} component={Map} />
      <Route path={"/client-builder"} component={ClientBuilder} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    // Apply RTL styles for Arabic language
    const lang = document.documentElement.lang || 'ar';
    applyRTLStyles(document.documentElement, lang);
    document.documentElement.setAttribute('lang', lang);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
