import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const Navbar = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Dropdown State
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                api.get(`/users/search?query=${searchQuery}`)
                    .then(res => {
                        setSearchResults(res.data);
                    })
                    .catch(err => console.error(err));
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <nav style={{ padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="text-cyan">Typeroo</span>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="nav-search">
                <input
                    type="text"
                    placeholder="Search for users..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                />
                {showResults && searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map(user => (
                            <div
                                key={user.id}
                                className="search-result-item"
                                onClick={() => {
                                    setSearchQuery("");
                                    setShowResults(false);
                                    // Navigate is optional if we use logic to close on click, Link handles nav
                                    navigate(`/profile/${user.username}`);
                                }}
                            >
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px' }}>{user.username.charAt(0).toUpperCase()}</span>}
                                </div>
                                <span>{user.username}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {currentUser ? (
                    <div className="user-dropdown" style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '1rem' }}
                        >
                            <span style={{ color: 'var(--primary-cyan)' }}>{currentUser.username}</span>
                            <span style={{ fontSize: '0.8rem' }}>▼</span>
                        </button>

                        {showDropdown && (
                            <div className="dropdown-menu">
                                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>Profile</Link>
                                <Link to="/settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>Settings</Link>
                                <div className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--error)' }}>Logout</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Removed independent Login link as requested, but keeping buttons for non-logged in users might be necessary? Recalling prompt: "Remove 'profile' and 'login' from the navbar" ... "keep the user's username" implies this is for logged in state. 
                           For logged out state, usually Login/Signup are still needed. 
                           "Remove 'profile' and 'login' from the navbar, and keep the user's username" -> "login" usually implies the Login link.
                           The user says "keep the user's username", which strictly implies logged in state.
                           If I remove 'login' for guests, how do they login? 
                           Maybe they mean remove the redundant 'Login' link if there is one? 
                           In the previous code:
                           Logged in: Type, Profile, Username, Logout.  -> User wants: Username Dropdown only (containing Profile, settings, logout).
                           Logged out: Login, SignUp. -> Should I remove Login? The prompt says "Remove 'profile' and 'login' from the navbar". 
                           Let's assume this applies to the Logged In state primarily, or maybe the 'Login' text link.
                           I will keep Login/Signup for guests because otherwise the app is unusable for new users.
                        */}
                        <Link to="/login" className="btn btn-ghost">Login</Link>
                        <Link to="/register" className="btn btn-primary">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
