import React, { useState, useContext, useEffect } from "react";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Separate states for different sections to avoid confusion
    const [themePreference, setThemePreference] = useState("dark");

    // Forms state
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [lastUsernameUpdate, setLastUsernameUpdate] = useState(null);

    // Store original values for comparison
    const [originalUsername, setOriginalUsername] = useState("");
    const [originalEmail, setOriginalEmail] = useState("");

    // Security verification
    const [currentPassword, setCurrentPassword] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (currentUser) {
            api.get("/users/profile").then(res => {
                const fetchedUsername = res.data.username || "";
                const fetchedEmail = res.data.email || "";
                setUsername(fetchedUsername);
                setEmail(fetchedEmail);
                setOriginalUsername(fetchedUsername);
                setOriginalEmail(fetchedEmail);
                setThemePreference(res.data.themePreference || "dark");
                setLastUsernameUpdate(res.data.lastUsernameUpdate);
            }).catch(err => console.error(err));
        }
    }, [currentUser]);

    const getUsernameChangeStatus = () => {
        if (!lastUsernameUpdate) {
            return { canChange: true, message: "Username change available" };
        }

        const lastUpdate = new Date(lastUsernameUpdate);
        const now = new Date();
        const nextAllowedDate = new Date(lastUpdate);
        nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1);

        if (now >= nextAllowedDate) {
            return { canChange: true, message: "Username change available" };
        }

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return {
            canChange: false,
            message: `You can change your username again on ${nextAllowedDate.toLocaleDateString('en-US', options)}`
        };
    };

    const usernameStatus = getUsernameChangeStatus();

    const handleThemeChange = async (e) => {
        const newTheme = e.target.value;
        setThemePreference(newTheme);
        // Apply immediately
        document.documentElement.setAttribute('data-theme', newTheme);

        try {
            // Update backend without requiring password for theme
            await api.post("/users/settings", { themePreference: newTheme });
        } catch (err) {
            console.error("Failed to save theme", err);
        }
    };

    const handleSaveSensitive = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (password && password !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        const payload = {
            currentPassword
        };

        if (username !== originalUsername) payload.username = username;
        if (email !== originalEmail) payload.email = email;
        if (password) payload.password = password;

        if (Object.keys(payload).length <= 1) {
            setError("No changes to save");
            return;
        }

        try {
            await api.post("/users/settings", payload);
            setMessage("Settings updated successfully. Logging out...");
            setTimeout(() => {
                logout();
                navigate("/login");
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred");
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account permanently? This action cannot be undone.")) {
            try {
                await api.delete("/users/me");
                logout();
                navigate("/");
            } catch (err) {
                setError(err.response?.data?.message || "Failed to delete account");
            }
        }
    };

    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
                <h2 style={{ marginBottom: '2rem', color: 'var(--text-main)' }}>Settings</h2>

                {message && <div style={{ background: 'rgba(0, 242, 234, 0.1)', color: 'var(--primary-cyan)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
                {error && <div style={{ background: 'rgba(255, 77, 77, 0.1)', color: 'var(--error)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

                <div style={{ display: 'grid', gap: '2rem' }}>

                    {/* Theme Section */}
                    <div style={{ background: 'var(--bg-dark-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Appearance</h3>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>Theme</label>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="dark"
                                        checked={themePreference === 'dark'}
                                        onChange={handleThemeChange}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                            accentColor: 'var(--primary-cyan)'
                                        }}
                                    />
                                    <span style={{ color: 'var(--text-main)' }}>Dark</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="light"
                                        checked={themePreference === 'light'}
                                        onChange={handleThemeChange}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                            accentColor: 'var(--primary-cyan)'
                                        }}
                                    />
                                    <span style={{ color: 'var(--text-main)' }}>Light</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="monkeytype"
                                        checked={themePreference === 'monkeytype'}
                                        onChange={handleThemeChange}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                            accentColor: '#e2b714'
                                        }}
                                    />
                                    <span style={{ color: 'var(--text-main)' }}>Monkeytype</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Account Security Section */}
                    <div style={{ background: 'var(--bg-dark-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Account & Security</h3>
                        <form onSubmit={handleSaveSensitive} style={{ display: 'grid', gap: '1.5rem' }}>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{ width: '100%' }}
                                    disabled={!usernameStatus.canChange}
                                />
                                <small style={{ color: usernameStatus.canChange ? 'var(--primary-cyan)' : 'var(--text-muted)' }}>
                                    {usernameStatus.message}
                                </small>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid var(--text-muted)', margin: '1rem 0' }}></div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank to keep current"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Retype new password"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginTop: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--primary-cyan-dim)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary-cyan)' }}>Current Password (Required for changes)</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter your current password to save changes"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                    marginTop: '1rem',
                                    opacity: !currentPassword ? 0.5 : 1,
                                    cursor: !currentPassword ? 'not-allowed' : 'pointer'
                                }}
                                disabled={!currentPassword}
                                title={!currentPassword ? "Please enter your current password to save changes" : "Save changes"}
                            >
                                Save Changes
                            </button>
                            {!currentPassword && (
                                <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                    ⚠ Enter your current password above to enable saving
                                </small>
                            )}
                        </form>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--text-muted)', paddingTop: '2rem' }}>
                        <h3 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Danger Zone</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
                        <button
                            onClick={handleDeleteAccount}
                            className="btn"
                            style={{ background: 'rgba(255, 77, 77, 0.1)', color: 'var(--error)', border: '1px solid var(--error)' }}
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;

