import React, { createContext, useState, useEffect } from "react";
import AuthService from "../services/auth.service";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (currentUser?.themePreference) {
            document.documentElement.setAttribute('data-theme', currentUser.themePreference);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, [currentUser]);

    const login = async (username, password) => {
        try {
            const data = await AuthService.login(username, password);
            setCurrentUser(data);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        AuthService.logout();
        setCurrentUser(undefined);
    };

    const register = async (username, email, password) => {
        return AuthService.register(username, email, password);
    }

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
