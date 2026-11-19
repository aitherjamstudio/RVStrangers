import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import { Search, MessageSquare, Gamepad2, UserPlus, ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';

interface FriendProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  status: string;
}

export const FriendsView: React.FC = () => {
  const { setScreen, isDarkMode, showToast, currentUser, isGuest, token, logout, loginWithGoogle } = useGameStore();
  const [activeTab, setActiveTab] = useState<'list' | 'requests' | 'profile' | 'find'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      api.getFriends(token).then((res) => {
        if (res && res.success) {
          setFriends(Array.isArray(res.friends) ? res.friends : []);
          setPendingRequests(Array.isArray(res.pendingRequests) ? res.pendingRequests : []);
        }
      });
    } else {
      setFriends([]);
      setPendingRequests([]);
    }
  }, [token]);

  const filteredFriends = friends.filter((f) => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-5 pb-28 pt-2 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-accent/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('dashboard')}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Friends & Community</h2>
            <p className="text-xs text-purple-300/70">Connect, chat, and invite players to game tables</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (isGuest) {
              showToast('Adding friends requires a registered account. Sign in with Google!');
              return;
            }
            setActiveTab('find');
          }}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 transition-all"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Guest Lock Banner */}
      {isGuest && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-300">Guest Mode (Local Play Only)</h4>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                Friends, direct chat, and game invites require a registered account. Sign in with Google to unlock full social features.
              </p>
            </div>
          </div>
          <button
            onClick={() => loginWithGoogle()}
            className="px-4 py-2 rounded-full bg-white hover:bg-gray-100 text-[#1F1726] text-xs font-bold shrink-0 shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>
        </div>
      )}

      {/* Sub Tabs: Friends, Requests, My Profile, Find */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
            activeTab === 'list' 
              ? 'bg-accent text-white shadow-md' 
              : 'bg-white/5 border border-white/10 text-purple-300 hover:text-white'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => {
            if (isGuest) {
              showToast('Friend requests are reserved for registered players.');
              return;
            }
            setActiveTab('requests');
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === 'requests' 
              ? 'bg-accent text-white shadow-md' 
              : 'bg-white/5 border border-white/10 text-purple-300 hover:text-white'
          }`}
        >
          <span>Requests</span>
          {pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
            activeTab === 'profile' 
              ? 'bg-accent text-white shadow-md' 
              : 'bg-white/5 border border-white/10 text-purple-300 hover:text-white'
          }`}
        >
          My Profile
        </button>
        <button
          onClick={() => {
            if (isGuest) {
              showToast('Find & Add Friends is reserved for registered players.');
              return;
            }
            setActiveTab('find');
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
            activeTab === 'find' 
              ? 'bg-accent text-white shadow-md' 
              : 'bg-white/5 border border-white/10 text-purple-300 hover:text-white'
          }`}
        >
          Find
        </button>
      </div>

      {/* VIEW A: FRIENDS LIST (Responsive Grid: 1 col on mobile, 2 cols on tablet/desktop) */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full py-3 pl-11 pr-4 rounded-2xl bg-[#140423] border border-accent/30 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-accent"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#230C39]/60 border border-accent/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 text-accent-light flex items-center justify-center mx-auto text-xl">
                👥
              </div>
              <h4 className="text-sm font-bold text-white">No Friends Connected Yet</h4>
              <p className="text-xs text-purple-300/80 max-w-xs mx-auto">
                Connect with players worldwide! Search for community members or invite nearby friends to play.
              </p>
              {!isGuest && (
                <button
                  onClick={() => setActiveTab('find')}
                  className="px-4 py-2 rounded-full bg-accent text-white text-xs font-bold shadow-md hover:bg-accent/80 transition-all"
                >
                  Find Players
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredFriends.map((f) => (
                <div 
                  key={f.id}
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-[#230C39]/80 border-accent/25' : 'bg-white border-primary/15 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={f.avatar} 
                        alt={f.name} 
                        className="w-12 h-12 rounded-full bg-[#351057] border border-accent/40"
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#1A052B] rounded-full ${
                        f.status === 'Online' ? 'bg-emerald-500' : f.status === 'In Game' ? 'bg-amber-400' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">{f.name}</h4>
                      <p className="text-[10px] sm:text-xs text-accent-light">@{f.handle}</p>
                      <span className={`text-[10px] font-bold ${
                        f.status === 'Online' ? 'text-emerald-400' : f.status === 'In Game' ? 'text-amber-300' : 'text-gray-400'
                      }`}>
                        ● {f.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if (isGuest) {
                          showToast('Direct chat is reserved for registered players. Continue with Google!');
                          return;
                        }
                        showToast(`Opened direct chat with ${f.name}`);
                      }}
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                      title="Send Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (isGuest) {
                          showToast('Inviting players is reserved for registered players. Continue with Google!');
                          return;
                        }
                        showToast(`Sent game invite to ${f.name}!`);
                      }}
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-accent-light transition-colors"
                      title="Invite to Game"
                    >
                      <Gamepad2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: MY PROFILE VIEW (image_1.png center) */}
      {activeTab === 'profile' && (
        <div className="rounded-3xl overflow-hidden border border-accent/35 bg-[#230C39]/80 shadow-2xl">
          {/* Mountain Twilight Banner */}
          <div className="h-32 sm:h-40 w-full bg-gradient-to-b from-[#4C127D] via-[#2D0A4E] to-[#1A052B] relative flex items-center justify-center">
            <div className="absolute top-4 right-16 w-12 h-12 rounded-full bg-pink-300 drop-shadow-[0_0_16px_rgba(244,114,182,0.8)]" />
            <span className="absolute bottom-0 text-5xl sm:text-6xl opacity-30">🏔️🏔️</span>
          </div>

          {/* Profile Header */}
          <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
            <div className="relative mb-2">
              <img 
                src={currentUser?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=alex"} 
                alt={currentUser?.name || "Player"} 
                className="w-24 h-24 rounded-full bg-[#290742] border-4 border-[#1A052B] shadow-2xl"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#1A052B] rounded-full" />
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              {currentUser?.name || 'Alex'}
            </h3>
            <p className="text-xs sm:text-sm text-accent-light font-medium">
              @{currentUser?.handle || 'alex_92'}
            </p>

            {isGuest ? (
              <span className="mt-1 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Guest Session (Local Only)
              </span>
            ) : (
              <span className="mt-1 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                ● Registered Cloud Member
              </span>
            )}

            {/* Stat Cards (24 Cards, 8 Decks, 16 Friends) */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg mt-5">
              <div className="p-3 sm:p-4 rounded-2xl bg-[#2D0D4B] border border-accent/30 flex flex-col items-center">
                <span className="text-sm">🎴</span>
                <span className="text-base sm:text-lg font-extrabold text-white mt-0.5">24</span>
                <span className="text-xs opacity-70">Cards</span>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-[#2D0D4B] border border-accent/30 flex flex-col items-center">
                <span className="text-sm">📚</span>
                <span className="text-base sm:text-lg font-extrabold text-white mt-0.5">8</span>
                <span className="text-xs opacity-70">Decks</span>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-[#2D0D4B] border border-accent/30 flex flex-col items-center">
                <span className="text-sm">👥</span>
                <span className="text-base sm:text-lg font-extrabold text-white mt-0.5">{isGuest ? 0 : 16}</span>
                <span className="text-xs opacity-70">Friends</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg mt-4">
              <button 
                onClick={() => showToast("Profile link copied!")}
                className="py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95"
              >
                Share Profile
              </button>
              <button 
                onClick={logout}
                className="py-2.5 sm:py-3 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

            {/* About Quote Block */}
            <div className="w-full max-w-lg mt-4 p-4 rounded-2xl bg-[#2D0D4B] border border-accent/20 text-left">
              <span className="text-xs font-bold text-accent-light">About</span>
              <p className="text-xs sm:text-sm text-white/90 mt-1 italic leading-relaxed">
                "Here to play deep card games and meet thoughtful strangers! 🎴"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: FRIEND REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-accent-light uppercase tracking-wider">
            Pending Requests ({pendingRequests.length})
          </h4>

          {pendingRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#230C39]/60 border border-accent/20 text-center text-xs text-purple-300/70">
              No pending friend requests right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 sm:p-5 rounded-3xl bg-[#230C39]/80 border border-accent/35 space-y-3.5 shadow-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={req.avatar} 
                      alt={req.name} 
                      className="w-12 h-12 rounded-full bg-[#351057] border border-accent/40"
                    />
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-white">{req.name}</h5>
                      <p className="text-xs text-accent-light">@{req.handle}</p>
                      <span className="text-xs text-gray-300">Sent you a friend request</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
                        showToast(`Accepted ${req.name}'s friend request!`);
                      }}
                      className="py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-md"
                    >
                      ✓ Accept
                    </button>
                    <button 
                      onClick={() => {
                        setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
                        showToast(`Declined request from ${req.name}.`);
                      }}
                      className="py-2.5 rounded-full bg-white/5 border border-white/10 text-purple-300 text-xs sm:text-sm font-bold"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW D: FIND USERS */}
      {activeTab === 'find' && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by exact @username..."
            className="w-full py-3 px-4 rounded-2xl bg-[#140423] border border-accent/30 text-xs sm:text-sm text-white"
          />
          <p className="text-xs sm:text-sm text-purple-300/60 text-center py-10">
            Enter a handle to find and connect with conversational partners across the world.
          </p>
        </div>
      )}
    </div>
  );
};
