import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import WeatherSearch from './components/WeatherSearch';
import WeatherReport from './components/WeatherReport';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/weather" element={<WeatherSearch />} />
        <Route path="/report" element={<WeatherReport />} />
      </Routes>
    </Router>
  );
};

export default App;
