import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Song = {
  id: string;
  title: string;
  artist: string;
};

export default function AddSongPage() {
  const [title, setTitle] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [learningSongs, setLearningSongs] = useState<Song[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'my' | 'saved'>('search');
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type?: 'success' | 'error' | 'info' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  };

  // load current user on mount
  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) setUser(user ?? null);
    };
    loadUser();
    return () => { mounted = false };
  }, []);

  // fetch saved and learning lists for current user
  const fetchLists = async (userId: string) => {
    try {
      console.debug('fetchLists: attempting relational select for saved_songs');
      const { data: savedData, error: savedError } = await supabase
        .from("saved_songs")
        .select("song_id, songs(id, title, artist)")
        .eq("user_id", userId);

      if (savedError) {
        console.debug('fetchLists: saved_songs relational select error', savedError.message);
      }

      if (savedData && Array.isArray(savedData)) {
        const first = savedData[0];
        if (first && 'songs' in first) {
          setSavedSongs(savedData.map((r: any) => {
            const s = r.songs;
            return { id: s.id || s.song_id, title: s.title, artist: s.artist };
          }));
        } else if (first && ('song_id' in first || 'id' in first) && 'title' in first) {
          setSavedSongs((savedData as any[]).map(s => ({ id: s.song_id || s.id, title: s.title, artist: s.artist })));
        } else {
          console.debug('fetchLists: savedData unexpected shape, falling back to id-only fetch');
          const ids = (savedData as any[]).map((r: any) => r.song_id).filter(Boolean);
          if (ids.length === 0) setSavedSongs([]);
          else {
            const { data: songsData, error: songsErr } = await supabase
              .from('songs')
              .select('id, title, artist')
              .in('id', ids);
            if (songsErr) {
              console.error('Error fetching songs for saved ids:', songsErr.message);
              setSavedSongs([]);
            } else {
              setSavedSongs((songsData || []).map((s: any) => ({ id: s.id || s.song_id, title: s.title, artist: s.artist })));
            }
          }
        }
      } else if (savedError && savedError.message && savedError.message.includes('Could not find a relationship')) {
        console.debug('fetchLists: relationship missing for saved_songs, doing id fetch');
        const { data: savedRows, error: savedRowsErr } = await supabase
          .from('saved_songs')
          .select('song_id')
          .eq('user_id', userId);
        if (savedRowsErr) {
          console.error('Error fetching saved song ids:', savedRowsErr.message);
          setSavedSongs([]);
        } else {
          const ids = (savedRows || []).map((r: any) => r.song_id).filter(Boolean);
          if (ids.length === 0) setSavedSongs([]);
          else {
            const { data: songsData, error: songsErr } = await supabase
              .from('songs')
              .select('id, title, artist')
              .in('id', ids);
            if (songsErr) {
              console.error('Error fetching songs for saved ids:', songsErr.message);
              setSavedSongs([]);
            } else {
              setSavedSongs(songsData || []);
            }
          }
        }
      }

      console.debug('fetchLists: attempting relational select for learning_songs');
      const { data: learningData, error: learningError } = await supabase
        .from("learning_songs")
        .select("song_id, songs(id, title, artist)")
        .eq("user_id", userId);

      if (learningData && Array.isArray(learningData)) {
        const first = learningData[0];
        if (first && 'songs' in first) {
          setLearningSongs(learningData.map((r: any) => {
            const s = r.songs;
            return { id: s.id || s.song_id, title: s.title, artist: s.artist };
          }));
        } else if (first && ('song_id' in first || 'id' in first) && 'title' in first) {
          setLearningSongs((learningData as any[]).map(s => ({ id: s.id || s.song_id, title: s.title, artist: s.artist })));
        } else {
          const ids = (learningData as any[]).map((r: any) => r.song_id).filter(Boolean);
          if (ids.length === 0) setLearningSongs([]);
          else {
            const { data: songsData, error: songsErr } = await supabase
              .from('songs')
              .select('id, title, artist')
              .in('id', ids);
            if (songsErr) {
              console.error('Error fetching songs for learning ids:', songsErr.message);
              setLearningSongs([]);
            } else {
              setLearningSongs((songsData || []).map((s: any) => ({ id: s.id || s.song_id, title: s.title, artist: s.artist })));
            }
          }
        }
      } else if (learningError && learningError.message && learningError.message.includes('Could not find a relationship')) {
        console.debug('fetchLists: relationship missing for learning_songs, doing id fetch');
        const { data: learningRows, error: learningRowsErr } = await supabase
          .from('learning_songs')
          .select('song_id')
          .eq('user_id', userId);
        if (learningRowsErr) {
          console.error('Error fetching learning song ids:', learningRowsErr.message);
          setLearningSongs([]);
        } else {
          const ids = (learningRows || []).map((r: any) => r.song_id).filter(Boolean);
          if (ids.length === 0) setLearningSongs([]);
          else {
            const { data: songsData, error: songsErr } = await supabase
              .from('songs')
              .select('id, title, artist')
              .in('id', ids);
            if (songsErr) {
              console.error('Error fetching songs for learning ids:', songsErr.message);
              setLearningSongs([]);
            } else {
              setLearningSongs(songsData || []);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Unexpected error in fetchLists:', err?.message ?? err);
    }
  };

  useEffect(() => {
    if (user && user.id) fetchLists(user.id);
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoginError(error.message);
      setUser(null);
    } else {
      setUser(data.user ?? null);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setLoginError(error.message);
      setUser(null);
    } else {
      if (data?.user) {
        setUser(data.user);
      } else {
        setLoginError("Signup successful — please check your email to confirm your account.");
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSavedSongs([]);
    setLearningSongs([]);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (value.length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist")
      .ilike("title", `%${value}%`);
    if (error) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setResults(
      (data as any[] || []).map((song) => ({
        id: song.id || song.song_id,
        title: song.title,
        artist: song.artist,
      }))
    );
    setShowDropdown((data && data.length > 0) || false);
  };

  const handleSelect = (song: Song) => {
    setTitle(song.title);
    setShowDropdown(false);
  };

  const performImmediateAction = async (type: 'save' | 'learn', song: Song) => {
    if (!user?.id) { addToast('Please log in to perform this action.', 'info'); return; }
    if (!song?.id) { addToast('Song id missing — cannot complete action.', 'error'); return; }
    try {
      if (type === 'save') {
        if (savedSongs.find(s => s.id === song.id)) { addToast('Song already saved for later.', 'info'); return; }

        if (learningSongs.find(s => s.id === song.id)) {
          const { error: delErr } = await supabase.from('learning_songs').delete().match({ user_id: user.id, song_id: song.id });
          if (delErr) {
            addToast('Error moving song from My Songbook: ' + delErr.message, 'error');
            return;
          }
        }

        const { error } = await supabase.from('saved_songs').insert([{ user_id: user.id, song_id: song.id }]);
        if (error) addToast('Error saving song for later: ' + error.message, 'error');
        else { await fetchLists(user.id); addToast('Song saved for later!', 'success'); }
      } else {
        if (learningSongs.find(s => s.id === song.id)) { addToast('Song already in My Songbook.', 'info'); return; }

        if (savedSongs.find(s => s.id === song.id)) {
          const { error: delErr } = await supabase.from('saved_songs').delete().match({ user_id: user.id, song_id: song.id });
          if (delErr) {
            addToast('Error moving song from Saved: ' + delErr.message, 'error');
            return;
          }
        }

        const { error } = await supabase.from('learning_songs').insert([{ user_id: user.id, song_id: song.id }]);
        if (error) addToast('Error saving to My Songbook: ' + error.message, 'error');
        else { await fetchLists(user.id); addToast('Song was added to My Songbook!', 'success'); }
      }
    } catch (err: any) {
      console.error('Unexpected action error:', err);
      addToast('Unexpected error: ' + (err?.message ?? err), 'error');
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleInputFocus = () => {
    if (results && results.length > 0) setShowDropdown(true);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground mb-6">🎸 Songbook</h1>
          
          {!user ? (
            <div className="w-full bg-card rounded-2xl shadow-2xl p-8 border border-border">
              {showSignup ? (
                <form onSubmit={handleSignup} className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Create Account</h2>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="username"
                    className="h-12"
                    required
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="new-password"
                    className="h-12"
                    required
                  />
                  <Button type="submit" className="w-full h-12 text-lg">Sign Up</Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => { setShowSignup(false); setLoginError(null); }}>
                    Already have an account? Log in
                  </Button>
                  {loginError && <div className="text-destructive text-sm mt-2 p-3 bg-destructive/10 rounded-lg">{loginError}</div>}
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Welcome Back</h2>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="username"
                    className="h-12"
                    required
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="h-12"
                    required
                  />
                  <Button type="submit" className="w-full h-12 text-lg">Log In</Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowSignup(true)}>
                    Don't have an account? Sign up
                  </Button>
                  {loginError && <div className="text-destructive text-sm mt-2 p-3 bg-destructive/10 rounded-lg">{loginError}</div>}
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-card rounded-xl p-4 shadow-lg border border-border">
                <div className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">Log out</Button>
              </div>

              <div className="flex gap-2 bg-card rounded-xl p-2 shadow-lg border border-border">
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'search' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={() => setActiveTab('search')}
                >Search</button>
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'my' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={() => setActiveTab('my')}
                >My Songs</button>
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'saved' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={() => setActiveTab('saved')}
                >Saved</button>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-lg border border-border relative">
                {activeTab === 'search' && (
                  <div className="relative">
                    <Input
                      value={title}
                      onChange={handleChange}
                      onBlur={handleInputBlur}
                      onFocus={handleInputFocus}
                      placeholder="Search for songs..."
                      autoComplete="off"
                      className="h-14 text-lg pl-12 pr-4"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}

                {activeTab === 'my' && (
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">My Songbook</h3>
                    {learningSongs.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">No songs yet. Start searching!</div>
                    ) : (
                      <ul className="space-y-2">
                        {learningSongs.map((song) => (
                          <li key={song.id} className="flex items-center justify-between bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                              <div className="font-medium text-foreground">{song.title}</div>
                              <div className="text-sm text-muted-foreground">{song.artist}</div>
                        </div>
                            <button
                              className="text-xs px-3 py-1 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors font-medium"
                              aria-label="Remove learning song"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!user?.id) { addToast('Please log in to remove songs.', 'info'); return; }
                                if (!song.id) { addToast('Song id missing.', 'error'); return; }
                                const { error } = await supabase
                                  .from('learning_songs')
                                  .delete()
                                  .match({ user_id: user.id, song_id: song.id });
                                if (error) {
                                  addToast('Error removing learning song: ' + error.message, 'error');
                                } else {
                                  await fetchLists(user.id);
                                  addToast('Removed from My Songbook', 'success');
                                }
                              }}
                            >Remove</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {activeTab === 'saved' && (
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">Saved for Later</h3>
                    {savedSongs.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">No saved songs yet.</div>
                    ) : (
                      <ul className="space-y-2">
                        {savedSongs.map((song) => (
                          <li key={song.id} className="flex items-center justify-between bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                              <div className="font-medium text-foreground">{song.title}</div>
                              <div className="text-sm text-muted-foreground">{song.artist}</div>
                            </div>
                            <button
                              className="text-xs px-3 py-1 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors font-medium"
                              aria-label="Remove saved song"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!user?.id) { addToast('Please log in to remove songs.', 'info'); return; }
                                if (!song.id) { addToast('Song id missing.', 'error'); return; }
                                const { error } = await supabase
                                  .from('saved_songs')
                                  .delete()
                                  .match({ user_id: user.id, song_id: song.id });
                                if (error) {
                                  addToast('Error removing saved song: ' + error.message, 'error');
                                } else {
                                  await fetchLists(user.id);
                                  addToast('Removed from Saved', 'success');
                                }
                              }}
                            >Remove</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {showDropdown && (
          <div onMouseLeave={() => setShowDropdown(false)} className="absolute z-50 bg-card border border-border rounded-xl shadow-2xl w-full mt-2 max-h-80 overflow-auto">
            {results.map((song, idx) => (
              <div
                key={song.id || idx}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                onClick={() => handleSelect(song)}
              >
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{song.title}</div>
                  <div className="text-sm text-muted-foreground">{song.artist}</div>
                </div>
                <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                  {savedSongs.find(s => s.id === song.id) ? (
                    <span className="text-xs px-3 py-1.5 bg-secondary/20 text-secondary rounded-lg font-medium">Saved</span>
                  ) : (
                    <button
                      className="text-xs px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors font-medium"
                      title="Save for Later"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user?.id) { addToast('Please log in to save songs.', 'info'); return; }
                        if (!song.id) { addToast('Song id missing — please try again or refresh the list.', 'error'); return; }
                        performImmediateAction('save', song);
                      }}
                    >
                      Save
                    </button>
                  )}

                  {learningSongs.find(s => s.id === song.id) ? (
                    <span className="text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-lg font-medium">Learning</span>
                  ) : (
                    <button
                      className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                      title="Add to Songbook"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user?.id) { addToast('Please log in to save songs.', 'info'); return; }
                        if (!song.id) { addToast('Song id missing — please try again or refresh the list.', 'error'); return; }
                        performImmediateAction('learn', song);
                      }}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <div className="px-4 py-6 text-muted-foreground text-center">No songs found</div>
            )}
          </div>
        )}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={
                `px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm ${t.type === 'success' ? 'bg-green-500/90 text-white' : t.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary/90 text-white'}`
              }
            >
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

