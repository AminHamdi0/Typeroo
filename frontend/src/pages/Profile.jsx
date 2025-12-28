import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const Profile = () => {
    const { currentUser } = useContext(AuthContext);
    const { username } = useParams(); // Get username from URL if present
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [stats, setStats] = useState(null);

    const isOwnProfile = !username || (currentUser && currentUser.username === username);

    useEffect(() => {
        fetchProfile();
        fetchStats();
        // Always try to fetch history. If it's another user, we need a public history endpoint.
        fetchHistory();
    }, [username, currentUser]);

    const fetchProfile = async () => {
        try {
            let res;
            if (username && username !== currentUser?.username) {
                res = await api.get(`/users/${username}`);
            } else {
                res = await api.get("/users/profile");
            }
            setProfile(res.data);
            setBio(res.data.bio || "");
            setAvatarUrl(res.data.avatarUrl || "");
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStats = async () => {
        try {
            // Need a username to fetch stats. If own profile, use currentUser.username (if available) or wait for profile
            const targetUser = username || currentUser?.username;
            if (targetUser) {
                const res = await api.get(`/tests/stats?username=${targetUser}`);
                setStats(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchHistory = async () => {
        try {
            let res;
            if (username && username !== currentUser?.username) {
                res = await api.get(`/tests/user-history?username=${username}`);
            } else {
                res = await api.get("/tests/history");
            }
            setHistory(res.data.content);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadAvatar = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await api.post("/users/upload-avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            // Backend returns { message: "url" }
            setAvatarUrl(res.data.message);
            setSelectedFile(null);
            alert("Avatar uploaded! Remember to click Save Profile to update your bio if changed.");
        } catch (err) {
            console.error(err);
            alert("Failed to upload avatar.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.post("/users/profile", { bio, avatarUrl });
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '2rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                    {/* Wrapping Grid for larger screens */}
                    <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 2.5fr' : '1fr', gap: '2rem' }}>

                        {/* Profile Card */}
                        <div style={{ background: 'var(--bg-dark-secondary)', padding: '2rem', borderRadius: '8px', height: 'fit-content' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-dark)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--text-muted)', overflow: 'hidden', border: '3px solid var(--bg-dark-tertiary)' }}>
                                    {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile?.username?.charAt(0).toUpperCase()}
                                </div>
                                <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-cyan)', marginBottom: '0.5rem' }}>{profile?.username}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Joined: {new Date(profile?.joinedAt).toLocaleDateString()}</p>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Total Completed Tests: {profile?.totalTests}</p>
                            </div>

                            {/* Stats - Best WPM Performance */}
                            {stats && (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1rem', textAlign: 'center' }}>Best WPM Performance</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>10s</div>
                                            <div style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{Math.round(stats.maxWpm10)}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>30s</div>
                                            <div style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{Math.round(stats.maxWpm30)}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>60s</div>
                                            <div style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{Math.round(stats.maxWpm60)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '2rem' }}>
                                {isEditing && isOwnProfile ? (
                                    <div style={{ display: 'grid', gap: '1.2rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Update Avatar</label>

                                            {/* Preview of the new avatar if uploaded or URL provided */}
                                            {avatarUrl && (
                                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-dark)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--primary-cyan)' }}>
                                                        <img src={avatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <small style={{ color: 'var(--primary-cyan)', fontSize: '0.7rem' }}>Preview</small>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px' }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                                                    id="avatar-upload"
                                                />
                                                {selectedFile && (
                                                    <button
                                                        type="button"
                                                        onClick={handleUploadAvatar}
                                                        className="btn btn-primary"
                                                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
                                                        disabled={uploading}
                                                    >
                                                        {uploading ? '⌛ Uploading...' : '⬆️ Upload Selected File'}
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ marginTop: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Direct Image URL</label>
                                                <input
                                                    type="text"
                                                    value={avatarUrl}
                                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                                    style={{ width: '100%', fontSize: '0.9rem' }}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>

                                        <form onSubmit={handleUpdateProfile}>
                                            <div style={{ marginBottom: '1.2rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bio</label>
                                                <textarea
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    style={{ width: '100%', minHeight: '100px', background: 'var(--bg-dark)', border: '1px solid var(--bg-dark-tertiary)', color: 'var(--text-main)', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}
                                                    placeholder="Tell the world who you are..."
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.8rem' }}>✅ Save Profile</button>
                                                <button type="button" onClick={() => { setIsEditing(false); setSelectedFile(null); }} className="btn btn-ghost" style={{ flex: 1, border: '1px solid var(--text-muted)', padding: '0.8rem' }}>❌ Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.8rem', fontSize: '1.1rem' }}>Bio</h3>
                                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{profile?.bio || "No bio yet."}</p>
                                        {isOwnProfile && (
                                            <button onClick={() => setIsEditing(true)} className="btn btn-ghost" style={{ marginTop: '1.5rem', width: '100%', border: '1px solid var(--text-muted)' }}>Edit Profile</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Test Results Section */}
                        <div>
                            {/* Best Test Highlight */}
                            {history.length > 0 && (
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        🏆 Best Performance
                                    </h3>
                                    {(() => {
                                        const best = [...history].sort((a, b) => b.wpm - a.wpm)[0];
                                        return (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr',
                                                background: 'linear-gradient(135deg, var(--bg-dark-secondary) 0%, var(--bg-dark-tertiary) 100%)',
                                                padding: '1.5rem',
                                                borderRadius: '12px',
                                                alignItems: 'center',
                                                border: '1px solid var(--primary-cyan-dim)',
                                                boxShadow: '0 0 15px var(--primary-cyan-transparent)'
                                            }}>
                                                <div style={{ color: 'var(--primary-cyan)', fontWeight: 'bold', fontSize: '1.8rem' }}>{Math.round(best.wpm)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>wpm</span></div>
                                                <div style={{ color: 'var(--text-main)', fontSize: '1.2rem' }}>{Math.round(best.accuracy)}% <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>acc</span></div>
                                                <div style={{ color: 'var(--text-secondary)' }}>{best.duration}s <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{best.mode}</span></div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(best.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{best.correctChars}/{best.incorrectChars}</div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Recent Tests</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {history.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>No tests taken yet.</div>
                                ) : (
                                    history.map(test => (
                                        <div key={test.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr', background: 'var(--bg-dark-secondary)', padding: '1.2rem', borderRadius: '8px', alignItems: 'center', transition: 'transform 0.2s' }} className="history-card">
                                            <div style={{ color: 'var(--primary-cyan)', fontWeight: 'bold', fontSize: '1.4rem' }}>{Math.round(test.wpm)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>wpm</span></div>
                                            <div style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{Math.round(test.accuracy)}% <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>acc</span></div>
                                            <div style={{ color: 'var(--text-secondary)' }}>{test.duration}s <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{test.mode === 'custom' ? 'custom' : 'mode'}</span></div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(test.timestamp).toLocaleDateString()}</div>
                                            <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{test.correctChars}/{test.incorrectChars}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
                <style>{`
                    .history-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                `}</style>
            </div>
        </>
    );
};

export default Profile;
