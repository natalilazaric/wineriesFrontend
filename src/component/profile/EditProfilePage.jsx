import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../../service/ApiService";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EditProfilePage = () => {
    const [user, setUser] = useState(null);
    const [winery, setWinery] = useState(null);
    const [timeSlots, setTimeSlots] = useState({
        Pon: [], Uto: [], Sri: [], Čet: [], Pet: [], Sub: [], Ned: []
    });

    const [extras, setExtras] = useState([]);
    const mapToArray = (mapObj) => {
        return Object.entries(mapObj || {}).map(([key, value]) => ({ key, value }));
    };
    
    const arrayToMap = (array) => {
        return array.reduce((acc, curr) => {
            if (curr.key) {
                acc[curr.key] = curr.value;
            }
            return acc;
        }, {});
    };

    const daysOfWeek = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

    const [activeSection, setActiveSection] = useState(null);

    const navigate = useNavigate();
    const customIcon = new L.Icon({
        iconUrl: './assets/images/pin_7178080.png',
        iconSize: [35, 35],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });


    const toggleSection = (section) => {
        setActiveSection(prev => prev === section ? null : section);
    };

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setWinery(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }));
            }
        });
        return winery?.latitude && winery?.longitude ? (
            <Marker position={[winery.latitude, winery.longitude]} icon={customIcon}>
                <Popup>{winery.location || "Odabrana lokacija"}</Popup>
            </Marker>
        ) : null;
    };

    useEffect(() => {
        const fetchData = async () => {
            const response = await ApiService.getUserInfo();
            setUser(response.user);
            if (response.user.role === "WINEMAKER") {
                const wineryResponse = await ApiService.getWineryByUserId(response.user.id);
                if (wineryResponse.winery) {
                    const fetchedWinery = wineryResponse.winery;
                    setWinery(wineryResponse.winery);
                    setExtras(mapToArray(fetchedWinery.extras || {}));
                    const scheduleResponse = await ApiService.getScheduleByWineryId(wineryResponse.winery.id);
                    const grouped = groupByDayOfWeek(scheduleResponse.scheduleList);
                    setTimeSlots(grouped);
                }
            }
        };
        fetchData();
    }, []);

    const groupByDayOfWeek = (scheduleList) => {
        const initial = {
            Pon: [], Uto: [], Sri: [], Čet: [], Pet: [], Sub: [], Ned: []
        };
        return scheduleList.reduce((acc, item) => {
            acc[item.dayOfWeek].push(item);
            return acc;
        }, initial);
    };

    const handleUserChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleWineryChange = (e) => {
        const { name, value, type, checked } = e.target;
        setWinery(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    
    const handleExtraKeyChange = (index, newKey) => {
        const updated = [...extras];
        updated[index].key = newKey;
        setExtras(updated);
    };
    
    const handleExtraValueChange = (index, newValue) => {
        const updated = [...extras];
        updated[index].value = newValue;
        setExtras(updated);
    };
    
    const handleAddExtra = () => {
        setExtras(prev => [...prev, { key: "", value: "" }]);
    };
    
    const handleDeleteExtra = (index) => {
        const updated = [...extras];
        updated.splice(index, 1);
        setExtras(updated);
    };
    

    const handleTimeSlotChange = (day, index, e) => {
        const updatedSlots = [...timeSlots[day]];
        updatedSlots[index][e.target.name] = e.target.value;
        setTimeSlots({ ...timeSlots, [day]: updatedSlots });
    };

    const handleDeleteTimeSlot = (day, index) => {
        const updatedSlots = [...timeSlots[day]];
        updatedSlots.splice(index, 1); // Uklanja termin na određenom indeksu
        setTimeSlots({ ...timeSlots, [day]: updatedSlots });
    };

    const handleAddTimeSlot = (day) => {
        const newSlot = {
            startTime: '',
            endTime: '',
            maxGuests: '',
            maxReservations: ''
        };
        setTimeSlots(prev => ({
            ...prev,
            [day]: [...prev[day], newSlot] // Dodajemo novi slot na kraj
        }));
    };


    return user && (
        <div className="edit-profile-container">
            {/* Osobni podaci */}
            <button className="section-toggle-btn" onClick={() => toggleSection('user')}>OSOBNI PODACI</button>
            {activeSection === 'user' && (
                <div className="section user-section">
                    <label>Ime:</label>
                    <input type="text" name="name" value={user.name} onChange={handleUserChange} />
                    <label>Prezime:</label>
                    <input type="text" name="lastname" value={user.lastname} onChange={handleUserChange} />
                    <button className="save-button" onClick={async () => {
                        try {
                            await ApiService.updateUser(user.id, user);
                            setActiveSection(null);
                        } catch (err) {
                            console.error(err);
                        }
                    }}>Spremi osobne podatke</button>
                </div>
            )}

            {/* Podaci o vinariji */}
            {user.role === "WINEMAKER" && winery && (
                <>
                <button className="section-toggle-btn" onClick={() => toggleSection('winery')}>PODACI O VINARIJI</button>
                {activeSection === 'winery' && winery && (
                    <div className="section winery-section">
                        <label>Naziv vinarije:</label>
                        <input type="text" name="name" value={winery.name} onChange={handleWineryChange} placeholder="Ime vinarije" />
                        <label>Opis vinarije:</label>
                        <textarea name="description" value={winery.description} onChange={handleWineryChange} placeholder="Opis" />
                        <label>Cijena po osobi (EUR):</label>
                        <input type="number" name="price" value={winery.price} onChange={handleWineryChange} placeholder="Cijena" />
                        <label>Poslužujete hranu?</label>
                        <input type="checkbox" name="food" checked={winery.food} onChange={handleWineryChange} />

                        
                        <label>Dodatne informacije:</label>
                        <table>
                            <thead>
                                <tr>
                                    <th>Naziv opcije</th>
                                    <th>Opis</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {extras.map((extra, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                type="text"
                                                value={extra.key}
                                                onChange={(e) => handleExtraKeyChange(index, e.target.value)}
                                                placeholder="Naziv opcije"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={extra.value}
                                                onChange={(e) => handleExtraValueChange(index, e.target.value)}
                                                placeholder="Opis"
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className="del-button"
                                                type="button"
                                                onClick={() => handleDeleteExtra(index)}
                                            >
                                                -
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="add-button" type="button" onClick={handleAddExtra}>+</button>
                    

                        <label>Lokacija:</label>
                        <input type="text" name="location" value={winery.location} onChange={handleWineryChange} placeholder="Lokacija" />
                        <label>Odaberi lokaciju na karti:</label>
                        <div style={{ height: "400px", width: "100%", marginTop: "1rem" }}>
                            <MapContainer center={[winery?.latitude || 45.2400, winery?.longitude || 13.9361]} zoom={10} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker />
                            </MapContainer>
                        </div>
                        
                        <button className="save-button" onClick={async () => {
                            try {
                                await ApiService.updateWinery(winery.id, {
                                    ...winery,
                                    extras: arrayToMap(extras)
                                });
                                setActiveSection(null);
                            } catch (err) {
                                console.error(err);
                            }
                        }}>Spremi podatke o vinariji</button>
                    </div>
                )}
                </>
            )}

            {/* Termini za rezervacije */}
            {user.role === "WINEMAKER" && (
                <>
                <button className="section-toggle-btn" onClick={() => toggleSection('schedule')}>TERMINI REZERVACIJA</button>
                {activeSection === 'schedule' && (
                <div className="section schedule-section">
                    <div className="time-slot-labels">
                        <label>Početak vremena:</label>
                        <label>Kraj vremena:</label>
                        <label>Maksimalan broj gostiju:</label>
                        <label>Maksimalan broj rezervacija:</label>
                    </div>
                    {daysOfWeek.map((day) => {
                        const slots = timeSlots[day] || [];
                        return (
                            <div key={day} className="day-slot">
                                <h4 className="day-title">{day}</h4>
                                {slots.map((slot, i) => (
                                    <div key={i} className="slot-row">
                                        <input type="time" name="startTime" value={slot.startTime} onChange={(e) => handleTimeSlotChange(day, i, e)} />
                                        <input type="time" name="endTime" value={slot.endTime} onChange={(e) => handleTimeSlotChange(day, i, e)} />
                                        <input type="number" name="maxGuests" value={slot.maxGuests} onChange={(e) => handleTimeSlotChange(day, i, e)} />
                                        <input type="number" name="maxReservations" value={slot.maxReservations} onChange={(e) => handleTimeSlotChange(day, i, e)} />
                                        <button className="del-button" onClick={() => handleDeleteTimeSlot(day, i)}>-</button>
                                    </div>
                                ))}
                                <button className="add-button" onClick={() => handleAddTimeSlot(day)}>+</button>
                            </div>
                        );
                    })}
                    <button className="save-button" onClick={async () => {
                        try {
                            const flatSlots = Object.entries(timeSlots).flatMap(([day, slots]) =>
                                slots.map(slot => ({ ...slot, dayOfWeek: day }))
                            );
                            const invalid = flatSlots.find(slot => {
                                if (!slot.startTime || !slot.endTime) return false;
                                const start = new Date(`1970-01-01T${slot.startTime}:00Z`);
                                const end = new Date(`1970-01-01T${slot.endTime}:00Z`);
                                return end <= start;
                            });
                    
                            if (invalid) {
                                alert("Svi termini moraju imati kraj koji je nakon početka.");
                                return;
                            }
                            await ApiService.updateSchedule(winery.id, flatSlots);
                            setActiveSection(null);
                        } catch (err) {
                            console.error(err);
                        }
                    }}>Spremi termine</button>
                </div>
                )}
                </>
            )}

            <button className="gotovo-btn" onClick={() => navigate("/profile")}>Gotovo</button>
           </div>
    );
};

export default EditProfilePage;