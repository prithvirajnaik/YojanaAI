import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col pt-16">

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
                <div className="max-w-3xl space-y-6">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-sm font-medium border border-blue-800 mb-4">
                        ✨ AI-Powered Government Scheme Assistant
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent pb-2">
                        Find the right scheme for you.
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Stop searching through endless documents. Just chat with YojanaAI to discover government schemes tailored to your profile.
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/chat"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition shadow-lg shadow-blue-900/20"
                        >
                            Get Started
                        </Link>
                        <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-semibold text-lg transition border border-gray-700">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="bg-gray-800/50 py-20 px-4">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon="🔍"
                        title="Smart Search"
                        desc="Our AI understands your profile and matches you with the most relevant schemes instantly."
                    />
                    <FeatureCard
                        icon="⚡"
                        title="Instant Eligibility"
                        desc="Know if you qualify immediately. No more guessing games or reading complex manuals."
                    />
                    <FeatureCard
                        icon="🇮🇳"
                        title="Pan-India Coverage"
                        desc="Access schemes from Central Government and various State Governments in one place."
                    />
                </div>
            </section>

        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-100">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}
