import React, {useState} from "react";
import { ArrowRight } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";

const HomePage = () => {

    return (
        <div className="home">
            <section>
                <header className="header-banner">
                    <img src="./assets/images/homepageimage.jpg" alt="Wieneries" className="header-image" />
                    <div className="overlay"></div>
                    <div className="animated-texts overlay-content">
                        <div className="oval-text">
                            <h1>Istraži ponudu istarskih vina </h1>
                            <NavLink to="/map"><button className="arrow-btn"><ArrowRight size={24} /></button></NavLink>
                        </div>
                    </div>
                </header>
            </section>
        </div>
    );

}

export default HomePage;