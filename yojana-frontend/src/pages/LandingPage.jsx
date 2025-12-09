import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    const [statsVisible, setStatsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setStatsVisible(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-gray-100 flex flex-col pt-16 overflow-hidden">

            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Hero Section */}
            <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
                <div className="max-w-4xl space-y-8 animate-fade-in">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-900/40 to-purple-900/40 text-blue-300 text-sm font-medium border border-blue-700/50 backdrop-blur-sm animate-slide-down">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        AI-Powered Government Scheme Assistant
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-slide-up">
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Find the right
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                            scheme for you.
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up delay-100">
                        Stop searching through endless documents. Just chat with{' '}
                        <span className="text-blue-400 font-semibold">YojanaAI</span> to discover government schemes tailored to your profile.
                    </p>

                    {/* CTA Buttons */}
                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-200">
                        <Link
                            to="/chat"
                            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 hover:scale-105 transform"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Get Started
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </Link>

                        <a
                            href="#features"
                            className="px-8 py-4 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 rounded-xl font-semibold text-lg transition-all duration-300 border border-gray-700 hover:border-gray-600 backdrop-blur-sm"
                        >
                            Learn More
                        </a>
                    </div>

                    {/* Quick Example */}
                    {/* <div className="pt-8 animate-slide-up delay-300">
                        <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <ExampleChip text="I am a student from Delhi" />
                            <ExampleChip text="Farmer schemes in Karnataka" />
                            <ExampleChip text="Women entrepreneur programs" />
                        </div>
                    </div> */}
                </div>
            </section>

            {/* Stats Section */}
            {/* <section className="relative py-16 px-4 border-y border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    <StatCard number="3400+" label="Schemes" visible={statsVisible} delay={0} />
                    <StatCard number="29" label="States Covered" visible={statsVisible} delay={100} />
                    <StatCard number="AI" label="Powered Search" visible={statsVisible} delay={200} />
                    <StatCard number="100%" label="Free to Use" visible={statsVisible} delay={300} />
                </div>
            </section> */}

            {/* Features Grid */}
            <section id="features" className="relative py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Why Choose YojanaAI?
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Discover government schemes faster and smarter with our AI-powered platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                            title="Smart Search"
                            desc="Our AI understands your profile and matches you with the most relevant schemes instantly."
                            color="blue"
                        />
                        <FeatureCard
                            icon={
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            }
                            title="Instant Eligibility"
                            desc="Know if you qualify immediately. No more guessing games or reading complex manuals."
                            color="purple"
                        />
                        <FeatureCard
                            icon={
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                            title="Pan-India Coverage"
                            desc="Access schemes from Central Government and various State Governments in one place."
                            color="pink"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative py-20 px-4 bg-gray-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            How It Works
                        </h2>
                        <p className="text-gray-400 text-lg">Simple, fast, and intelligent</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <StepCard number="1" title="Describe Yourself" desc="Tell us about your age, location, income, and occupation in natural language." />
                        <StepCard number="2" title="Get Matches" desc="Our AI instantly finds schemes you're eligible for and ranks them by relevance." />
                        <StepCard number="3" title="Apply with Confidence" desc="View details, ask questions, and download PDFs with all the information you need." />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-3xl p-12 border border-blue-800/50 backdrop-blur-sm">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to discover your benefits?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Join thousands of Indians finding the right government schemes for their needs.
                        </p>
                        <Link
                            to="/chat"
                            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-xl transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 hover:scale-105 transform"
                        >
                            Start Exploring Now
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ExampleChip({ text }) {
    return (
        <span className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm rounded-full border border-gray-700 hover:border-gray-600 transition-all cursor-pointer backdrop-blur-sm">
            "{text}"
        </span>
    );
}

function StatCard({ number, label, visible, delay }) {
    return (
        <div
            className={`text-center transform transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {number}
            </div>
            <div className="text-gray-400 text-sm md:text-base font-medium">{label}</div>
        </div>
    );
}

function FeatureCard({ icon, title, desc, color }) {
    const colorClasses = {
        blue: 'from-blue-500/10 to-blue-600/10 border-blue-500/20 group-hover:border-blue-500/40',
        purple: 'from-purple-500/10 to-purple-600/10 border-purple-500/20 group-hover:border-purple-500/40',
        pink: 'from-pink-500/10 to-pink-600/10 border-pink-500/20 group-hover:border-pink-500/40'
    };

    const iconColorClasses = {
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        pink: 'text-pink-400'
    };

    return (
        <div className={`group p-8 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
            <div className={`${iconColorClasses[color]} mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-100">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}

function StepCard({ number, title, desc }) {
    return (
        <div className="relative">
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold mb-6 shadow-lg">
                    {number}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-100">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
            </div>
            {number !== "3" && (
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600/50 to-purple-600/50"></div>
            )}
        </div>
    );
}
