import { Switch, Route, Router as WouterRouter, useSearch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TrackPage from "@/pages/track";
import DispatcherPage from "@/pages/dispatcher";
import RiderPage from "@/pages/rider";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-4">
      <div>
        <p className="text-6xl font-black text-orange-500 mb-4">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-400 text-sm">This link doesn't exist.</p>
      </div>
    </div>
  );
}

// Track page wrapper: auto-fills order ID from ?id= query param
function TrackWrapper() {
  return <TrackPage />;
}

function Router() {
  return (
    <Switch>
      {/* / → Dispatcher dashboard (your private admin link) */}
      <Route path="/" component={DispatcherPage} />
      {/* /track → Customer tracking page (safe to share) */}
      <Route path="/track" component={TrackWrapper} />
      {/* /rider → Rider dashboard (share with riders only) */}
      <Route path="/rider" component={RiderPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
