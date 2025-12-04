import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} YojanaAI. All rights reserved.</p>
            <p className="mt-2">Empowering citizens with government schemes.</p>
        </footer>
    );
}
