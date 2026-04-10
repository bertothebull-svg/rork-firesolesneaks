import createContextHook from "@nkzw/create-context-hook";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Platform } from "react-native";
import type { Season } from "../types/wardrobe";

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
}

export const [WeatherProvider, useWeather] = createContextHook(() => {
  const locationQuery = useQuery({
    queryKey: ["location"],
    queryFn: async () => {
      if (Platform.OS === "web") {
        console.log("[Location] Using web geolocation API...");
        return new Promise<{ coords: { latitude: number; longitude: number } }>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported on this browser"));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log("[Location] Web location:", position.coords.latitude, position.coords.longitude);
              resolve({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              });
            },
            (error) => {
              console.error("[Location] Web geolocation error:", error.message);
              reject(new Error("Location permission denied"));
            },
            { timeout: 10000, enableHighAccuracy: false }
          );
        });
      }

      const Location = await import("expo-location");
      console.log("[Location] Requesting permission...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        console.log("[Location] Permission denied");
        throw new Error("Location permission denied");
      }
      
      console.log("[Location] Getting current location...");
      const location = await Location.getCurrentPositionAsync({});
      console.log("[Location] Got location:", location.coords);
      return location;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const weatherQuery = useQuery({
    queryKey: ["weather", locationQuery.data],
    queryFn: async (): Promise<WeatherData> => {
      if (!locationQuery.data) {
        throw new Error("No location data");
      }

      const { latitude, longitude } = locationQuery.data.coords;
      
      console.log("[Weather] Fetching weather for:", latitude, longitude);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
      );
      
      if (!response.ok) {
        console.error("[Weather] API error:", response.status, response.statusText);
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[Weather] Invalid content type:", contentType);
        const text = await response.text();
        console.error("[Weather] Response text:", text);
        throw new Error("Weather API returned non-JSON response");
      }
      
      const data = await response.json();
      console.log("[Weather] Weather data:", data);
      
      if (!data.current || typeof data.current.temperature_2m === 'undefined') {
        console.error("[Weather] Invalid data structure:", data);
        throw new Error("Invalid weather data structure");
      }
      
      let locationName = "Unknown";
      try {
        if (Platform.OS !== "web") {
          const Location = await import("expo-location");
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          locationName = reverseGeocode[0]
            ? `${reverseGeocode[0].city || reverseGeocode[0].region || "Unknown"}`
            : "Unknown";
        } else {
          const geoResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`
          );
          const geoData = await geoResponse.json();
          locationName = geoData.timezone?.split('/').pop()?.replace(/_/g, ' ') || "Unknown";
        }
      } catch (geoError) {
        console.error("[Weather] Reverse geocode error:", geoError);
      }

      const weatherCode = data.current.weather_code;
      const condition = getWeatherCondition(weatherCode);

      return {
        temperature: Math.round(data.current.temperature_2m),
        condition,
        location: locationName,
      };
    },
    enabled: !!locationQuery.data,
    staleTime: 10 * 60 * 1000,
  });

  const currentSeason = useMemo((): Season => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }, []);

  const recommendedSeason = useMemo((): Season => {
    if (!weatherQuery.data) return currentSeason;
    
    const temp = weatherQuery.data.temperature;
    if (temp >= 75) return "summer";
    if (temp >= 60) return "spring";
    if (temp >= 45) return "fall";
    return "winter";
  }, [weatherQuery.data, currentSeason]);

  return useMemo(
    () => ({
      weather: weatherQuery.data,
      isLoading: locationQuery.isLoading || weatherQuery.isLoading,
      error: locationQuery.error || weatherQuery.error,
      currentSeason,
      recommendedSeason,
      hasWeatherData: !!weatherQuery.data,
    }),
    [
      weatherQuery.data,
      locationQuery.isLoading,
      weatherQuery.isLoading,
      locationQuery.error,
      weatherQuery.error,
      currentSeason,
      recommendedSeason,
    ]
  );
});

function getWeatherCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rainy";
  if (code <= 86) return "Snow";
  return "Stormy";
}
