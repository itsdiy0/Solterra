'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Clock, Users, Info, CreditCard, Smartphone } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Mock event data
  const event = {
    id: params.id,
    name: 'Klinik Desa Bagan',
    address: 'Klinik Desa Bagan, Selangor',
    postcode: '40540',
    date: 'Saturday 14th December',
    time: '09:00 - 13:00',
    capacity: { current: 40, total: 80 },
    eligibility: [
      'Aged 30-65 years',
      'Not menstruating heavily',
      'No hysterectomy',
      'No HPV test in last 5 years'
    ],
    whatToBring: [
      'MyKad (National ID)',
      'Mobile phone (to receive results via SMS)'
    ]
  };

  const capacityPercentage = (event.capacity.current / event.capacity.total) * 100;
  const slotsRemaining = event.capacity.total - event.capacity.current;

  const handleBooking = () => {
    if (!acceptedTerms) {
      alert('Please accept terms and conditions');
      return;
    }
    // TODO: Connect to booking API
    alert('Booking flow - will connect to API');
  };

  return (
    <DashboardLayout title="Book Event">
      <Card className="max-w-3xl">
        <CardContent className="p-6 space-y-6">
          {/* Event Header */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{event.name}</h2>
            
            {/* Location */}
            <div className="flex items-start gap-2 text-gray-700 mb-2">
              <MapPin className="w-5 h-5 mt-0.5 text-emerald-600" />
              <div>
                <p>{event.address}</p>
                <p className="text-sm text-gray-500">Postcode: {event.postcode}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>{event.date}</span>
              <span>•</span>
              <span>{event.time}</span>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Capacity:</span>
              <span className="text-sm font-medium">
                {slotsRemaining} of {event.capacity.total} slots remaining
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {event.capacity.current}/{event.capacity.total} booked
            </p>
          </div>

          {/* Eligibility */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              Eligibility:
            </h3>
            <div className="space-y-2">
              {event.eligibility.map((criteria, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-gray-400" />
                  <span className="text-sm">{criteria}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              *Not sure? Sign up first and we will review your application
            </p>
          </div>

          {/* What to Bring */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">What to bring:</h3>
            <div className="space-y-2">
              {event.whatToBring.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx === 0 ? <CreditCard className="w-5 h-5 text-gray-600" /> : <Smartphone className="w-5 h-5 text-gray-600" />}
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Accept terms and condition</h3>
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the terms and conditions
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleBooking}
              disabled={!acceptedTerms}
              className="flex-1 h-12 bg-rose-400 hover:bg-rose-500 text-white"
            >
              Book Now
            </Button>
            <Button
              onClick={() => alert('WhatsApp share coming soon')}
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600"
            >
              Share via WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}