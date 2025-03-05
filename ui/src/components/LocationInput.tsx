import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const LocationInput: React.FC<LocationInputProps> = ({ value, onChange, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Load Google Places API script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (inputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['(cities)'],
        });

        // Style the autocomplete dropdown
        const style = document.createElement('style');
        style.textContent = `
          .pac-container {
            background-color: white !important;
            border: 1px solid rgba(70, 139, 255, 0.1) !important;
            border-radius: 0.75rem !important;
            margin-top: 0.5rem !important;
            font-family: "Noto Sans", sans-serif !important;
            overflow: hidden !important;
            box-shadow: none !important;
          }
          .pac-item {
            padding: 0.875rem 1.25rem !important;
            cursor: pointer !important;
            transition: all 0.2s ease-in-out !important;
            border-bottom: 1px solid rgba(70, 139, 255, 0.05) !important;
          }
          .pac-item:last-child {
            border-bottom: none !important;
          }
          .pac-item:hover {
            background-color: rgba(70, 139, 255, 0.03) !important;
          }
          .pac-item-selected {
            background-color: rgba(70, 139, 255, 0.05) !important;
          }
          .pac-item-query {
            color: #1a365d !important;
            font-size: 0.9375rem !important;
            font-weight: 500 !important;
          }
          .pac-matched {
            font-weight: 600 !important;
          }
          .pac-item span:not(.pac-item-query) {
            color: #64748b !important;
            font-size: 0.8125rem !important;
            margin-left: 0.5rem !important;
          }
          /* Hide the location icon */
          .pac-icon {
            display: none !important;
          }
        `;
        document.head.appendChild(style);

        if (autocompleteRef.current) {
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.formatted_address) {
              onChange(place.formatted_address);
            }
          });
        }
      }
    };

    return () => {
      document.head.removeChild(script);
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-100/50 to-gray-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 stroke-[#468BFF] transition-all duration-200 group-hover:stroke-[#8FBCFA] z-10" strokeWidth={1.5} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        placeholder="City, Country"
      />
    </div>
  );
};

export default LocationInput; 