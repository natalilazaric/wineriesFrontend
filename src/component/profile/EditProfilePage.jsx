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

    const [wines, setWines] = useState(null);

    const [extras, setExtras] = useState([]);
    const [offers, setOffers] = useState([]);

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
                    setOffers(mapToArray(fetchedWinery.offers || {}));
                    const scheduleResponse = await ApiService.getScheduleByWineryId(wineryResponse.winery.id);
                    const grouped = groupByDayOfWeek(scheduleResponse.scheduleList);
                    setTimeSlots(grouped);
                    const winesbywinery = await ApiService.getWinesByWineryId(wineryResponse.winery.id);
                    const wineArray = Array.isArray(winesbywinery.wineNames)
                    ? winesbywinery.wineNames.map(w => w.trim())
                    : winesbywinery.wineNames.split(",").map(w => w.trim());

                    setWines(wineArray.filter(w => w));
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

    const handleOfferKeyChange = (index, newKey) => {
        const updated = [...offers];
        updated[index].key = newKey;
        setOffers(updated);
    };
    
    const handleOfferValueChange = (index, newValue) => {
        const updated = [...offers];
        updated[index].value = newValue;
        setOffers(updated);
    };
    
    const handleAddOffer = () => {
        setOffers(prev => [...prev, { key: "", value: "" }]);
    };
    
    const handleDeleteOffer = (index) => {
        const updated = [...offers];
        updated.splice(index, 1);
        setOffers(updated);
    };
    

    const handleTimeSlotChange = (day, index, e) => {
        const updatedSlots = [...timeSlots[day]];
        updatedSlots[index][e.target.name] = e.target.value;
        setTimeSlots({ ...timeSlots, [day]: updatedSlots });
    };

    const handleDeleteTimeSlot = (day, index) => {
        const updatedSlots = [...timeSlots[day]];
        updatedSlots.splice(index, 1);
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
            [day]: [...prev[day], newSlot]
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
                        <label>Poslužujete hranu? <input type="checkbox" name="food" checked={winery.food} onChange={handleWineryChange} /></label>
                        <label>Vrste vina:</label>
                        <div className="wines-checkbox-group">
                            {["Malvazija", "Muškat", "Chardonnay", "Rosé", "Teran", "Pinot", "Cabarnet Sauvignon", "Merlot", "Refošk"].map((wineName) => (
                                <label key={wineName} style={{ display: 'block', marginBottom: '5px' }}>
                                    <input
                                        type="checkbox"
                                        checked={wines?.includes(wineName)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setWines(prev => [...prev, wineName]);
                                            } else {
                                                setWines(prev => prev.filter(w => w !== wineName));
                                            }
                                        }}
                                    />
                                    {wineName}
                                </label>
                            ))}
                        </div>

                        <label>Ponude:</label>
                        <table>
                            <thead>
                            </thead>
                            <tbody>
                                {offers.map((offer, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                type="text"
                                                value={offer.key}
                                                onChange={(e) => handleOfferKeyChange(index, e.target.value)}
                                                placeholder="Ponuda"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={offer.value}
                                                onChange={(e) => handleOfferValueChange(index, e.target.value)}
                                                placeholder="Cijena"
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteOffer(index)}
                                            >
                                                -
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="btn-add" type="button" onClick={handleAddOffer}>+</button>
                        
                        <label>Dodatne informacije:</label>
                        <table>
                            <thead>
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
                        <button className="btn-add" type="button" onClick={handleAddExtra}>+</button>
                    

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
                                const wineString = wines.join(", ");
                                await ApiService.updateWinery(winery.id, {
                                    ...winery,
                                    extras: arrayToMap(extras),
                                    offers: arrayToMap(offers)
                                },wineString);
                                
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