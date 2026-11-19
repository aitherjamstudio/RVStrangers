import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { WelcomeAuthView } from './components/WelcomeAuthView';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { GameTable } from './components/GameTable';
import { FriendsView } from './components/FriendsView';
import { MyCardsView } from './components/MyCardsView';
import { MatchmakingModal } from './components/MatchmakingModal';
import { StoreView } from './components/StoreView';
import { BottomNav } from './components/BottomNav';

export const App: React.FC = () => {
  const { currentScreen, toastMessage, initSessionFromD1 } = useGameStore();

  useEffect(() => {
    initSessionFromD1();
  }, []);

  return (
    <div className="min-h-screen bg-[#11031D] text-white flex flex-col items-center font-comfortaa relative selection:bg-accent selection:text-white">
      {/* Background Ambient Radial Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

      {/* Main Responsive Wrapper (Adapts seamlessly: Mobile max-w-md, Tablet max-w-3xl, Desktop max-w-5xl / max-w-6xl) */}
      <div className="w-full max-w-md sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl min-h-screen flex flex-col px-3.5 sm:px-6 lg:px-8 relative z-10 transition-all duration-300">
        
        {/* Global Persistent Top Navigation (Shown across in-app pages) */}
        {currentScreen !== 'welcome' && <TopNav />}

        {/* Active Screen Display (Routed by state) */}
        <main className={`flex-1 w-full ${currentScreen === 'welcome' ? 'flex flex-col items-center justify-center' : ''}`}>
          {currentScreen === 'welcome' && <WelcomeAuthView />}
          {currentScreen === 'dashboard' && <DashboardView />}
          {currentScreen === 'game' && <GameTable />}
          {currentScreen === 'friends' && <FriendsView />}
          {currentScreen === 'my-cards' && <MyCardsView />}
          {currentScreen === 'matchmaking' && <MatchmakingModal />}
          {currentScreen === 'store' && <StoreView />}
        </main>

        {/* Global Persistent Navigation (Present across in-app pages: Play, My Cards, Store, Profile) */}
        {currentScreen !== 'welcome' && <BottomNav />}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-primary border border-accent text-white text-xs sm:text-sm font-bold shadow-2xl animate-fade-in flex items-center gap-2">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
