import { useEffect, useMemo, useState } from 'react';
import { Cloud } from '@phosphor-icons/react/dist/csr/Cloud';
import { CloudFog } from '@phosphor-icons/react/dist/csr/CloudFog';
import { CloudLightning } from '@phosphor-icons/react/dist/csr/CloudLightning';
import { CloudMoon } from '@phosphor-icons/react/dist/csr/CloudMoon';
import { CloudRain } from '@phosphor-icons/react/dist/csr/CloudRain';
import { CloudSun } from '@phosphor-icons/react/dist/csr/CloudSun';
import { MoonStars } from '@phosphor-icons/react/dist/csr/MoonStars';
import { Sun } from '@phosphor-icons/react/dist/csr/Sun';

const MUMBAI_TIME_ZONE = 'Asia/Kolkata';
const WEATHER_REFRESH_MS = 15 * 60 * 1000;
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current=weather_code,cloud_cover,precipitation,is_day,temperature_2m&timezone=Asia%2FKolkata&forecast_days=1';

type MumbaiWeather = {
  weatherCode: number;
  cloudCover: number;
  precipitation: number;
  temperature: number;
};

type WeatherKind =
  | 'clear-day'
  | 'clear-night'
  | 'cloud-day'
  | 'cloud-night'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'storm';

type OpenMeteoResponse = {
  current?: {
    weather_code?: number;
    cloud_cover?: number;
    precipitation?: number;
    temperature_2m?: number;
  };
};

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: MUMBAI_TIME_ZONE,
  hour: '2-digit',
  hourCycle: 'h23',
});

function isRainCode(code: number) {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  );
}

function timeBasedFallback(hour: number) {
  if (hour < 5) return "One of Mumbai's darkest nights is passing quietly.";
  if (hour < 8) return 'Mumbai is waking beneath a soft monsoon dawn.';
  if (hour < 12) return 'A quiet monsoon morning is unfolding in Mumbai.';
  if (hour < 17) return 'A slightly overcast afternoon in Mumbai.';
  if (hour < 21) return 'Clouds are settling into the Mumbai evening.';
  return 'A deep monsoon night has settled over Mumbai.';
}

function weatherDescription(hour: number, weather: MumbaiWeather | null) {
  const isNight = hour < 6 || hour >= 20;
  if (!weather) {
    return {
      message: timeBasedFallback(hour),
      kind: isNight ? ('cloud-night' as const) : ('cloud-day' as const),
    };
  }

  const { weatherCode, cloudCover, precipitation } = weather;

  if (weatherCode >= 95) {
    return {
      message:
        hour < 18
          ? 'Thunder is rehearsing over Mumbai today.'
          : 'Thunder is moving through the Mumbai night.',
      kind: 'storm' as const,
    };
  }

  if (precipitation > 0 || isRainCode(weatherCode)) {
    let message = 'Monsoon rain is tracing the Mumbai night.';
    if (hour < 5) message = 'Monsoon rain is keeping Mumbai awake tonight.';
    else if (hour < 8) message = 'A rain-washed dawn is opening over Mumbai.';
    else if (hour < 12) message = 'A soft monsoon morning is passing through Mumbai.';
    else if (hour < 17) message = 'A rain-washed afternoon is passing through Mumbai.';
    else if (hour < 21) message = "Rain is settling into Mumbai's evening.";
    return { message, kind: 'rain' as const };
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return {
      message:
        hour < 12
          ? 'A misty morning is softening the edges of Mumbai.'
          : 'Mumbai is wearing a thin veil of mist.',
      kind: 'fog' as const,
    };
  }

  if (weatherCode >= 2 || cloudCover >= 55) {
    return {
      message: timeBasedFallback(hour),
      kind: isNight ? ('cloud-night' as const) : ('cloud-day' as const),
    };
  }

  let message = 'A clear night is resting over Mumbai.';
  if (hour < 5) message = 'Mumbai is unusually clear beneath the night sky.';
  else if (hour < 8) message = 'A clear dawn is opening above Mumbai.';
  else if (hour < 12) message = 'A bright morning has found Mumbai.';
  else if (hour < 17) message = 'A rare clear afternoon is holding over Mumbai.';
  else if (hour < 21) message = 'The Mumbai evening is clearing up.';
  return {
    message,
    kind: isNight ? ('clear-night' as const) : ('clear-day' as const),
  };
}

const weatherIcons: Record<WeatherKind, typeof Cloud> = {
  'clear-day': Sun,
  'clear-night': MoonStars,
  'cloud-day': CloudSun,
  'cloud-night': CloudMoon,
  cloud: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  storm: CloudLightning,
};

export default function MumbaiStatus() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<MumbaiWeather | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchWeather = async () => {
      try {
        const response = await fetch(WEATHER_URL, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) return;
        const data = (await response.json()) as OpenMeteoResponse;
        const current = data.current;

        if (
          current?.weather_code === undefined ||
          current.cloud_cover === undefined ||
          current.precipitation === undefined ||
          current.temperature_2m === undefined
        ) {
          return;
        }

        setWeather({
          weatherCode: current.weather_code,
          cloudCover: current.cloud_cover,
          precipitation: current.precipitation,
          temperature: current.temperature_2m,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    };

    void fetchWeather();
    const refreshTimer = window.setInterval(fetchWeather, WEATHER_REFRESH_MS);

    return () => {
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, []);

  const hour = Number(hourFormatter.format(now));
  const description = useMemo(
    () => weatherDescription(hour, weather),
    [hour, weather],
  );
  const WeatherIcon = weatherIcons[description.kind];
  const messageParts = description.message.split(/mumbai/i);
  const weatherDetails = weather
    ? `${Math.round(weather.temperature)}°C, ${weather.cloudCover}% cloud cover in Mumbai`
    : 'Current Mumbai weather is temporarily unavailable';

  return (
    <div className="weather-status" title={weatherDetails}>
      <div className="flex items-center gap-2">
        <WeatherIcon
          size={24}
          weight="regular"
          className="text-copy"
          aria-hidden="true"
        />
        <p className="weather-copy font-medium text-copy">
          {messageParts[0]}
          <span className="font-medium text-copy">Mumbai</span>
          {messageParts[1]}
        </p>
      </div>
    </div>
  );
}
