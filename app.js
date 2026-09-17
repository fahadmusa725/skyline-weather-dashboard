/**
 * SKYLINE — Real-Time Weather Intelligence Dashboard
 * Open-Meteo Integration with Condition-Adaptive Theming & Data Visualizations
 */

(function () {
  'use strict';

  // =========================================================================
  // APP STATE & CONFIGURATION
  // =========================================================================
  const STATE = {
    unit: localStorage.getItem('skyline_unit') || 'c', // 'c' or 'f'
    currentLocation: {
      name: 'London',
      country: 'United Kingdom',
      countryCode: 'GB',
      lat: 51.5074,
      lon: -0.1278,
      timezone: 'Europe/London'
    },
    weatherData: null,
    recentCities: JSON.parse(localStorage.getItem('skyline_recent_cities') || '[]'),
    isLoading: false,
    viewMode: 'sparkline' // 'sparkline' or 'cards'
  };

  // Weather Code Mapping & Atmospheric Condition Matrix
  const WMO_MAP = {
    0: { label: 'Clear Sky', category: 'clear', icon: 'sun', phrase: 'Optimal visibility under pristine clear sky' },
    1: { label: 'Mainly Clear', category: 'clear', icon: 'sun-cloud', phrase: 'Scattered light patches with abundant sunshine' },
    2: { label: 'Partly Cloudy', category: 'clouds', icon: 'partly-cloudy', phrase: 'Moderate cloud cover with sunny intervals' },
    3: { label: 'Overcast', category: 'clouds', icon: 'cloudy', phrase: 'Dense blanket of cloud cover across the horizon' },
    45: { label: 'Fog', category: 'fog', icon: 'fog', phrase: 'Reduced visibility due to dense surface fog' },
    48: { label: 'Depositing Rime Fog', category: 'fog', icon: 'fog', phrase: 'Sub-zero freezing mist creating rime ice' },
    51: { label: 'Light Drizzle', category: 'rain', icon: 'drizzle', phrase: 'Intermittent fine misty precipitation' },
    53: { label: 'Moderate Drizzle', category: 'rain', icon: 'drizzle', phrase: 'Steady fine drizzle wetting surfaces' },
    55: { label: 'Dense Drizzle', category: 'rain', icon: 'rain', phrase: 'Heavy misty drizzle with low visibility' },
    56: { label: 'Light Freezing Drizzle', category: 'snow', icon: 'snow', phrase: 'Freezing mist causing slippery glazed roads' },
    57: { label: 'Dense Freezing Drizzle', category: 'snow', icon: 'snow', phrase: 'Hazardous icy glaze from heavy freezing drizzle' },
    61: { label: 'Slight Rain', category: 'rain', icon: 'rain', phrase: 'Gentle showers with mild atmospheric moisture' },
    63: { label: 'Moderate Rain', category: 'rain', icon: 'rain', phrase: 'Sustained rainfall with cool downdrafts' },
    65: { label: 'Heavy Rain', category: 'rain', icon: 'heavy-rain', phrase: 'High-intensity precipitation downpour' },
    66: { label: 'Light Freezing Rain', category: 'snow', icon: 'snow', phrase: 'Sub-zero liquid rain freezing on impact' },
    67: { label: 'Heavy Freezing Rain', category: 'snow', icon: 'snow', phrase: 'Severe freezing deluge and ice accumulation' },
    71: { label: 'Slight Snow Fall', category: 'snow', icon: 'snow', phrase: 'Gentle flurries descending with light coverage' },
    73: { label: 'Moderate Snow Fall', category: 'snow', icon: 'snow', phrase: 'Steady snowfall accumulating across surfaces' },
    75: { label: 'Heavy Snow Fall', category: 'snow', icon: 'heavy-snow', phrase: 'Intense snow squalls with rapid accumulation' },
    77: { label: 'Snow Grains', category: 'snow', icon: 'snow', phrase: 'Opaque ice pellets drifting on cold air currents' },
    80: { label: 'Slight Showers', category: 'rain', icon: 'rain', phrase: 'Brief localized rain bursts' },
    81: { label: 'Moderate Showers', category: 'rain', icon: 'rain', phrase: 'Passing convective rain showers' },
    82: { label: 'Violent Showers', category: 'rain', icon: 'heavy-rain', phrase: 'Torrential convective rain squall' },
    85: { label: 'Slight Snow Showers', category: 'snow', icon: 'snow', phrase: 'Passing snow flurries with brisk gusts' },
    86: { label: 'Heavy Snow Showers', category: 'snow', icon: 'heavy-snow', phrase: 'Sudden intense snow squalls' },
    95: { label: 'Thunderstorm', category: 'storm', icon: 'storm', phrase: 'Active lightning telemetry with gust front' },
    96: { label: 'Thunderstorm with Hail', category: 'storm', icon: 'storm-hail', phrase: 'Severe convective storm with hail cores' },
    99: { label: 'Severe Thunderstorm', category: 'storm', icon: 'storm-hail', phrase: 'Intense electrical activity, torrential rain & hail' }
  };

  // =========================================================================
  // DOM ELEMENT SELECTORS
  // =========================================================================
  const DOM = {
    html: document.documentElement,
    citySearchInput: document.getElementById('citySearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchContainer: document.getElementById('searchContainer'),
    autocompleteDropdown: document.getElementById('autocompleteDropdown'),
    autocompleteList: document.getElementById('autocompleteList'),
    geoBtn: document.getElementById('geoBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    unitCelsius: document.getElementById('unitCelsius'),
    unitFahrenheit: document.getElementById('unitFahrenheit'),
    notificationBanner: document.getElementById('notificationBanner'),
    bannerTitle: document.getElementById('bannerTitle'),
    bannerMessage: document.getElementById('bannerMessage'),
    bannerClose: document.getElementById('bannerClose'),
    quickPillsList: document.getElementById('quickPillsList'),
    recentPillsContainer: document.getElementById('recentPillsContainer'),
    skeletonView: document.getElementById('skeletonView'),
    weatherContent: document.getElementById('weatherContent'),
    
    // Hero Elements
    cityName: document.getElementById('cityName'),
    countryTag: document.getElementById('countryTag'),
    localTime: document.getElementById('localTime'),
    timezoneBadge: document.getElementById('timezoneBadge'),
    conditionChip: document.getElementById('conditionChip'),
    conditionName: document.getElementById('conditionName'),
    currentTemp: document.getElementById('currentTemp'),
    displayUnit: document.getElementById('displayUnit'),
    feelsLikeTemp: document.getElementById('feelsLikeTemp'),
    highLowRange: document.getElementById('highLowRange'),
    heroIconContainer: document.getElementById('heroIconContainer'),
    summaryPhrase: document.getElementById('summaryPhrase'),
    telemetryHumidity: document.getElementById('telemetryHumidity'),
    telemetryWind: document.getElementById('telemetryWind'),
    telemetryUV: document.getElementById('telemetryUV'),
    telemetryPressure: document.getElementById('telemetryPressure'),
    
    // Atmospheric Grid Elements
    sunDaylightDuration: document.getElementById('sunDaylightDuration'),
    sunriseTime: document.getElementById('sunriseTime'),
    sunsetTime: document.getElementById('sunsetTime'),
    sunStatusText: document.getElementById('sunStatusText'),
    sunProgressPath: document.getElementById('sunProgressPath'),
    sunPointIndicator: document.getElementById('sunPointIndicator'),
    
    windBeaufortScale: document.getElementById('windBeaufortScale'),
    compassNeedle: document.getElementById('compassNeedle'),
    windSpeedValue: document.getElementById('windSpeedValue'),
    windSpeedUnit: document.getElementById('windSpeedUnit'),
    windGustsValue: document.getElementById('windGustsValue'),
    windGustsUnit: document.getElementById('windGustsUnit'),
    windDirectionDeg: document.getElementById('windDirectionDeg'),
    
    precipSumBadge: document.getElementById('precipSumBadge'),
    precipProbability: document.getElementById('precipProbability'),
    precipProbBar: document.getElementById('precipProbBar'),
    dewPointVal: document.getElementById('dewPointVal'),
    surfacePressureVal: document.getElementById('surfacePressureVal'),
    visibilityVal: document.getElementById('visibilityVal'),
    
    briefingText: document.getElementById('briefingText'),
    copyBriefingBtn: document.getElementById('copyBriefingBtn'),
    dataTimestamp: document.getElementById('dataTimestamp'),
    
    // Hourly & Sparkline
    viewToggleSparkline: document.getElementById('viewToggleSparkline'),
    viewToggleCards: document.getElementById('viewToggleCards'),
    sparklineContainer: document.getElementById('sparklineContainer'),
    hourlySparklineSvg: document.getElementById('hourlySparklineSvg'),
    chartTooltip: document.getElementById('chartTooltip'),
    tooltipTime: document.getElementById('tooltipTime'),
    tooltipTemp: document.getElementById('tooltipTemp'),
    tooltipDetail: document.getElementById('tooltipDetail'),
    hourlyScrollStrip: document.getElementById('hourlyScrollStrip'),
    
    // Daily Outlook
    dailyCardsGrid: document.getElementById('dailyCardsGrid')
  };

  // =========================================================================
  // SVG WEATHER ICONS GENERATOR
  // Clean, consistent, ultra-crisp line stroke icons
  // =========================================================================
  function getSvgIcon(iconName, isDay = 1) {
    const isNight = isDay === 0;

    switch (iconName) {
      case 'sun':
        if (isNight) {
          return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
            <path d="M42 27.5A16.5 16.5 0 1 1 20.5 6 13 13 0 0 0 42 27.5Z" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="36" cy="12" r="1.5" fill="#FEF08A"/>
            <circle cx="28" cy="8" r="1" fill="#FEF08A"/>
          </svg>`;
        }
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <circle cx="24" cy="24" r="9" stroke="#F59E0B" stroke-width="3" fill="rgba(245, 158, 11, 0.15)"/>
          <line x1="24" y1="5" x2="24" y2="10" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="24" y1="38" x2="24" y2="43" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="5" y1="24" x2="10" y2="24" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="38" y1="24" x2="43" y2="24" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="34" y1="34" x2="37.5" y2="37.5" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="10.5" y1="37.5" x2="14" y2="34" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="34" y1="14" x2="37.5" y2="10.5" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`;

      case 'sun-cloud':
      case 'partly-cloudy':
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <path d="M19 19 A 7 7 0 1 1 29 12" stroke="${isNight ? '#38BDF8' : '#F59E0B'}" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M33 38H15a9 9 0 0 1-1.3-17.9A11 11 0 0 1 34.5 19 8 8 0 0 1 33 38Z" stroke="#E2E8F0" stroke-width="2.5" fill="rgba(255, 255, 255, 0.05)" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      case 'cloudy':
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <path d="M35 37H13a8 8 0 0 1-1.1-15.9A10 10 0 0 1 31.5 18 7.5 7.5 0 0 1 35 37Z" stroke="#94A3B8" stroke-width="2.5" fill="rgba(148, 163, 184, 0.1)" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 23a5 5 0 0 1 9.5-2.2" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>
        </svg>`;

      case 'rain':
      case 'drizzle':
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <path d="M34 29H14a7 7 0 0 1-1-13.9A9 9 0 0 1 30.5 13 6.5 6.5 0 0 1 34 29Z" stroke="#94A3B8" stroke-width="2.5" fill="rgba(148, 163, 184, 0.08)" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="16" y1="34" x2="13" y2="41" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="24" y1="34" x2="21" y2="41" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="32" y1="34" x2="29" y2="41" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;

      case 'heavy-rain':
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <path d="M35 27H13a7.5 7.5 0 0 1-1-14.9A9.5 9.5 0 0 1 31.5 10 7 7 0 0 1 35 27Z" stroke="#64748B" stroke-width="2.5" fill="rgba(56, 189, 248, 0.12)" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="14" y1="32" x2="10" y2="42" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="22" y1="32" x2="18" y2="42" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="30" y1="32" x2="26" y2="42" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="38" y1="32" x2="34" y2="42" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`;

      case 'storm':
      case 'storm-hail':
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <path d="M34 25H14a7 7 0 0 1-1-13.9A9 9 0 0 1 30.5 9 6.5 6.5 0 0 1 34 25Z" stroke="#94A3B8" stroke-width="2.2" fill="rgba(168, 85, 247, 0.1)" stroke-linecap="round" stroke-linejoin="round"/>
          <polygon points="25 24 18 34 24 34 21 44 31 32 25 32 28 24" fill="#FBBF24" stroke="#F59E0B" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;

      case 'snow':
      case 'heavy-snow':
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <path d="M34 26H14a7 7 0 0 1-1-13.9A9 9 0 0 1 30.5 10 6.5 6.5 0 0 1 34 26Z" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="16" cy="34" r="1.5" fill="#BAE6FD"/>
          <circle cx="24" cy="38" r="1.5" fill="#BAE6FD"/>
          <circle cx="32" cy="34" r="1.5" fill="#BAE6FD"/>
          <circle cx="20" cy="43" r="1.2" fill="#BAE6FD"/>
          <circle cx="28" cy="43" r="1.2" fill="#BAE6FD"/>
        </svg>`;

      case 'fog':
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <line x1="10" y1="18" x2="38" y2="18" stroke="#2DD4BF" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="6" y1="24" x2="42" y2="24" stroke="#5EEAD4" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="12" y1="30" x2="36" y2="30" stroke="#2DD4BF" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="16" y1="36" x2="32" y2="36" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;

      default:
        return `<svg viewBox="0 0 48 48" fill="none" class="weather-svg-icon" stroke="currentColor">
          <circle cx="24" cy="24" r="10" stroke="#38BDF8" stroke-width="2.5"/>
        </svg>`;
    }
  }

  // =========================================================================
  // UNIT CONVERSION UTILITIES
  // =========================================================================
  function formatTemp(celsiusVal) {
    if (celsiusVal === undefined || celsiusVal === null || isNaN(celsiusVal)) return '--';
    if (STATE.unit === 'f') {
      const fahrenheit = (celsiusVal * 9) / 5 + 32;
      return Math.round(fahrenheit);
    }
    return Math.round(celsiusVal);
  }

  function formatWind(kmhVal) {
    if (kmhVal === undefined || kmhVal === null || isNaN(kmhVal)) return { value: '--', unit: 'km/h' };
    if (STATE.unit === 'f') {
      const mph = kmhVal * 0.621371;
      return { value: mph.toFixed(1), unit: 'mph' };
    }
    return { value: kmhVal.toFixed(1), unit: 'km/h' };
  }

  function getWindDirection(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return `${deg}° ${directions[idx]}`;
  }

  function getBeaufortScale(kmh) {
    if (kmh < 1) return 'Force 0 Calm';
    if (kmh < 6) return 'Force 1 Light Air';
    if (kmh < 12) return 'Force 2 Light Breeze';
    if (kmh < 20) return 'Force 3 Gentle';
    if (kmh < 29) return 'Force 4 Moderate';
    if (kmh < 39) return 'Force 5 Fresh Breeze';
    if (kmh < 50) return 'Force 6 Strong Breeze';
    if (kmh < 62) return 'Force 7 Near Gale';
    if (kmh < 75) return 'Force 8 Gale';
    return 'Force 9+ Severe Gale';
  }

  function getUVRating(uv) {
    if (uv <= 2) return `${uv} (Low)`;
    if (uv <= 5) return `${uv} (Moderate)`;
    if (uv <= 7) return `${uv} (High)`;
    if (uv <= 10) return `${uv} (Very High)`;
    return `${uv} (Extreme)`;
  }

  // =========================================================================
  // WEATHER API & DATA FETCHING
  // =========================================================================
  async function fetchWeatherData(lat, lon, locationInfo = null) {
    setLoadingState(true);
    hideNotification();

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability,apparent_temperature,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,wind_speed_10m_max&timezone=auto`;

    try {
      const response = await fetch(forecastUrl);
      if (!response.ok) {
        throw new Error(`Weather telemetry server returned error (${response.status})`);
      }
      const data = await response.json();
      
      STATE.weatherData = data;
      if (locationInfo) {
        STATE.currentLocation = { ...STATE.currentLocation, ...locationInfo };
        saveRecentCity(STATE.currentLocation);
      }

      renderAllWeatherViews();
      setLoadingState(false);
    } catch (err) {
      console.error('Weather fetch failed:', err);
      setLoadingState(false);
      showNotification('Telemetry Connection Error', `Failed to load data for ${locationInfo ? locationInfo.name : 'location'}. Please verify network connection.`, true);
    }
  }

  // Search Geocoding API
  async function searchGeocoding(cityName) {
    if (!cityName || !cityName.trim()) return [];
    const query = encodeURIComponent(cityName.trim());
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=6&language=en&format=json`;

    try {
      const response = await fetch(geoUrl);
      if (!response.ok) throw new Error('Geocoding service unavailable');
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      console.warn('Geocoding search failed:', err);
      return [];
    }
  }

  // =========================================================================
  // RENDERING LOGIC
  // =========================================================================
  function renderAllWeatherViews() {
    if (!STATE.weatherData) return;

    const data = STATE.weatherData;
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    // 1. Determine Condition and apply Dynamic Theme
    const wCode = current.weather_code;
    const condition = WMO_MAP[wCode] || { label: 'Clear Sky', category: 'clear', icon: 'sun', phrase: 'Clear skies' };
    
    // Apply Mood Theme to root html
    let themeClass = 'theme-default';
    if (condition.category === 'clear') themeClass = 'theme-clear';
    else if (condition.category === 'rain') themeClass = 'theme-rain';
    else if (condition.category === 'storm') themeClass = 'theme-storm';
    else if (condition.category === 'snow') themeClass = 'theme-snow';
    else if (condition.category === 'clouds') themeClass = 'theme-clouds';
    else if (condition.category === 'fog') themeClass = 'theme-fog';
    DOM.html.setAttribute('data-theme', themeClass);

    // 2. Render Hero Card
    DOM.cityName.textContent = STATE.currentLocation.name;
    DOM.countryTag.textContent = STATE.currentLocation.countryCode || (STATE.currentLocation.country ? STATE.currentLocation.country.slice(0, 2).toUpperCase() : 'LOC');
    
    // Format Time using timezone
    const now = new Date();
    const timeOptions = { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: data.timezone };
    DOM.localTime.textContent = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
    DOM.timezoneBadge.textContent = data.timezone_abbreviation || data.timezone.split('/').pop().replace('_', ' ');

    DOM.conditionName.textContent = condition.label;
    DOM.currentTemp.textContent = formatTemp(current.temperature_2m);
    DOM.displayUnit.textContent = STATE.unit.toUpperCase();
    DOM.feelsLikeTemp.textContent = `${formatTemp(current.apparent_temperature)}°`;
    DOM.highLowRange.textContent = `${formatTemp(daily.temperature_2m_max[0])}° / ${formatTemp(daily.temperature_2m_min[0])}°`;

    DOM.heroIconContainer.innerHTML = getSvgIcon(condition.icon, current.is_day);
    DOM.summaryPhrase.textContent = condition.phrase;

    DOM.telemetryHumidity.textContent = `${current.relative_humidity_2m}%`;
    const windInfo = formatWind(current.wind_speed_10m);
    DOM.telemetryWind.textContent = `${windInfo.value} ${windInfo.unit}`;
    
    const todayUV = daily.uv_index_max ? daily.uv_index_max[0] : 4;
    DOM.telemetryUV.textContent = getUVRating(todayUV);
    DOM.telemetryPressure.textContent = `${Math.round(current.surface_pressure)} hPa`;

    // 3. Render Sun Arc Progression
    const sunriseStr = daily.sunrise[0];
    const sunsetStr = daily.sunset[0];
    if (sunriseStr && sunsetStr) {
      const sunriseDate = new Date(sunriseStr);
      const sunsetDate = new Date(sunsetStr);
      const sunriseFormatted = sunriseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const sunsetFormatted = sunsetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      DOM.sunriseTime.textContent = sunriseFormatted;
      DOM.sunsetTime.textContent = sunsetFormatted;

      const totalDaylightMs = sunsetDate - sunriseDate;
      const daylightHours = Math.floor(totalDaylightMs / (1000 * 60 * 60));
      const daylightMins = Math.floor((totalDaylightMs % (1000 * 60 * 60)) / (1000 * 60));
      DOM.sunDaylightDuration.textContent = `${daylightHours}h ${daylightMins}m`;

      // Calculate progress percentage
      const currentTimeMs = now.getTime();
      let sunPercent = 0;
      if (currentTimeMs < sunriseDate.getTime()) {
        sunPercent = 0;
        DOM.sunStatusText.textContent = `Sunrise in ${Math.round((sunriseDate - currentTimeMs) / (1000 * 60))}m`;
      } else if (currentTimeMs > sunsetDate.getTime()) {
        sunPercent = 100;
        DOM.sunStatusText.textContent = `Sunset occurred`;
      } else {
        sunPercent = ((currentTimeMs - sunriseDate.getTime()) / totalDaylightMs) * 100;
        const minsToSunset = Math.round((sunsetDate - currentTimeMs) / (1000 * 60));
        DOM.sunStatusText.textContent = `${Math.floor(minsToSunset / 60)}h ${minsToSunset % 60}m until sunset`;
      }

      // SVG Arc Dash calculation (Arc length ~251px)
      const maxOffset = 251;
      const progressOffset = maxOffset - (maxOffset * (sunPercent / 100));
      DOM.sunProgressPath.style.strokeDashoffset = progressOffset;

      // Position Indicator on the semicircular arc: x = 100 + 80*cos(pi*(1-p)), y = 90 - 80*sin(pi*p)
      const angle = Math.PI * (sunPercent / 100);
      const indicatorX = (100 - 80 * Math.cos(angle)) / 200 * 100;
      const indicatorY = (90 - 75 * Math.sin(angle));
      DOM.sunPointIndicator.style.left = `${indicatorX}%`;
      DOM.sunPointIndicator.style.top = `${indicatorY}%`;
    }

    // 4. Render Wind Velocity & Compass
    const windDeg = current.wind_direction_10m || 0;
    DOM.compassNeedle.style.transform = `rotate(${windDeg}deg)`;
    DOM.windBeaufortScale.textContent = getBeaufortScale(current.wind_speed_10m);
    DOM.windSpeedValue.innerHTML = `${windInfo.value} <small id="windSpeedUnit">${windInfo.unit}</small>`;
    
    const peakGustKmh = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[0] : current.wind_speed_10m * 1.3;
    const gustInfo = formatWind(peakGustKmh);
    DOM.windGustsValue.innerHTML = `${gustInfo.value} <small id="windGustsUnit">${gustInfo.unit}</small>`;
    DOM.windDirectionDeg.textContent = getWindDirection(windDeg);

    // 5. Precipitation Insight & Dew Point
    const precipSum = daily.precipitation_sum ? daily.precipitation_sum[0] : 0;
    DOM.precipSumBadge.textContent = `${precipSum.toFixed(1)} mm`;

    const currentHourIdx = findCurrentHourIndex(hourly.time);
    const rainChance = hourly.precipitation_probability ? hourly.precipitation_probability[currentHourIdx] : 0;
    DOM.precipProbability.textContent = `${rainChance}%`;
    DOM.precipProbBar.style.width = `${Math.max(5, Math.min(100, rainChance))}%`;

    // Approximate Dew Point: T - ((100 - RH)/5)
    const dewPointC = current.temperature_2m - ((100 - current.relative_humidity_2m) / 5);
    DOM.dewPointVal.textContent = `${formatTemp(dewPointC)}°${STATE.unit.toUpperCase()}`;
    DOM.surfacePressureVal.textContent = `${Math.round(current.surface_pressure)} hPa`;
    DOM.visibilityVal.textContent = '10.0+ km';

    // 6. Data Briefing Text
    const unitSymbol = `°${STATE.unit.toUpperCase()}`;
    const brief = `${STATE.currentLocation.name} is currently experiencing ${formatTemp(current.temperature_2m)}${unitSymbol} (${condition.label.toLowerCase()}) with ${current.relative_humidity_2m}% humidity. Today will peak at ${formatTemp(daily.temperature_2m_max[0])}${unitSymbol} with ${getBeaufortScale(current.wind_speed_10m).toLowerCase()}.`;
    DOM.briefingText.textContent = brief;
    DOM.dataTimestamp.textContent = `Synced ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // 7. Render Hourly Sparkline & Timeline Cards
    renderHourlyViews(hourly, currentHourIdx);

    // 8. Render 7-Day Forecast Grid
    renderDailyForecast(daily);
  }

  // Find nearest current hour index in hourly array
  function findCurrentHourIndex(timeArray) {
    if (!timeArray || !timeArray.length) return 0;
    const nowIsoHour = new Date().toISOString().slice(0, 13);
    const idx = timeArray.findIndex(t => t.startsWith(nowIsoHour));
    return idx >= 0 ? idx : 0;
  }

  // =========================================================================
  // HOURLY FORECAST & SPARKLINE CHART
  // =========================================================================
  function renderHourlyViews(hourly, currentIdx) {
    const next24Temps = [];
    const next24Hours = [];
    const next24Codes = [];
    const next24Pops = [];

    const startIdx = currentIdx;
    const endIdx = Math.min(startIdx + 24, hourly.time.length);

    for (let i = startIdx; i < endIdx; i++) {
      next24Temps.push(hourly.temperature_2m[i]);
      next24Hours.push(hourly.time[i]);
      next24Codes.push(hourly.weather_code[i]);
      next24Pops.push(hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0);
    }

    // Render Cards in Horizontal Scroll
    let cardsHtml = '';
    next24Hours.forEach((timeStr, idx) => {
      const date = new Date(timeStr);
      const timeLabel = idx === 0 ? 'Now' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const wCode = next24Codes[idx];
      const cond = WMO_MAP[wCode] || { label: 'Clear', icon: 'sun' };
      const temp = formatTemp(next24Temps[idx]);
      const pop = next24Pops[idx];
      const isNight = date.getHours() < 6 || date.getHours() > 20 ? 0 : 1;

      cardsHtml += `
        <div class="hourly-card ${idx === 0 ? 'current-hour' : ''}">
          <span class="h-time">${timeLabel}</span>
          <div class="h-icon-box">
            ${getSvgIcon(cond.icon, isNight)}
          </div>
          <span class="h-temp">${temp}°</span>
          <span class="h-pop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 10px; height: 10px;"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
            ${pop}%
          </span>
        </div>
      `;
    });
    DOM.hourlyScrollStrip.innerHTML = cardsHtml;

    // Draw SVG Sparkline Chart
    drawHourlySparkline(next24Temps, next24Hours, next24Pops, next24Codes);
  }

  function drawHourlySparkline(temps, hours, pops, codes) {
    if (!temps || temps.length < 2) return;

    const svgWidth = 900;
    const svgHeight = 160;
    const padding = { top: 30, right: 35, bottom: 35, left: 35 };
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;

    const minTemp = Math.min(...temps) - 1;
    const maxTemp = Math.max(...temps) + 1;
    const tempRange = Math.max(1, maxTemp - minTemp);

    const stepX = chartWidth / (temps.length - 1);

    const points = temps.map((t, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartHeight - ((t - minTemp) / tempRange) * chartHeight;
      return { x, y, temp: t, time: hours[i], pop: pops[i], code: codes[i] };
    });

    // Build smooth bezier path string
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Build area fill path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding.bottom} L ${points[0].x} ${svgHeight - padding.bottom} Z`;

    // Generate SVG Elements
    let svgInner = `
      <defs>
        <linearGradient id="sparklineAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="var(--accent-1)" stop-opacity="0.35"/>
          <stop offset="70%" stop-color="var(--accent-2)" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="var(--accent-3)" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="sparklineLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--accent-1)"/>
          <stop offset="50%" stop-color="var(--accent-2)"/>
          <stop offset="100%" stop-color="var(--accent-3)"/>
        </linearGradient>
      </defs>

      <!-- Baseline Grid & Labels -->
      <line x1="${padding.left}" y1="${svgHeight - padding.bottom}" x2="${svgWidth - padding.right}" y2="${svgHeight - padding.bottom}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
      
      <!-- Area Fill -->
      <path d="${areaD}" fill="url(#sparklineAreaGrad)" />
      
      <!-- Stroke Path -->
      <path d="${pathD}" fill="none" stroke="url(#sparklineLineGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 8px var(--accent-glow))" />
    `;

    // Add nodes, labels, and interactive hover targets
    points.forEach((pt, i) => {
      // Time label on bottom every 3rd step or key step
      if (i % 3 === 0 || i === points.length - 1) {
        const d = new Date(pt.time);
        const label = i === 0 ? 'Now' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        svgInner += `<text x="${pt.x}" y="${svgHeight - 12}" fill="#64748B" font-size="11" font-family="JetBrains Mono" text-anchor="middle">${label}</text>`;
      }

      // Temp value above point on key steps
      if (i % 3 === 0 || i === 0) {
        svgInner += `<text x="${pt.x}" y="${pt.y - 12}" fill="#F8FAFC" font-size="12" font-weight="700" font-family="JetBrains Mono" text-anchor="middle">${formatTemp(pt.temp)}°</text>`;
      }

      // Point circle
      svgInner += `
        <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="#070A0F" stroke="var(--accent-1)" stroke-width="2.5" class="chart-point" data-index="${i}" />
      `;
    });

    DOM.hourlySparklineSvg.innerHTML = svgInner;

    // Attach hover listeners to SVG
    attachSparklineInteractivity(points);
  }

  function attachSparklineInteractivity(points) {
    const svg = DOM.hourlySparklineSvg;
    
    svg.onmousemove = (e) => {
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 900;

      // Find closest point
      let closest = points[0];
      let minDist = Infinity;
      points.forEach(p => {
        const dist = Math.abs(p.x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      });

      if (closest) {
        const date = new Date(closest.time);
        const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const cond = WMO_MAP[closest.code] || { label: 'Clear' };

        DOM.tooltipTime.textContent = `${timeLabel} • ${cond.label}`;
        DOM.tooltipTemp.textContent = `${formatTemp(closest.temp)}°${STATE.unit.toUpperCase()}`;
        DOM.tooltipDetail.textContent = `${closest.pop}% Rain Chance`;

        const leftPercent = (closest.x / 900) * 100;
        DOM.chartTooltip.style.left = `${leftPercent}%`;
        DOM.chartTooltip.style.top = `${Math.max(5, (closest.y / 160) * 100 - 45)}%`;
        DOM.chartTooltip.classList.remove('hidden');
      }
    };

    svg.onmouseleave = () => {
      DOM.chartTooltip.classList.add('hidden');
    };
  }

  // =========================================================================
  // 7-DAY EXTENDED FORECAST
  // =========================================================================
  function renderDailyForecast(daily) {
    if (!daily || !daily.time) return;

    let html = '';
    const daysCount = Math.min(7, daily.time.length);

    // Find min and max across the entire 7 days for uniform relative range bars
    const globalMin = Math.min(...daily.temperature_2m_min.slice(0, daysCount));
    const globalMax = Math.max(...daily.temperature_2m_max.slice(0, daysCount));
    const globalRange = Math.max(1, globalMax - globalMin);

    for (let i = 0; i < daysCount; i++) {
      const date = new Date(daily.time[i]);
      const isToday = i === 0;
      const dayName = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const wCode = daily.weather_code[i];
      const cond = WMO_MAP[wCode] || { label: 'Clear', icon: 'sun' };
      const maxT = daily.temperature_2m_max[i];
      const minT = daily.temperature_2m_min[i];
      const precipSum = daily.precipitation_sum ? daily.precipitation_sum[i] : 0;

      // Calculate bar fill position & width
      const barLeft = ((minT - globalMin) / globalRange) * 100;
      const barWidth = Math.max(15, ((maxT - minT) / globalRange) * 100);

      html += `
        <div class="daily-card ${isToday ? 'today' : ''}">
          <span class="d-day-name">${dayName}</span>
          <span class="d-date">${dateFormatted}</span>
          
          <div class="d-icon-box">
            ${getSvgIcon(cond.icon, 1)}
          </div>
          
          <span class="d-condition-label">${cond.label}</span>
          
          <div class="d-temp-range">
            <div class="d-temps-row">
              <span class="d-high">${formatTemp(maxT)}°</span>
              <span class="d-low">${formatTemp(minT)}°</span>
            </div>
            <div class="d-temp-bar">
              <div class="d-bar-fill" style="left: ${barLeft}%; width: ${barWidth}%;"></div>
            </div>
          </div>

          <span class="d-precip-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 11px; height: 11px;"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
            ${precipSum > 0 ? precipSum.toFixed(1) + ' mm' : '0 mm'}
          </span>
        </div>
      `;
    }

    DOM.dailyCardsGrid.innerHTML = html;
  }

  // =========================================================================
  // SEARCH AUTOCOMPLETE & EVENTS
  // =========================================================================
  let debounceTimeout = null;

  function initSearchHandlers() {
    DOM.citySearchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.length > 0) {
        DOM.clearSearchBtn.classList.remove('hidden');
      } else {
        DOM.clearSearchBtn.classList.add('hidden');
        DOM.autocompleteDropdown.classList.add('hidden');
        return;
      }

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        if (val.length >= 2) {
          const results = await searchGeocoding(val);
          renderAutocomplete(results);
        }
      }, 250);
    });

    DOM.citySearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = DOM.citySearchInput.value.trim();
        if (query) {
          DOM.autocompleteDropdown.classList.add('hidden');
          searchAndSelectFirstCity(query);
        }
      } else if (e.key === 'Escape') {
        DOM.autocompleteDropdown.classList.add('hidden');
      }
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.citySearchInput.value = '';
      DOM.clearSearchBtn.classList.add('hidden');
      DOM.autocompleteDropdown.classList.add('hidden');
      DOM.citySearchInput.focus();
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
      if (!DOM.searchContainer.contains(e.target)) {
        DOM.autocompleteDropdown.classList.add('hidden');
      }
    });
  }

  function renderAutocomplete(results) {
    if (!results || !results.length) {
      DOM.autocompleteList.innerHTML = `
        <div style="padding: 10px; color: var(--text-muted); font-size: 12px; text-align: center;">
          No matching cities found. Check spelling.
        </div>
      `;
      DOM.autocompleteDropdown.classList.remove('hidden');
      return;
    }

    let html = '';
    results.forEach(res => {
      const adminName = res.admin1 ? `${res.admin1}, ` : '';
      const country = res.country || '';
      const flagCode = res.country_code ? res.country_code.toUpperCase() : '';

      html += `
        <div class="autocomplete-item" data-name="${res.name}" data-country="${country}" data-code="${flagCode}" data-lat="${res.latitude}" data-lon="${res.longitude}" data-tz="${res.timezone || 'auto'}">
          <div style="display: flex; flex-direction: column;">
            <span class="auto-city-name">${res.name}</span>
            <span class="auto-country">${adminName}${country}</span>
          </div>
          <span class="auto-coords">${flagCode} • ${res.latitude.toFixed(1)}°, ${res.longitude.toFixed(1)}°</span>
        </div>
      `;
    });

    DOM.autocompleteList.innerHTML = html;
    DOM.autocompleteDropdown.classList.remove('hidden');

    // Attach click event to items
    DOM.autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        const locationInfo = {
          name: item.getAttribute('data-name'),
          country: item.getAttribute('data-country'),
          countryCode: item.getAttribute('data-code'),
          lat: parseFloat(item.getAttribute('data-lat')),
          lon: parseFloat(item.getAttribute('data-lon')),
          timezone: item.getAttribute('data-tz')
        };
        DOM.citySearchInput.value = locationInfo.name;
        DOM.autocompleteDropdown.classList.add('hidden');
        DOM.clearSearchBtn.classList.remove('hidden');
        fetchWeatherData(locationInfo.lat, locationInfo.lon, locationInfo);
      });
    });
  }

  async function searchAndSelectFirstCity(query) {
    setLoadingState(true);
    const results = await searchGeocoding(query);
    if (results && results.length > 0) {
      const first = results[0];
      const loc = {
        name: first.name,
        country: first.country || '',
        countryCode: first.country_code ? first.country_code.toUpperCase() : 'LOC',
        lat: first.latitude,
        lon: first.longitude,
        timezone: first.timezone || 'auto'
      };
      fetchWeatherData(loc.lat, loc.lon, loc);
    } else {
      setLoadingState(false);
      showNotification('Location Not Found', `No geocoding match found for "${query}". Try another city name.`, true);
    }
  }

  // =========================================================================
  // GEOLOCATION & QUICK HUBS
  // =========================================================================
  function initGeolocation() {
    DOM.geoBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showNotification('Geolocation Unsupported', 'Your browser does not support automatic location detection.', true);
        return;
      }

      DOM.geoBtn.classList.add('loading');
      setLoadingState(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          DOM.geoBtn.classList.remove('loading');
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Reverse Geocoding attempt via Open-Meteo or fallback name
          const loc = {
            name: 'Local Coordinates',
            country: 'My Device',
            countryCode: 'GPS',
            lat: lat,
            lon: lon,
            timezone: 'auto'
          };

          // Try reverse lookup from BigDataCloud or Open-Meteo
          try {
            const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            if (revRes.ok) {
              const revData = await revRes.json();
              if (revData.city || revData.locality) {
                loc.name = revData.city || revData.locality;
                loc.country = revData.countryName || '';
                loc.countryCode = revData.countryCode || 'GPS';
              }
            }
          } catch (e) {
            console.warn('Reverse geocode lookup skipped', e);
          }

          DOM.citySearchInput.value = loc.name;
          fetchWeatherData(lat, lon, loc);
        },
        (error) => {
          DOM.geoBtn.classList.remove('loading');
          setLoadingState(false);
          let msg = 'Could not access device location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow location access in browser settings.';
          }
          showNotification('Location Access Denied', msg, true);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  function initQuickPills() {
    DOM.quickPillsList.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const loc = {
          name: btn.getAttribute('data-city'),
          country: btn.getAttribute('data-country'),
          countryCode: btn.getAttribute('data-city').slice(0, 2).toUpperCase(),
          lat: parseFloat(btn.getAttribute('data-lat')),
          lon: parseFloat(btn.getAttribute('data-lon')),
          timezone: 'auto'
        };
        DOM.citySearchInput.value = loc.name;
        DOM.clearSearchBtn.classList.remove('hidden');
        fetchWeatherData(loc.lat, loc.lon, loc);
      });
    });
  }

  // =========================================================================
  // RECENT SEARCHES IN LOCALSTORAGE
  // =========================================================================
  function saveRecentCity(loc) {
    if (!loc || !loc.name) return;
    let recents = STATE.recentCities.filter(c => c.name.toLowerCase() !== loc.name.toLowerCase());
    recents.unshift({
      name: loc.name,
      country: loc.country,
      countryCode: loc.countryCode,
      lat: loc.lat,
      lon: loc.lon
    });
    recents = recents.slice(0, 5); // Keep top 5
    STATE.recentCities = recents;
    localStorage.setItem('skyline_recent_cities', JSON.stringify(recents));
    renderRecentPills();
  }

  function renderRecentPills() {
    if (!STATE.recentCities || !STATE.recentCities.length) {
      DOM.recentPillsContainer.innerHTML = '';
      return;
    }

    let html = '<span class="quick-nav-label recent-badge-tag">Recent:</span>';
    STATE.recentCities.forEach(c => {
      html += `
        <button class="pill-btn recent-pill" data-city="${c.name}" data-country="${c.country || ''}" data-code="${c.countryCode || ''}" data-lat="${c.lat}" data-lon="${c.lon}">
          ${c.name}
        </button>
      `;
    });

    DOM.recentPillsContainer.innerHTML = html;

    DOM.recentPillsContainer.querySelectorAll('.recent-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const loc = {
          name: btn.getAttribute('data-city'),
          country: btn.getAttribute('data-country'),
          countryCode: btn.getAttribute('data-code'),
          lat: parseFloat(btn.getAttribute('data-lat')),
          lon: parseFloat(btn.getAttribute('data-lon')),
          timezone: 'auto'
        };
        DOM.citySearchInput.value = loc.name;
        DOM.clearSearchBtn.classList.remove('hidden');
        fetchWeatherData(loc.lat, loc.lon, loc);
      });
    });
  }

  // =========================================================================
  // UNIT TOGGLE & ACTIONS
  // =========================================================================
  function initUnitToggle() {
    const updateButtons = () => {
      if (STATE.unit === 'c') {
        DOM.unitCelsius.classList.add('active');
        DOM.unitFahrenheit.classList.remove('active');
      } else {
        DOM.unitCelsius.classList.remove('active');
        DOM.unitFahrenheit.classList.add('active');
      }
    };

    updateButtons();

    DOM.unitCelsius.addEventListener('click', () => {
      if (STATE.unit !== 'c') {
        STATE.unit = 'c';
        localStorage.setItem('skyline_unit', 'c');
        updateButtons();
        renderAllWeatherViews();
      }
    });

    DOM.unitFahrenheit.addEventListener('click', () => {
      if (STATE.unit !== 'f') {
        STATE.unit = 'f';
        localStorage.setItem('skyline_unit', 'f');
        updateButtons();
        renderAllWeatherViews();
      }
    });
  }

  function toggleUnit() {
    STATE.unit = STATE.unit === 'c' ? 'f' : 'c';
    localStorage.setItem('skyline_unit', STATE.unit);
    DOM.unitCelsius.classList.toggle('active', STATE.unit === 'c');
    DOM.unitFahrenheit.classList.toggle('active', STATE.unit === 'f');
    renderAllWeatherViews();
  }

  // Copy Briefing to Clipboard
  function initCopyBriefing() {
    DOM.copyBriefingBtn.addEventListener('click', async () => {
      const text = DOM.briefingText.textContent.trim();
      try {
        await navigator.clipboard.writeText(`[Skyline Briefing] ${text}`);
        showNotification('Report Copied', 'Atmospheric telemetry briefing copied to clipboard.', false);
      } catch (e) {
        showNotification('Clipboard Alert', text, false);
      }
    });
  }

  // Hourly Section View Mode Switch (Sparkline vs Cards)
  function initViewModeToggle() {
    DOM.viewToggleSparkline.addEventListener('click', () => {
      STATE.viewMode = 'sparkline';
      DOM.viewToggleSparkline.classList.add('active');
      DOM.viewToggleCards.classList.remove('active');
      DOM.sparklineContainer.classList.remove('hidden');
    });

    DOM.viewToggleCards.addEventListener('click', () => {
      STATE.viewMode = 'cards';
      DOM.viewToggleCards.classList.add('active');
      DOM.viewToggleSparkline.classList.remove('active');
      DOM.sparklineContainer.classList.add('hidden');
      DOM.hourlyScrollStrip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // Keyboard Shortcuts
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if actively typing inside an input
      if (e.target.tagName === 'INPUT' && e.key !== 'Escape') return;

      if (e.key === '/') {
        e.preventDefault();
        DOM.citySearchInput.focus();
        DOM.citySearchInput.select();
      } else if (e.key.toLowerCase() === 'u') {
        toggleUnit();
      } else if (e.key.toLowerCase() === 'l') {
        DOM.geoBtn.click();
      } else if (e.key.toLowerCase() === 'r') {
        DOM.refreshBtn.click();
      }
    });
  }

  // Refresh Button
  DOM.refreshBtn.addEventListener('click', () => {
    DOM.refreshBtn.classList.add('loading');
    setTimeout(() => { DOM.refreshBtn.classList.remove('loading'); }, 1200);
    fetchWeatherData(STATE.currentLocation.lat, STATE.currentLocation.lon, STATE.currentLocation);
  });

  // Notification Toast Controls
  function showNotification(title, message, isError = false) {
    DOM.bannerTitle.textContent = title;
    DOM.bannerMessage.textContent = message;
    DOM.notificationBanner.classList.toggle('error', isError);
    DOM.notificationBanner.classList.remove('hidden');
  }

  function hideNotification() {
    DOM.notificationBanner.classList.add('hidden');
  }

  DOM.bannerClose.addEventListener('click', hideNotification);

  // Loading State Skeleton Manager
  function setLoadingState(isLoading) {
    STATE.isLoading = isLoading;
    if (isLoading) {
      DOM.skeletonView.classList.remove('hidden');
      DOM.weatherContent.style.opacity = '0.3';
      DOM.weatherContent.style.pointerEvents = 'none';
    } else {
      DOM.skeletonView.classList.add('hidden');
      DOM.weatherContent.style.opacity = '1';
      DOM.weatherContent.style.pointerEvents = 'auto';
    }
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function init() {
    initSearchHandlers();
    initGeolocation();
    initQuickPills();
    initUnitToggle();
    initCopyBriefing();
    initViewModeToggle();
    initKeyboardShortcuts();
    renderRecentPills();

    // Check if there is a saved last city, otherwise load London default
    const initialLocation = STATE.recentCities.length > 0 ? STATE.recentCities[0] : STATE.currentLocation;
    fetchWeatherData(initialLocation.lat, initialLocation.lon, initialLocation);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
