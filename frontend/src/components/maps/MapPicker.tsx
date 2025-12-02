'use client';

import { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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
  const [markerPosition, setMarkerPosition] = useState({ 
    lat: initialLat, 
    lng: initialLng 
  });
  const [searchInput, setSearchInput] = useState(address);

  const handleMapClick = useCallback((e: any) => {
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    
    setMarkerPosition({ lat, lng });
    onCoordinatesChange(lat, lng);

    // Reverse geocode to get address
    reverseGeocode(lat, lng);
  }, [onCoordinatesChange]);

  const reverseGeocode = async (lat: number, lng: number) => {
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
  };

  const handleSearch = async () => {
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Search Location</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter address or location..."
              className="pl-10 h-11"
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Search
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Click on the map or search to set the event location
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
          <Map
            style={{ width: '100%', height: '400px' }}
            defaultCenter={markerPosition}
            center={markerPosition}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
          >
            <AdvancedMarker position={markerPosition} />
          </Map>
        </APIProvider>
      </div>

      <p className="text-xs text-gray-600">
        📍 Selected: {address || 'Click on map to select location'}
      </p>
    </div>
  );
}