import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header className="flex-none p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-2xl"></span> YojanaAI
                </Link>

                <nav className="flex gap-6 text-sm font-medium text-gray-300">
                    <Link to="/" className="hover:text-white transition">Home</Link>
                    <Link to="/chat" className="hover:text-white transition">Chat</Link>
                    {/* <a href="#" className="hover:text-white transition">About</a> */}
                </nav>
            </div>
        </header>
    );
}
