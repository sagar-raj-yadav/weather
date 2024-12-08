import React, { useState } from 'react';
import axios from 'axios';

const WeatherSearch = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);

  const handleSearch = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:8000/weather',
        { city },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWeather(response.data.weather);
    } catch (error) {
      alert('Error fetching weather');
    }
  };

  return (
    <div>
      <h2>Weather Search</h2>
      <input type="text" placeholder="City" onChange={(e) => setCity(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      {weather && <pre>{JSON.stringify(weather, null, 2)}</pre>}
    </div>
  );
};

export default WeatherSearch;
