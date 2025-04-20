import logo from './logo.svg';
import './App.css';
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './component/common/Navbar';
import HomePage from './component/home/HomePage';
import LoginPage from './component/auth/LoginPage';
import RegisterPage from './component/auth/RegisterPage';
import ProfilePage from './component/profile/ProfilePage';
import EditProfilePage from './component/profile/EditProfilePage';
import MapPage from './component/map/MapPage';
import WineriesPage from './component/wineries/WineriesPage';
import SaveReservationPage from './component/reservations/SaveReservationPage'; 
import ReservationsPage from './component/reservations/ReservationsPage';


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar/>
        <div className='content'>
          <Routes>
            <Route exact path='/' element={<HomePage/>}/>
            <Route exact path='/login' element={<LoginPage/>}/>
            <Route path='/register' element={<RegisterPage/>}/>

            <Route path='/profile' element={<ProfilePage/>}/>
            <Route path='/edit-profile' element={<EditProfilePage/>}/>
            
            <Route path='/map' element={<MapPage/>}/>
            <Route path='/wineries' element={<WineriesPage/>}/>

            <Route path="/save-reservation/:wineryId" element={<SaveReservationPage />}/>
            <Route path="/reservations" element={<ReservationsPage />}/>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
    // </QueryClientProvider>
  );
}

export default App;
