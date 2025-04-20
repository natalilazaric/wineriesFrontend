import React, { Component } from "react";
import { NavLink, useLocation } from "react-router-dom";
import ApiService from "./ApiService";

export const ProtectedRoute = ({element: Component}) => {
    const location = useLocation();
    return ApiService.isAuthenticated() ?(
        Component
    ):(
        <Navigate to="/login" replace state={{from: location}}/>
    );
};


/* Možda mi nece trebat*/

export const WinemakerRoute = ({element: Component}) => {
    const location = useLocation();
    return ApiService.isWinemaker() ?(
        Component
    ):(
        <Navigate to="/login" replace state={{from: location}}/>
    );
};