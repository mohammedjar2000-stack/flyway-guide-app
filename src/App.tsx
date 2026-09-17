import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import Header from '@/components/Header';
import ChatWidget from '@/components/ChatWidget';
import MapNavigator from '@/components/MapNavigator';
import TravelCompanion from '@/components/TravelCompanion';
import HomePage from '@/pages/HomePage';
import DirectoryPage from '@/pages/DirectoryPage';
import VisasPage from '@/pages/VisasPage';
import HotelsPage from '@/pages/HotelsPage';
import InsurancePage from '@/pages/InsurancePage';
import RewardsPage from '@/pages/RewardsPage';
import DiscoverIraqPage from '@/pages/DiscoverIraqPage';
import type { PageKey } from '@/types';
import { locationsEqual, locationIdentityEqual, resolveMapFocus, type AppLocation } from '@/lib/cityCoordinates';
import {
  locationFromFallbackSession,
  locationToSessionPatch,
  resolveInitialSession,
  subscribeSession,
  writeSession,
  type AppSession,
} from '@/lib/appSession';

function directoryFilterFromSession(session: AppSession) {
  if (!session.city && !session.country && !session.district) return null;
  return {
    country: session.country,
    city: session.city,
    district: session.district,
    category: session.cats.length === 1 ? session.cats[0] : undefined,
  };
}

function AppContent() {
  const initial = useMemo(() => resolveInitialSession(), []);
  const [page, setPage] = useState<PageKey>(initial.view);
  const [appLocation, setAppLocation] = useState<AppLocation>(() => locationFromFallbackSession(initial));
  const [directoryFilter, setDirectoryFilter] = useState<{ country?: string; city?: string; district?: string; category?: string } | null>(
    () => directoryFilterFromSession(initial),
  );

  useEffect(() => {
    writeSession({
      view: initial.view,
      cats: initial.cats,
      q: initial.q,
      ...locationToSessionPatch(locationFromFallbackSession(initial)),
    }, 'replace');
  }, [initial]);

  useEffect(() => subscribeSession((session) => {
    setPage((prev) => (prev === session.view ? prev : session.view));
    setAppLocation((prev) => {
      const next = locationFromFallbackSession(session);
      if (locationIdentityEqual(prev, next)) return prev;
      return locationsEqual(prev, next) ? prev : next;
    });
    if (session.view === 'directory') {
      setDirectoryFilter(directoryFilterFromSession(session));
    }
  }), []);

  const persistPage = useCallback((nextPage: PageKey) => {
    setPage(nextPage);
    writeSession({ view: nextPage }, 'push');
  }, []);

  const handleNavigate = (p: PageKey) => persistPage(p);

  const handleLocationChange = (loc: AppLocation) => {
    const next = resolveMapFocus(loc);
    setAppLocation((prev) => (locationsEqual(prev, next) ? prev : next));
    writeSession(locationToSessionPatch(next), 'replace');
  };

  const handleSearchNavigate = (loc: AppLocation) => {
    const next = resolveMapFocus(loc);
    setAppLocation((prev) => (locationsEqual(prev, next) ? prev : next));
    writeSession({ view: 'navigator', ...locationToSessionPatch(next) }, 'push');
    setPage('navigator');
  };

  const handleDirectoryNavigate = (filter: { country?: string; city?: string; district?: string; category?: string }) => {
    setDirectoryFilter(filter);
    setPage('directory');
    writeSession({
      view: 'directory',
      city: filter.city || '',
      country: filter.country || '',
      district: filter.district || '',
    }, 'push');
  };

  const handleCameraChange = useCallback((lat: number, lng: number, zoom: number) => {
    writeSession({ lat, lng, zoom }, 'replace');
  }, []);

  const pages: Record<PageKey, React.ReactNode> = {
    home: (
      <HomePage
        onNavigate={handleNavigate}
        onLocationChange={handleLocationChange}
        onSearchNavigate={handleSearchNavigate}
        onDirectoryNavigate={handleDirectoryNavigate}
        currentLocation={appLocation}
      />
    ),
    navigator: (
      <MapNavigator
        searchLocation={appLocation}
        onLocationChange={handleLocationChange}
        onCameraChange={handleCameraChange}
      />
    ),
    directory: <DirectoryPage locationFilter={directoryFilter} />,
    visas: <VisasPage />,
    hotels: <HotelsPage />,
    insurance: <InsurancePage />,
    rewards: <RewardsPage />,
    'discover-iraq': <DiscoverIraqPage />,
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      <Header currentPage={page} onNavigate={handleNavigate} />
      <main>{pages[page]}</main>
      {page !== 'navigator' && (
        <footer className="text-center py-6 border-t border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-zinc-500 text-xs">
          © 2025 FlywayGuide — دليل المسافر الذكي | للحجز والمعالجة: flyway.travel
        </footer>
      )}
      <ChatWidget />
      <TravelCompanion />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
