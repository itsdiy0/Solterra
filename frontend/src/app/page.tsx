'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart,
  Github,
  ArrowRight,
  Calendar,
  Shield,
  Smartphone,
  GraduationCap
} from 'lucide-react';
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left Column - Title & Auth Links */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">ROSE</h1>
                  <p className="text-lg text-gray-600">Event Management System</p>
                </div>
              </div>

              <p className="text-xl text-gray-700 mb-8">
                Mobile cervical cancer screening event management platform for B40 communities
              </p>
            </div>

            {/* Auth Buttons */}
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold shadow-lg"
              >
                Participant Login
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                onClick={() => router.push('/admin/login')}
                variant="outline"
                className="w-full h-14 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-lg font-semibold"
              >
                Admin Portal
              </Button>
            </div>

            {/* Quick Features */}
            <div className="space-y-3 pt-6 border-t">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Multi-step booking with time slots</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>SMS notifications & OTP verification</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>PDPA-compliant secure results</span>
              </div>
            </div>
          </div>

          {/* Right Column - About Cards */}
          <div className="space-y-6">
            {/* About ROSE */}
            <Card className="border-emerald-200 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About ROSE Foundation</h2>
                <p className="text-gray-700 mb-4">
                  ROSE Foundation is a Malaysian NGO dedicated to providing mobile cervical cancer
                  screening services to B40 communities with limited access to healthcare facilities.
                </p>
                <p className="text-gray-700">
                  This platform streamlines event coordination, participant booking, and secure
                  medical results delivery—designed specifically for low-bandwidth environments
                  with SMS-first architecture.
                </p>
              </CardContent>
            </Card>

            {/* University Project Info */}
            <Card className="border-blue-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">University Project</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Developed for <strong>KV6014 Software Engineering</strong> module at{' '}
                  <strong>Northumbria University</strong> as a real-world group project addressing
                  genuine challenges in healthcare accessibility.
                </p>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 mb-2"><strong>Tech Stack:</strong></p>
                  <div className="flex flex-wrap gap-2">
                    {['FastAPI', 'Next.js', 'PostgreSQL', 'Twilio SMS', 'Google Maps', 'Cloudinary'].map(tech => (
                      <span key={tech} className="px-2 py-1 bg-white text-blue-700 rounded text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => window.open('https://github.com/itsdiy0/Solterra', '_blank')}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Github className="w-4 h-4 mr-2" />
                  View Source Code on GitHub
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer/>
    </div>
  );
}