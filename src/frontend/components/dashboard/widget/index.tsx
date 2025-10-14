"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TVNoise from "@/components/ui/tv-noise";
import type { WidgetData } from "@/types/dashboard";


interface WidgetProps {
  widgetData: WidgetData;
}

export default function Widget({ widgetData }: WidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState<string>('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);

    // Try to get user's location from geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Parse timezone for location name
            const locationParts = timezone.split('/');
            const city = locationParts[locationParts.length - 1].replace(/_/g, ' ');
            const region = locationParts.length > 1 ? locationParts[locationParts.length - 2] : '';
            setUserLocation(region ? `${city}, ${region}` : city);

            // Fetch weather data using Open-Meteo (free, no API key required)
            try {
              const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=celsius`
              );
              const weatherData = await weatherResponse.json();
              if (weatherData.current?.temperature_2m) {
                setTemperature(`${Math.round(weatherData.current.temperature_2m)}°C`);
              }
            } catch (error) {
              console.error('Error fetching weather:', error);
            }
          } catch (error) {
            console.error('Error getting location:', error);
            // Fallback to timezone
            const locationParts = timezone.split('/');
            const city = locationParts[locationParts.length - 1].replace(/_/g, ' ');
            setUserLocation(city);
          }
        },
        (error) => {
          console.warn('Geolocation not available:', error);
          // Fallback to timezone-based location
          const locationParts = timezone.split('/');
          const city = locationParts[locationParts.length - 1].replace(/_/g, ' ');
          setUserLocation(city);
        }
      );
    } else {
      // Fallback to timezone-based location
      const locationParts = timezone.split('/');
      const city = locationParts[locationParts.length - 1].replace(/_/g, ' ');
      setUserLocation(city);
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const restOfDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return { dayOfWeek, restOfDate };
  };

  const dateInfo = formatDate(currentTime);

  return (
    <Card className="w-full aspect-[2] relative overflow-hidden">
      <TVNoise opacity={0.3} intensity={0.2} speed={40} />
      <CardContent className="bg-accent/30 flex-1 flex flex-col justify-between text-sm font-medium uppercase relative z-20">
        <div className="flex justify-between items-center">
          <span className="opacity-50">{dateInfo.dayOfWeek}</span>
          <span>{dateInfo.restOfDate}</span>
        </div>
        <div className="text-center">
          <div className="text-5xl font-display" suppressHydrationWarning>
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="opacity-50">{temperature || widgetData.temperature}</span>
          <span>{userLocation || widgetData.location}</span>

          <Badge variant="secondary" className="bg-accent">
            {userTimezone || widgetData.timezone}
          </Badge>
        </div>

        <div className="absolute inset-0 -z-[1]">
          <img
            src="/assets/pc_blueprint.gif"
            alt="logo"
            className="size-full object-contain"
          />
        </div>
      </CardContent>
    </Card>
  );
}
