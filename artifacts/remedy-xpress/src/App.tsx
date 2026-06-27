import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "@/pages/home";
import TrackPage from "@/pages/track";
import DispatcherPage from "@/pages/dispatcher";
import RiderPage from "@/pages/rider";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen bg-[#080e1f] flex items-center justify-center text-center px-4">
      <div>
        <p className="text-6xl font-black text-amber-400 mb-4">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-blue-300/50 text-sm">This link doesn't exist.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* / → Landing page (public) */}
      <Route path="/" component={HomePage} />
      {/* /track → Customer tracking only */}
      <Route path="/track" component={TrackPage} />
      {/* /rider → Rider dashboard only */}
      <Route path="/rider" component={RiderPage} />
      {/* /dispatcher → Admin dashboard (private) */}
      <Route path="/dispatcher" component={DispatcherPage} />
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
