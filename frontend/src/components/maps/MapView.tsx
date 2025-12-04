'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface MapViewProps {
  lat: number;
  lng: number;
  title?: string;
  height?: string;
}

export default function MapView({ 
  lat, 
  lng, 
  title = 'Event Location',
  height = '300px'
}: MapViewProps) {

  const latitude = typeof lat === 'number' ? lat : parseFloat(lat as any);
  const longitude = typeof lng === 'number' ? lng : parseFloat(lng as any);

  if (isNaN(latitude) || isNaN(longitude)) {
    return (
      <div className="border rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">Map unavailable - invalid coordinates</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          style={{ width: '100%', height }}
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        >
          <AdvancedMarker 
            position={{ lat: latitude, lng: longitude }}
            title={title}
          />
        </Map>
      </APIProvider>
    </div>
  );
}