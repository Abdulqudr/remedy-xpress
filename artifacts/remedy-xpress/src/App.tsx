import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "@/pages/home";
import TrackPage from "@/pages/track";
import DispatcherPage from "@/pages/dispatcher";
import RiderPage from "@/pages/rider";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
      <div>
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
        <a href="/" className="text-sm text-primary hover:underline">Go home</a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/track" component={TrackPage} />
      <Route path="/dispatcher" component={DispatcherPage} />
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
