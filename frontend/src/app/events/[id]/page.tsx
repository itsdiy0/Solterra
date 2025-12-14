'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Toast from '@/components/ui/toast';
import MapView from '@/components/maps/MapView';
import { 
  MapPin, 
  Clock, 
  Calendar,
  Users,
  CheckCircle,
  ChevronLeft,
  Info,
  Navigation,
  ArrowLeft
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
  event_code: string;
  address: string;
  event_date: string;
  event_time: string;
  total_slots: number;
  available_slots: number;
  additional_info: string;
  latitude: number | null;
  longitude: number | null;
  time_slots?: TimeSlot[];
}

interface TimeSlot {
  start: string;
  end: string;
  slots: number;
  available: number;
}

type BookingStep = 'details' | 'eligibility' | 'time-slot' | 'confirmation' | 'success';

interface EligibilityAnswers {
  age: boolean | null;
  menstruating: boolean | null;
  hysterectomy: boolean | null;
  hpv_test: boolean | null;
}

export default function EventBookingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [hasTimeSlots, setHasTimeSlots] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('details');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingReference, setBookingReference] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  const [eligibility, setEligibility] = useState<EligibilityAnswers>({
    age: null,
    menstruating: null,
    hysterectomy: null,
    hpv_test: null,
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  useEffect(() => {
    fetchEventAndTimeSlots();
    
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        if (payload.role === 'participant') {
          checkIfBooked(token);
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, [eventId]);

  const fetchEventAndTimeSlots = async () => {
    setLoading(true);
    try {
      const eventRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`);
      const eventData = await eventRes.json();
      setEvent(eventData);

      const slotsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/time-slots`);
      const slotsData = await slotsRes.json();
      
      setHasTimeSlots(slotsData.has_time_slots);
      setTimeSlots(slotsData.slots || []);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to load event',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfBooked = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const bookings = await res.json();
        const hasBooked = bookings.some((b: any) => b.event.id === eventId);
        setIsBooked(hasBooked);
      }
    } catch (err) {
      console.error('Error checking bookings:', err);
    }
  };

  const handleBooking = async () => {
    setBookingLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setToast({
          message: 'You must be logged in to book',
          type: 'error',
          show: true,
        });
        return;
      }

      const requestBody: any = { event_id: eventId };
      
      if (hasTimeSlots && selectedTimeSlot) {
        requestBody.time_slot_start = selectedTimeSlot.start;
        requestBody.time_slot_end = selectedTimeSlot.end;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to book event');
      }

      const data = await res.json();
      setBookingReference(data.booking.booking_reference);
      setIsBooked(true);
      setCurrentStep('success');
      
      setToast({
        message: 'Booking confirmed successfully!',
        type: 'success',
        show: true,
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Booking failed',
        type: 'error',
        show: true,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const canProceedFromEligibility = () => {
    return (
      eligibility.age !== null &&
      eligibility.menstruating !== null &&
      eligibility.hysterectomy !== null &&
      eligibility.hpv_test !== null
    );
  };

  const isEligible = () => {
    return (
      eligibility.age === true &&
      eligibility.menstruating === false &&
      eligibility.hysterectomy === false &&
      eligibility.hpv_test === false
    );
  };

  const getStepNumber = (step: BookingStep) => {
    const steps = hasTimeSlots 
      ? ['details', 'eligibility', 'time-slot', 'confirmation']
      : ['details', 'eligibility', 'confirmation'];
    return steps.indexOf(step) + 1;
  };

  const getTotalSteps = () => {
    return hasTimeSlots ? 4 : 3;
  };

  if (loading) {
    return (
      <DashboardLayout title="Book Event">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading event...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Book Event">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">Event not found</p>
              <Button
                onClick={() => router.push('/events')}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const capacityPercentage = ((event.total_slots - event.available_slots) / event.total_slots) * 100;

  return (
    <DashboardLayout title="Book Event">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => router.push('/events')}
          variant="outline"
          className="mb-4 border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        {/* Progress Indicator */}
        {userRole === 'participant' && !isBooked && currentStep !== 'success' && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2">
              {(hasTimeSlots 
                ? ['details', 'eligibility', 'time-slot', 'confirmation'] 
                : ['details', 'eligibility', 'confirmation']
              ).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      getStepNumber(currentStep) > index + 1
                        ? 'bg-emerald-500 text-white'
                        : currentStep === step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < getTotalSteps() - 1 && (
                    <div
                      className={`w-16 h-1 ${
                        getStepNumber(currentStep) > index + 1
                          ? 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-4">
              <span className="text-xs text-gray-600">Details</span>
              <span className="text-xs text-gray-600">Eligibility</span>
              {hasTimeSlots && <span className="text-xs text-gray-600">Time Slot</span>}
              <span className="text-xs text-gray-600">Confirm</span>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {/* Step 1: Event Details */}
            {currentStep === 'details' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">{event.name}</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{event.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-gray-900">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-gray-900">
                        {event.event_time.slice(0, 5)} - 16:00
                      </span>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Capacity:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {event.total_slots - event.available_slots} of {event.total_slots} booked
                        <span className="text-emerald-600 ml-2">
                          ({event.available_slots} spots left)
                        </span>
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${capacityPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Event Location Map */}
                  {event.latitude && event.longitude ? (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        Event Location
                      </h3>
                      <MapView 
                        lat={Number(event.latitude)}
                        lng={Number(event.longitude)} 
                        title={event.name}
                        height="300px"
                      />
                      <Button
                        type="button"
                        onClick={() => window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`, 
                          '_blank'
                        )}
                        variant="outline"
                        className="w-full mt-3 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-700">
                        📍 Location coordinates not available for this event
                      </p>
                    </div>
                  )}

                  {/* Eligibility Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Eligibility Criteria
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>Aged 30-65 years</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>Not menstruating heavily</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>No hysterectomy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>No HPV test in last 5 years</span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-3">
                      Not sure? Tap here for more info
                    </p>
                  </div>

                  {/* What to Bring */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">What to bring:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                          <span className="text-emerald-600 text-xs">📄</span>
                        </div>
                        <span>MyKad (National ID)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                          <span className="text-emerald-600 text-xs">📱</span>
                        </div>
                        <span>Mobile phone (to receive results via SMS)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {userRole === 'participant' && !isBooked && event.available_slots > 0 && (
                  <Button
                    onClick={() => setCurrentStep('eligibility')}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Continue to Eligibility Check
                  </Button>
                )}

                {isBooked && (
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                    <p className="text-gray-700 font-medium">You have already booked this event</p>
                    <Button
                      onClick={() => router.push('/bookings')}
                      className="mt-3 bg-emerald-600 hover:bg-emerald-700"
                    >
                      View My Bookings
                    </Button>
                  </div>
                )}

                {event.available_slots === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-700 font-medium">This event is fully booked</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Eligibility Questions */}
            {currentStep === 'eligibility' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setCurrentStep('details')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold">Eligibility Check</h2>
                </div>

                <div className="space-y-6">
                  {/* Age Question */}
                  <div className="space-y-3">
                    <p className="font-medium text-gray-900">Age 30-65?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEligibility({ ...eligibility, age: true })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.age === true
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setEligibility({ ...eligibility, age: false })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.age === false
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Menstruating Question */}
                  <div className="space-y-3">
                    <p className="font-medium text-gray-900">Currently menstruating?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEligibility({ ...eligibility, menstruating: true })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.menstruating === true
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setEligibility({ ...eligibility, menstruating: false })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.menstruating === false
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Hysterectomy Question */}
                  <div className="space-y-3">
                    <p className="font-medium text-gray-900">Had a hysterectomy?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEligibility({ ...eligibility, hysterectomy: true })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.hysterectomy === true
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setEligibility({ ...eligibility, hysterectomy: false })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.hysterectomy === false
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* HPV Test Question */}
                  <div className="space-y-3">
                    <p className="font-medium text-gray-900">HPV test in the last 5 years?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEligibility({ ...eligibility, hpv_test: true })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.hpv_test === true
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setEligibility({ ...eligibility, hpv_test: false })}
                        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
                          eligibility.hpv_test === false
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                {canProceedFromEligibility() && !isEligible() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Note:</strong> Based on your answers, you may not meet all eligibility criteria. 
                      You can still proceed, but please consult with staff at the event.
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => setCurrentStep(hasTimeSlots ? 'time-slot' : 'confirmation')}
                  disabled={!canProceedFromEligibility()}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 3: Time Slot Selection */}
            {currentStep === 'time-slot' && hasTimeSlots && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setCurrentStep('eligibility')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold">Select Time Slot</h2>
                </div>

                <div className="space-y-3">
                  {timeSlots.map((slot, index) => {
                    const isSelected = selectedTimeSlot?.start === slot.start && selectedTimeSlot?.end === slot.end;
                    const isFull = slot.available <= 0;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !isFull && setSelectedTimeSlot(slot)}
                        disabled={isFull}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          isFull
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">
                              {slot.start} - {slot.end}
                            </p>
                            <p className="text-sm text-gray-600">
                              {slot.available}/{slot.slots} slots available
                            </p>
                          </div>
                          {isSelected ? (
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          ) : isFull ? (
                            <span className="text-sm font-medium text-red-600">Full</span>
                          ) : (
                            <span className="text-sm font-medium text-emerald-600">Select</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setCurrentStep('confirmation')}
                  disabled={!selectedTimeSlot}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 'confirmation' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setCurrentStep(hasTimeSlots ? 'time-slot' : 'eligibility')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold">Confirm Booking</h2>
                </div>

                {/* Event Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event:</span>
                      <span className="font-medium text-gray-900">{event.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-gray-900">
                        {selectedTimeSlot 
                          ? `${selectedTimeSlot.start} - ${selectedTimeSlot.end}`
                          : event.event_time.slice(0, 5)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-gray-900 text-right">{event.address}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                      I accept the terms and conditions. I understand that I must bring my MyKad and mobile phone to the event. 
                      I will receive an SMS confirmation and test results via SMS.
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={!acceptedTerms || bookingLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Confirming...
                    </span>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </div>
            )}

            {/* Step 5: Success */}
            {currentStep === 'success' && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6">An SMS notification has been sent to your device</p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Booking Reference</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600">{bookingReference}</p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/bookings')}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    View My Bookings
                  </Button>
                  <Button
                    onClick={() => router.push('/events')}
                    variant="outline"
                    className="w-full h-12"
                  >
                    Back to Events
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}