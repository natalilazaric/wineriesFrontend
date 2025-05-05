import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../../service/ApiService";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [winery, setWinery] = useState(null);
    const [wines, setWines] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessingWineryData, setIsProcessingWineryData] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [extras, setExtras] = useState([{ key: "", value: "" }]);
    const [offers, setOffers] = useState([{ type: "", price: "" }]);

    const wineList = wines ? (Array.isArray(wines) ? wines : Object.values(wines)) : [];

    
    const navigate = useNavigate();

    const [showWineryForm, setShowWineryForm] = useState(false);
    const [wineryData, setWineryData] = useState({
        name: '',
        location: '',
        food: false,
        description: '',
        wines:'',
        roomPhotoUrl: '',
        latitude: null,
        longitude: null,
    });

    const [photo, setPhoto] = useState(null);
    const [file, setFile] = useState(null);

    const handleAddOffer = () => {
        setOffers([...offers, { type: "", price: "" }]);
      };

    const handleOfferChange = (index, e) => {
        const { name, value } = e.target;
        const newOffers = [...offers];
        newOffers[index][name] = value;
        setOffers(newOffers);
      };
    
    const handleRemoveOffer = (index) => {
        const newOffers = offers.filter((_, i) => i !== index);
        setOffers(newOffers);
      };

    const handleAddExtra = () => {
        setExtras([...extras, { key: "", value: "" }]);
      };
      
    const handleExtraChange = (index, e) => {
        const { name, value } = e.target;
        const newExtras = [...extras];
        newExtras[index][name] = value;
        setExtras(newExtras);
    };
    const handleRemoveExtra = (index) => {
        const newExtras = extras.filter((_, i) => i !== index);
        setExtras(newExtras);
    };
      

    const [timeSlots, setTimeSlots] = useState({
        Pon: [],
        Uto: [],
        Sri: [],
        Čet: [],
        Pet: [],
        Sub: [],
        Ned: [],
    });

    const dayNames = {
        Pon: 'Ponedjeljak',
        Uto: 'Utorak',
        Sri: 'Srijeda',
        Čet: 'Četvrtak',
        Pet: 'Petak',
        Sub: 'Subota',
        Ned: 'Nedjelja'
      };

    const customIcon = new L.Icon({
        iconUrl: './assets/images/pin_7178080.png',  // Put do ikone (ako koristiš prilagođenu ikonu)
        iconSize: [35, 35],  // Veličina ikone
        iconAnchor: [12, 41],  // Točka gdje je pin na karti (donji centar ikone)
        popupAnchor: [1, -34],  // Točka odakle popup izlazi
      });

       

    useEffect(() => {
        const fetchUserProfile = async () => {
            try{
                setIsLoading(true);
                const response = await ApiService.getUserInfo();
                setUser(response.user);
                const result = await ApiService.getWineryByUserId(response.user.id);
                
                if(result && result.winery){
                    setWinery(result.winery);
                    const winesbywinery = await ApiService.getWinesByWineryId(result.winery.id);
                    console.log(winesbywinery);
                    setWines(winesbywinery.wineNames);

                    const data = await ApiService.getScheduleByWineryId(result.winery.id);
                    console.log("scheduleList je: ", data.scheduleList);
                    const grouped = groupByDayOfWeek(data.scheduleList);
                    console.log("grouped je:", grouped);

                    
                    setSchedules(grouped);
                } else{
                    console.log("vinarija nije pronađena")
                }

                setIsLoading(false);


            }catch(error){
                setError(error.response?.data?.message || error.message);
                setIsLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    const groupByDayOfWeek = (scheduleList) => {
        return scheduleList.reduce((acc, item) => {
          if (!acc[item.dayOfWeek]) {
            acc[item.dayOfWeek] = [];
          }
          acc[item.dayOfWeek].push(item);
          return acc;
        }, {});
      };

    const handleEditProfile = () => {
        navigate('/edit-profile');
    };

    const handleWineryFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
          setWineryData({
            ...wineryData,
            [name]: checked
          });
        } else {
          setWineryData({
            ...wineryData,
            [name]: value
          });
        }
      };

      const handleWineCheckboxChange = (e) => {
        const { value, checked } = e.target;
        let updatedWines = wineryData.wines ? wineryData.wines.split(", ") : [];
      
        if (checked) {
          updatedWines.push(value);
        } else {
          updatedWines = updatedWines.filter((wine) => wine !== value);
        }
      
        setWineryData({
          ...wineryData,
          wines: updatedWines.join(", "),
        });
      };

      const handleAddTimeSlot = (day, newSlot) => {
        setTimeSlots((prevSlots) => ({
            ...prevSlots,
            [day]: [...prevSlots[day], newSlot],
        }));
      };

        const handleTimeSlotChange = (day, index, e) => {
            const { name, value } = e.target;
            const updatedTimeSlots = { ...timeSlots };
            updatedTimeSlots[day][index][name] = value;
            setTimeSlots(updatedTimeSlots);
        };

        const handleAddNewTimeSlot = (day) => {
            const newSlot = {
                startTime: '',
                endTime: '',
                maxGuests: '',
                maxReservations: '',
            };
            handleAddTimeSlot(day, newSlot);
        };

    
      const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]; 
        setPhoto(selectedFile); // Za slanje na backend
        setFile(URL.createObjectURL(selectedFile));
      };
    
      const handleSubmit = async (e) => {
        e.preventDefault();

        const extrasJson = JSON.stringify(extras.reduce((acc, { key, value }) => {
            if (key && value) {
              acc[key] = value;
            }
            return acc;
        }, {}));

        const offersJson = JSON.stringify(offers.reduce((acc, { type, price }) => {
            if (type && price) {
              acc[type] = price;
            }
            return acc;
          }, {}));
    
        const formData = new FormData();
        formData.append("photo", photo);
        formData.append("name", wineryData.name);
        formData.append("location", wineryData.location);
        formData.append("food", wineryData.food);
        formData.append("description", wineryData.description);
        formData.append("wines", wineryData.wines);
        formData.append("latitude", wineryData.latitude);
        formData.append("longitude", wineryData.longitude);
        formData.append("extras", extrasJson);
        formData.append("offers", offersJson);

    
        try {
            const flatTimeSlots = Object.entries(timeSlots).flatMap(([day, slots]) =>
                slots
                    .filter(slot =>
                        slot.startTime &&
                        slot.endTime &&
                        slot.maxGuests &&
                        slot.maxReservations
                    )
                    .map(slot => ({
                        dayOfWeek: day,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        maxGuests: parseInt(slot.maxGuests,10),
                        maxReservations: parseInt(slot.maxReservations,10),
                    }))
            );
            
          setShowWineryForm(false);
          setIsProcessingWineryData(true);
        
          const response = await ApiService.addWinery(user.id, formData); 
          setWinery(response.winery);

          const timeSlotsResponse = await ApiService.addSchedule(response.winery.id, flatTimeSlots);
          
          const winesbywinery = await ApiService.getWinesByWineryId(response.winery.id);
          setWines(winesbywinery.wineNames);
          const data = await ApiService.getScheduleByWineryId(response.winery.id);
          const grouped = groupByDayOfWeek(data.scheduleList);
          setSchedules(grouped);


          setTimeout(() => {
            setIsProcessingWineryData(false);
        }, 1000);
        
        } catch (error) {
          setError(error.response?.data?.message || error.message);
        } 
      };

      const LocationMarker = () => {
        const map = useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setWineryData({
                    ...wineryData,
                    latitude: lat,
                    longitude: lng
                });
            }
        });
        return wineryData.latitude && wineryData.longitude ? (
            <Marker position={[wineryData.latitude, wineryData.longitude]} icon={customIcon}>
                <Popup>{wineryData.location}</Popup>
            </Marker>
        ) : null;
    };

    
    return(
        <div className="profile-page">
            
            {isProcessingWineryData && (
            <div className="spinner-overlay">
                <div className="spinner" />
                <p>Učitavanje podataka...</p>
            </div>
        )}
            {user && <h2>MOJ PROFIL</h2>}
            {user && (
                <button className="edit-profile-btn" onClick={handleEditProfile}>
                    Uredi profil
                </button>
            )}
            {user && (
                <div className="profile-details">
                    <h3>Osobni podaci</h3>
                    <p><strong>Ime i prezime: </strong>{user.name} {user.lastname}</p>
                    <p><strong>Email: </strong>{user.email}</p>
                </div>
            )}

            {/* Display the Add Winery button if user is Winemaker and does not have a winery */}
            {user && user.role === 'WINEMAKER' && !isLoading && (!winery || Object.keys(winery).length === 0) && (
                <div className="winery-actions">
                <button onClick={() => setShowWineryForm(true)}>Dodaj vinariju</button>
                </div>
            )}

            {/* Winery Form */}
            {showWineryForm && (
                <div className="winery-form">
                <h3>Dodajte svoju vinariju</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                    <label>Ime vinarije:</label>
                    <input
                        type="text"
                        name="name"
                        value={wineryData.name}
                        onChange={handleWineryFormChange}
                        required
                    />
                    </div>
                    
                    <div>
                    <label>Opis:</label>
                    <textarea
                        name="description"
                        value={wineryData.description}
                        onChange={handleWineryFormChange}
                        required
                    ></textarea>
                    </div>
                    
                    <div>
                    <label>Slika vinarije:</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        required
                    />
                    </div>

                    <div>
                    <label>Vrste vina:</label>
                    <div>
                        {["Malvazija", "Muškat", "Chardonnay", "Rosé", "Teran", "Pinot", "Cabarnet Sauvignon", "Merlot", "Refošk"].map((wine) => (
                        <div key={wine}>
                            <label>
                            <input
                                type="checkbox"
                                name="wines"
                                value={wine}
                                checked={wineryData.wines.includes(wine)}
                                onChange={(e) => handleWineCheckboxChange(e)}
                            />
                            {wine}
                            </label>
                        </div>
                        ))}
                    </div>
                    </div>

                    <div>
                    <label>Poslužujete hranu?</label>
                    <input
                        type="checkbox"
                        name="food"
                        checked={wineryData.food}
                        onChange={handleWineryFormChange}
                    />
                    </div>
                    
                    <div>
                    <label>Ponude:</label>
                    <table>
                        <tbody>
                        {offers.map((offer, index) => (
                            <tr key={index}>
                            <td>
                                <input
                                type="text"
                                name="type"
                                value={offer.type}
                                onChange={(e) => handleOfferChange(index, e)}
                                placeholder="Unesite vrstu ponude"
                                />
                            </td>
                            <td>
                                <input
                                type="number"
                                name="price"
                                value={offer.price}
                                onChange={(e) => handleOfferChange(index, e)}
                                placeholder="Unesite cijenu"
                                />
                            </td>
                            <td>
                                <button
                                className="del-button"
                                type="button"
                                onClick={() => handleRemoveOffer(index)}
                                disabled={offers.length <= 1}
                                >
                                -
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button className="add-button" type="button" onClick={handleAddOffer}>+</button>
                    </div>

                    <div>
                        <label>Dodatne informacije:</label>
                            <table>
                                <tbody>
                                {extras.map((extra, index) => (
                                    <tr key={index}>
                                    <td>
                                        <input
                                        type="text"
                                        name="key"
                                        value={extra.key}
                                        onChange={(e) => handleExtraChange(index, e)}
                                        placeholder="Unesite ključ"
                                        />
                                    </td>
                                    <td>
                                        <input
                                        type="text"
                                        name="value"
                                        value={extra.value}
                                        onChange={(e) => handleExtraChange(index, e)}
                                        placeholder="Unesite vrijednost"
                                        />
                                    </td>
                                    <td>
                                        <button
                                        className="del-button"
                                        type="button"
                                        onClick={() => handleRemoveExtra(index)}
                                        disabled={extras.length <= 1}
                                        >
                                        -
                                        </button>
                                        
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <button className="add-button" type="button" onClick={handleAddExtra}>+</button>
                            </div>

                            <div>
                            <label>Lokacija:</label>
                            <input
                                type="text"
                                name="location"
                                value={wineryData.location}
                                onChange={handleWineryFormChange}
                                required
                            />
                            </div>
                            <div style={{ height: "400px", width: "100%" }}>
                                    <MapContainer center={[45.2400, 13.9361]} zoom={10} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationMarker />
                                    </MapContainer>
                        </div>

                        <div className="timeslot-form">
                            <h3>Dodajte termine za posjete</h3>
                            <form>
                                {Object.keys(timeSlots).map((day) => (
                                    <div key={day}>
                                        <h4>{day}</h4>
                                        {timeSlots[day].map((slot, index) => (
                                            <div key={index}>
                                                <label>Početak:</label>
                                                <input
                                                    type="time"
                                                    name="startTime"
                                                    value={slot.startTime}
                                                    onChange={(e) => handleTimeSlotChange(day, index, e)}
                                                />
                                                <label>Završetak:</label>
                                                <input
                                                    type="time"
                                                    name="endTime"
                                                    value={slot.endTime}
                                                    onChange={(e) => handleTimeSlotChange(day, index, e)}
                                                />
                                                <label>Max broj gostiju:</label>
                                                <input
                                                    type="number"
                                                    name="maxGuests"
                                                    value={slot.maxGuests}
                                                    onChange={(e) => handleTimeSlotChange(day, index, e)}
                                                />
                                                <label>Max rezervacija:</label>
                                                <input
                                                    type="number"
                                                    name="maxReservations"
                                                    value={slot.maxReservations}
                                                    onChange={(e) => handleTimeSlotChange(day, index, e)}
                                                />
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => handleAddNewTimeSlot(day)}
                                        >
                                            Dodaj termin
                                        </button>
                                    </div>
                                ))}
                            </form>
                        </div>

                        <button type="submit">Spremi vinariju i termine</button>
                    
                </form>
                </div>
            )}



            {user && winery && !showWineryForm &&(
                <div>
                    <div className="winery-details">
                        <img 
                            src={`data:image/jpeg;base64,${winery.photo}`}
                            alt="Winery" 
                            className="winery-image" 
                            />
                        <div className="winery-info">
                            <p><strong>Ime vinarije:</strong> {winery.name}</p>
                            <p><strong>Lokacija:</strong> {winery.location}</p>
                            <p><strong>Opis:</strong> {winery.description}</p>
                            <p><strong>Poslužujete hranu?</strong> {winery.food ? "Da" : "Ne"}</p>
                            <p><strong>Vrste vina:</strong> {wineList.length > 0 ? wineList.join(", ") : "Nema dostupnih vina"}</p>

                            <div className="reservation-winery-extras">
                                <p><strong>Ponude:</strong></p>
                                {winery.offers && (
                                    <div>
                                        {Object.entries(winery.offers).map(([key, value]) => (
                                            <p key={key}>{key} - {value}€</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="reservation-winery-extras">
                                <p><strong>Dodatne informacije:</strong></p>
                                {winery.extras && (
                                    <div>
                                        {Object.entries(winery.extras).map(([key, value]) => (
                                            <p key={key}>{key}: {value}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="schedule-container">
                        <h2>Raspored termina</h2>
                        {Object.entries(schedules).map(([day, slots]) => (
                        <div key={day} className="schedule-item">
                            <h3>{dayNames[day] || day}</h3>
                            <ul>
                            {slots.map((slot, index) => (
                                <li key={index}>
                                    <div className="slot-details">
                                    <span>{slot.startTime} - {slot.endTime}</span> |  
                                    <span> Ograničenje broja gostiju: {slot.maxGuests}</span> |  
                                    <span> Maksimalan broj rezervacija: {slot.maxReservations}</span>
                                    </div>
                                </li>
                            ))}
                            </ul>
                        </div>
                        ))}
                    </div>
                </div>
                
            )}

        </div>
    );

};

export default ProfilePage;