import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import "./App.css";

import SearchPage from './pages/SearchPage/SearchPage.jsx'; 
import SearchResultsPage from './pages/SearchResultsPage/SearchResultsPage.jsx';
import ExcursionPage from './pages/ExcursionPage/ExcursionPage.jsx';

const ProfilePage = () => <h1>Личный кабинет</h1>;
const DummyPage = ({ title }) => <h1>{title}</h1>;

export default function App() {
  return (
    <Router> 
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<SearchPage />} /> 
          <Route path="results" element={<SearchResultsPage />} />
          <Route path="excursion/:id" element={<ExcursionPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<h1>404: Страница не найдена</h1>} />
        </Route>
      </Routes>
    </Router>
  );
}