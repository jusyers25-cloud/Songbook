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
    <div className="p-4 space-y-4 relative" style={{ maxWidth: 400 }}>
      {!user ? (
        showSignup ? (
          <form onSubmit={handleSignup} className="space-y-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="username"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              required
            />
            <div className="flex items-center gap-2">
              <Button type="submit">Sign Up</Button>
              <Button type="button" onClick={() => { setShowSignup(false); setLoginError(null); }}>Back to Log In</Button>
            </div>
            {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="username"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
            <div className="flex items-center gap-2">
              <Button type="submit">Log In</Button>
              <Button type="button" onClick={() => { setEmail(''); setPassword(''); setLoginError(null); }}>Clear</Button>
            </div>
            <div className="text-sm">
              Don't have an account? <button type="button" className="text-blue-600 underline" onClick={() => setShowSignup(true)}>Sign up</button>
            </div>
            {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
          </form>
        )
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700">Logged in as: {user.email}</div>
            <Button variant="ghost" onClick={handleLogout}>Log out</Button>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              className={`px-3 py-1 rounded ${activeTab === 'search' ? 'bg-gray-200' : 'bg-white'}`}
              onClick={() => setActiveTab('search')}
            >Search</button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'my' ? 'bg-gray-200' : 'bg-white'}`}
              onClick={() => setActiveTab('my')}
            >My Songbook</button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'saved' ? 'bg-gray-200' : 'bg-white'}`}
              onClick={() => setActiveTab('saved')}
            >Saved</button>
          </div>

          <div className="mt-3">
            {activeTab === 'search' && (
              <>
                <Input
                  value={title}
                  onChange={handleChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  placeholder="Type a song name..."
                  autoComplete="off"
                />
              </>
            )}

            {activeTab === 'my' && (
              <div>
                {learningSongs.length === 0 ? (
                  <div className="text-gray-500">No songs in My Songbook.</div>
                ) : (
                  <ul className="list-disc ml-6 space-y-1">
                    {learningSongs.map((song) => (
                      <li key={song.id} className="flex items-center justify-between">
                        <div>
                          {song.title} <span className="text-gray-500">{song.artist}</span>
                        </div>
                        <button
                          className="text-xs px-2 py-0.5 bg-red-100 rounded hover:bg-red-200 w-6 h-6 flex items-center justify-center"
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
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {activeTab === 'saved' && (
              <div>
                {savedSongs.length === 0 ? (
                  <div className="text-gray-500">No songs in Saved.</div>
                ) : (
                  <ul className="list-disc ml-6 space-y-1">
                    {savedSongs.map((song) => (
                      <li key={song.id} className="flex items-center justify-between">
                        <div>
                          {song.title} <span className="text-gray-500">{song.artist}</span>
                        </div>
                        <button
                          className="text-xs px-2 py-0.5 bg-red-100 rounded hover:bg-red-200 w-6 h-6 flex items-center justify-center"
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
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </>
      )}
      {showDropdown && (
        <div onMouseLeave={() => setShowDropdown(false)} className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-60 overflow-auto">
          {results.map((song, idx) => (
            <div
              key={song.id || idx}
              className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(song)}
            >
              <div>
                <div className="font-semibold">{song.title}</div>
                <div className="text-sm text-gray-500">{song.artist}</div>
              </div>
              <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                {savedSongs.find(s => s.id === song.id) ? (
                  <span className="text-xs px-2 py-1 bg-blue-50 rounded text-blue-700">Saved</span>
                ) : (
                  <button
                    className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                    title="Save for Later"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user?.id) { addToast('Please log in to save songs.', 'info'); return; }
                      if (!song.id) { addToast('Song id missing — please try again or refresh the list.', 'error'); return; }
                      performImmediateAction('save', song);
                    }}
                  >
                    ☆
                  </button>
                )}

                {learningSongs.find(s => s.id === song.id) ? (
                  <span className="text-xs px-2 py-1 bg-green-50 rounded text-green-700">Learning</span>
                ) : (
                  <button
                    className="text-xs px-2 py-1 bg-green-100 rounded hover:bg-green-200"
                    title="Actively Learning"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user?.id) { addToast('Please log in to save songs.', 'info'); return; }
                      if (!song.id) { addToast('Song id missing — please try again or refresh the list.', 'error'); return; }
                      performImmediateAction('learn', song);
                    }}
                  >
                    ➤
                  </button>
                )}
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="px-4 py-2 text-gray-400">No songs found</div>
          )}
        </div>
      )}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `px-4 py-2 rounded shadow ${t.type === 'success' ? 'bg-green-100 text-green-800' : t.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
