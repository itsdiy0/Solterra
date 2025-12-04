'use client';

import { useState, useCallback, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Locate } from 'lucide-react';

interface MapPickerProps {
  address: string;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({
  address,
  onAddressChange,
  onCoordinatesChange,
  initialLat = 3.139,
  initialLng = 101.6869,
}: MapPickerProps) {
  
  const initLat = typeof initialLat === 'number' ? initialLat : parseFloat(initialLat as any);
  const initLng = typeof initialLng === 'number' ? initialLng : parseFloat(initialLng as any);
  
  const [markerPosition, setMarkerPosition] = useState({ 
    lat: isNaN(initLat) ? 3.139 : initLat, 
    lng: isNaN(initLng) ? 101.6869 : initLng
  });
  const [searchInput, setSearchInput] = useState(address);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Get user's current location on mount (if no initial position set)
  useEffect(() => {
    if (initialLat === 3.139 && initialLng === 101.6869 && !address) {
      // Default coordinates, try to get user location
      getUserLocation();
    }
  }, []);

  useEffect(() => {
    if (address && address !== searchInput) {
      setSearchInput(address);
    }
  }, [address]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        onCoordinatesChange(lat, lng);
        reverseGeocode(lat, lng);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setGettingLocation(false);
        // Fallback to default KL coordinates
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleMapClick = useCallback((e: any) => {
    if (!e.detail?.latLng) return;

    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;

    setMarkerPosition({ lat, lng });
    onCoordinatesChange(lat, lng);
    reverseGeocode(lat, lng);
  }, [onCoordinatesChange]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();

      if (data.results && data.results[0]) {
        const newAddress = data.results[0].formatted_address;
        setSearchInput(newAddress);
        onAddressChange(newAddress);
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }
  }, [onAddressChange]);

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchInput)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();

      if (data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;

        setMarkerPosition({ lat: location.lat, lng: location.lng });
        onCoordinatesChange(location.lat, location.lng);
        onAddressChange(formattedAddress);
        setSearchInput(formattedAddress);
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    }
  }, [searchInput, onAddressChange, onCoordinatesChange]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter address or location..."
            className="pl-10 h-11 bg-white"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          className="bg-emerald-600 hover:bg-emerald-700 h-11"
        >
          Search
        </Button>
        <Button
          type="button"
          onClick={getUserLocation}
          disabled={gettingLocation}
          variant="outline"
          className="h-11"
          title="Use my current location"
        >
          <Locate className={`w-4 h-4 ${gettingLocation ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-gray-100">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
          <Map
            style={{ width: '100%', height: '400px' }}
            center={markerPosition}
            zoom={15}
            gestureHandling="greedy"
            onClick={handleMapClick}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
            reuseMaps={true}
            zoomControl={true}
            mapTypeControl={false}
            scaleControl={true}
            streetViewControl={false}
            rotateControl={false}
            fullscreenControl={true}
            scrollwheel={true}
            disableDoubleClickZoom={false}
            keyboardShortcuts={true}
          >
            <AdvancedMarker
              position={markerPosition}
              draggable={true}
              onDragEnd={(e: any) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setMarkerPosition({ lat, lng });
                  onCoordinatesChange(lat, lng);
                  reverseGeocode(lat, lng);
                }
              }}
            />
          </Map>
        </APIProvider>
      </div>

      <p className="text-xs text-gray-600 font-medium">
        📍 {address || 'No location selected'}
      </p>
    </div>
  );
}