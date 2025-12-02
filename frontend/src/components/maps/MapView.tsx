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
  return (
    <div className="border rounded-lg overflow-hidden">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          style={{ width: '100%', height }}
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="event-location-map"
        >
          <AdvancedMarker 
            position={{ lat, lng }}
            title={title}
          />
        </Map>
      </APIProvider>
    </div>
  );
}