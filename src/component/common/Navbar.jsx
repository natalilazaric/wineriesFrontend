import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ApiService from "../../service/ApiService";

function Navbar(){

    const isAuthenticated = ApiService.isAuthenticated();
    const isWinemaker = ApiService.isWinemaker();
    const isUser = ApiService.isUser();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    const handleLogout=() =>{
        setIsMenuOpen(false);
        const isLogout = window.confirm("Jeste li sigurni da se želite odjaviti?");
        if(isLogout){
            ApiService.logout();
            navigate('/')
        }
    };

    const toggleMenu = (event) => {
        event.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenuOnLinkClick = () => {
        setIsMenuOpen(false);
    };

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target) && !buttonRef.current.contains(event.target)) {
            setIsMenuOpen(false);
        }
    };

    const getInitials = () => {
        if (!user || !user.name || !user.lastname) return "";
        return `${user.name.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase();
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);


    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await ApiService.getUserInfo();
                console.log("Dohvaćen korisnik:", response.user);
                setUser(response.user);
            } catch (error) {
                console.error("Greška kod dohvaćanja korisnika:", error);
            }
        };

        if (isAuthenticated) {
            fetchUser();
        }
    }, [isAuthenticated]);


    return(
        <nav className="navbar">

            <div className="navbar-icon">
                <NavLink to="/">VINSKI PUT ISTRE</NavLink>
            </div>
            <ul className="navbar-ul">
                <li><NavLink to="/" activeClass="active"> POČETNA</NavLink></li>
                <li><NavLink to="/map" activeClass="active"> KARTA</NavLink></li>
                <li><NavLink to="/wineries" activeClass="active"> VINARIJE</NavLink></li>

                {isUser && <li><NavLink to="/reservations" activeClass="active"> REZERVACIJE</NavLink></li>}
                {isWinemaker && <li><NavLink to="/reservations" activeClass="active"> REZERVACIJE</NavLink></li>}

                {isAuthenticated && (
                    <li className="profile-menu">
                        <button ref={buttonRef} onClick={toggleMenu} className="profile-icon">
                            <span >{getInitials()}</span>
                        </button>
                        {isMenuOpen && (
                            <ul ref={menuRef} className="dropdown-menu">
                                <li><NavLink to="/profile" activeClassName="active" onClick={closeMenuOnLinkClick} >PROFIL</NavLink></li>
                                <li className="odjava-btn" onClick={handleLogout}>ODJAVA</li>
                            </ul>
                        )}
                    </li>
                )}
                {!isAuthenticated && <li><NavLink to="/login" activeClass="active"> PRIJAVA</NavLink></li>}
                {!isAuthenticated && <li><NavLink to="/register" activeClass="active"> REGISTRACIJA</NavLink></li>}

            </ul>

        </nav>
    )

}

export default Navbar;