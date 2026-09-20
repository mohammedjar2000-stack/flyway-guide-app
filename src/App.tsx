import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import ChatWidget from '@/components/ChatWidget';
import type { ConciergeAction, ConciergeLocale, ConciergePlace } from '@/lib/flywayConcierge';
import MapNavigator from '@/components/MapNavigator';
import HomePage from '@/pages/HomePage';
import DirectoryPage from '@/pages/DirectoryPage';
import VisasPage from '@/pages/VisasPage';
import HotelsPage from '@/pages/HotelsPage';
import InsurancePage from '@/pages/InsurancePage';
import RewardsPage from '@/pages/RewardsPage';
import DiscoverIraqPage from '@/pages/DiscoverIraqPage';
import type { PageKey } from '@/types';
import type { IraqiMission } from '@/lib/iraqiMissions';
import { lookupCity, lookupDistrict, locationsEqual, locationIdentityEqual, resolveMapFocus, type AppLocation } from '@/lib/cityCoordinates';
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
  const [mapResultsOpen, setMapResultsOpen] = useState(false);
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
    if (nextPage !== 'navigator') setMapResultsOpen(false);
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

  const handleOpenMission = (mission: IraqiMission) => {
    const loc: AppLocation = {
      lat: mission.lat,
      lng: mission.lng,
      zoom: 17,
      label: mission.nameAr,
      country: mission.countryAr,
      city: mission.cityAr,
      district: mission.address,
      categoryKey: 'embassy',
      poiId: mission.id,
    };
    setAppLocation(loc);
    writeSession({ view: 'navigator', ...locationToSessionPatch(loc) }, 'push');
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

  const handleConciergePlace = useCallback((place: ConciergePlace) => {
    const districtHit = lookupDistrict(place.address, place.city)
      || lookupDistrict(place.name, place.city);
    const loc: AppLocation = {
      lat: place.lat,
      lng: place.lng,
      zoom: 17,
      label: place.name,
      country: place.country || appLocation.country,
      city: place.city || appLocation.city,
      district: districtHit?.district.name || appLocation.district,
      categoryKey: place.category_key === 'police' ? 'embassy' : place.category_key,
      poiId: place.id,
    };
    setAppLocation(loc);
    writeSession({
      view: 'navigator',
      cats: [loc.categoryKey || place.category_key],
      ...locationToSessionPatch(loc),
    }, 'push');
    setPage('navigator');
  }, [appLocation.city, appLocation.country, appLocation.district]);

  const handleConciergeLocale = useCallback((locale: ConciergeLocale) => {
    const loc = resolveMapFocus({
      ...appLocation,
      city: locale.city,
      country: locale.country || appLocation.country,
      district: locale.district,
      lat: locale.lat,
      lng: locale.lng,
      label: locale.label,
      categoryKey: locale.category || appLocation.categoryKey,
    });
    loc.zoom = locale.zoom || loc.zoom;
    loc.lat = locale.lat;
    loc.lng = locale.lng;
    if (locale.poiId) loc.poiId = locale.poiId;
    else delete loc.poiId;
    setAppLocation(loc);
    writeSession({
      view: 'navigator',
      cats: locale.category ? [locale.category] : undefined,
      ...locationToSessionPatch(loc),
    }, 'push');
    setPage('navigator');
  }, [appLocation]);

  const handleConciergeAction = useCallback((action: ConciergeAction) => {
    if (action.page === 'visas') {
      persistPage('visas');
      return;
    }
    if (action.page === 'directory') {
      setDirectoryFilter({
        city: action.city || appLocation.city,
        country: appLocation.country,
        district: action.district,
        category: action.category,
      });
      setPage('directory');
      writeSession({
        view: 'directory',
        city: action.city || appLocation.city || '',
        country: appLocation.country || '',
        district: action.district || '',
      }, 'push');
      return;
    }
    if (action.page === 'navigator') {
      const cityHit = lookupCity(action.city) || lookupCity(appLocation.city);
      const loc = resolveMapFocus({
        ...appLocation,
        city: cityHit?.name || action.city || appLocation.city,
        country: cityHit?.country || appLocation.country,
        district: action.district,
        lat: action.lat ?? appLocation.lat,
        lng: action.lng ?? appLocation.lng,
        label: action.district
          ? `${action.district}، ${cityHit?.name || action.city || appLocation.city || ''}`
          : cityHit?.name || appLocation.label,
        categoryKey: action.category || appLocation.categoryKey,
      });
      if (typeof action.lat === 'number' && typeof action.lng === 'number') {
        loc.lat = action.lat;
        loc.lng = action.lng;
      }
      if (action.zoom) loc.zoom = action.zoom;
      delete loc.poiId;
      setAppLocation(loc);
      writeSession({
        view: 'navigator',
        cats: action.category ? [action.category] : undefined,
        ...locationToSessionPatch(loc),
      }, 'push');
      setPage('navigator');
    }
  }, [appLocation, persistPage]);

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
        onResultsOpenChange={setMapResultsOpen}
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
      <Header currentPage={page} onNavigate={handleNavigate} currentCountry={appLocation.country} onOpenMission={handleOpenMission} />
      <main>
        <ErrorBoundary label="الصفحة" resetKey={page}>
          {pages[page]}
        </ErrorBoundary>
      </main>
      <ErrorBoundary label="مساعد Flyway الذكي" resetKey={`${appLocation.city || ''}:${page}`}>
        <ChatWidget
          lifted={page === 'navigator' && mapResultsOpen}
          city={appLocation.city}
          country={appLocation.country}
          lat={appLocation.lat}
          lng={appLocation.lng}
          onOpenPlace={handleConciergePlace}
          onAction={handleConciergeAction}
          onFocusLocale={handleConciergeLocale}
        />
      </ErrorBoundary>
      {page !== 'navigator' && (
        <footer className="text-center py-6 border-t border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-zinc-500 text-xs">
          © 2025 FlywayGuide — دليل المسافر الذكي | للحجز والمعالجة: flyway.travel
        </footer>
      )}
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
