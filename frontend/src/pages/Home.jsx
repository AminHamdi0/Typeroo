import React, { useContext } from "react";
import Navbar from "../components/Navbar";
import TypingTest from "../components/TypingTest";
import { AuthContext } from "../context/AuthContext";
import { Link, Navigate } from "react-router-dom";

const Home = () => {
    const { currentUser, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            <Navbar />
            <div className="container">
                <TypingTest />
            </div>
        </>
    );
};

export default Home;
