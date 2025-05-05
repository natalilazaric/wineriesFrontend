import React, {useState, useEffect} from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiService from "../../service/ApiService";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns';
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

const SaveReservationPage  = () => {
    const navigate = useNavigate();
    const { wineryId } = useParams();
    const [selectedWinery, setSelectedWinery] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Track loading state
    const [selectedDate, setSelectedDate] = useState(null);
    const [numGuests, setNumGuests] = useState(1);
    const [message, setMessage] = useState(null);
    const [user, setUser] = useState(null);

    const [dailyTerms, setDailyTerms] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [allSchedules, setAllSchedules] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState('');

    const [reservations, setReservations] = useState([]);
    const [bookedDates, setBookedDates] = useState([]);

    const [maxAvailableGuests, setMaxAvailableGuests] = useState(null);

    const getDayString = (date) => {
      const days = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];
      return days[date.getDay()];
    };

    const tileClassName = ({ date, view }) => {
      if (view === 'month') {
        const dateString = format(date, 'dd-MM-yyyy');
    
        // Provjeri potpuno zauzete datume
        if (bookedDates.fullyBooked?.includes(dateString)) {
          console.log("Datum potpuno zauzet:", dateString);  // Provjeri datume koji su potpuno zauzeti
          return 'booked'; // crveno
        }
    
        // Provjeri djelomično zauzete datume
        if (bookedDates.partiallyBooked?.includes(dateString)) {
          console.log("Datum djelomično zauzet:", dateString);  // Provjeri datume koji su djelomično zauzeti
          return 'partially-booked'; // žuto
        }
      }
      return null;
    };

    useEffect(() => {
        const fetchWinery= async () => {
          try{
            setIsLoading(true);
            const response = await ApiService.getWineryById(wineryId);
            const winesbywinery = await ApiService.getWinesByWineryId(wineryId);
            const updatedWinery = {
                ...response.allWineriesDTO,
                wines: winesbywinery.wineNames || []
            };

            setSelectedWinery(updatedWinery);
            console.log("selectedWinery je: ", updatedWinery);
            console.log("PODACI O VINARIJI",updatedWinery);
            const data = await ApiService.getScheduleByWineryId(wineryId);
            setAllSchedules(data.scheduleList);

            const newresponse = await ApiService.getReservationsByWineryId(wineryId);
            setReservations(newresponse.reservationList);
            console.log("rezervacije za ovu vinariju su: ", newresponse.reservationList)

            const { fullyBooked, partiallyBooked } = processReservations(newresponse.reservationList, data.scheduleList);
            setBookedDates({ fullyBooked, partiallyBooked });
      
          }catch(error){
            setError(error.response?.data?.message || error.message);
          }finally {
            setIsLoading(false); 
          }
        };
        fetchWinery();
      }, [wineryId]);
      

      useEffect(() => {
              const fetchUser = async () => {
                  try{
                      const result = await ApiService.getUserInfo();
                      setUser(result.user);
      
                  }catch(error){
                      setError(error.result?.data?.message || error.message);
                      console.log(error)
                  }
              };
              fetchUser();
          }, []);
      
      useEffect(() => {
        if (selectedDate && allSchedules.length > 0) {
          const day = getDayString(selectedDate);
          
          const formattedDate = format(selectedDate, 'dd-MM-yyyy');
          const termsForDay = allSchedules.filter(s => s.dayOfWeek === day);

          const now = new Date();
          const filteredTerms = termsForDay.filter(term => {

            if (selectedDate.toDateString() === now.toDateString()) {
              
              const [hours, minutes] = term.startTime.split(':').map(Number);
              const termTime = new Date(selectedDate);
              termTime.setHours(hours);
              termTime.setMinutes(minutes);
          
              if (termTime < now) {
                return false; 
              }
            }

            const matchingReservations = reservations.filter(r =>
              r.date === formattedDate &&
              r.dayOfWeek === term.dayOfWeek &&
              r.startTime === term.startTime &&
              r.endTime === term.endTime
            );

            const totalGuests = matchingReservations.reduce((acc, r) => acc + r.numberOfGuests, 0);
            const numberOfReservations = matchingReservations.length;

            if (term.maxReservations === 0) {
              return totalGuests < term.maxGuests; 
            } else {
              return !(
                (numberOfReservations >= term.maxReservations && totalGuests <= term.maxGuests) ||
                (numberOfReservations < term.maxReservations && totalGuests >= term.maxGuests)
              );
            }
          });

          setDailyTerms(filteredTerms);
          setSelectedTimeSlot(null);
        }
      }, [selectedDate, allSchedules]);

      useEffect(() => {
        if (!selectedDate || !selectedTimeSlot || !reservations || !allSchedules) return;
      
        const formattedDate = format(selectedDate, 'dd-MM-yyyy');
        const [startTime, endTime] = selectedTimeSlot.split(" - ");
        const day = getDayString(selectedDate);
      
        const term = allSchedules.find(t =>
          t.dayOfWeek === day &&
          t.startTime === startTime.trim() &&
          t.endTime === endTime.trim()
        );
      
        if (!term) return;
      
        const matchingReservations = reservations.filter(r =>
          r.date === formattedDate &&
          r.dayOfWeek === day &&
          r.startTime === startTime.trim() &&
          r.endTime === endTime.trim()
        );
      
        const totalGuests = matchingReservations.reduce((acc, r) => acc + r.numberOfGuests, 0);
        const remainingGuests = term.maxGuests - totalGuests;
      
        setMaxAvailableGuests(remainingGuests > 0 ? remainingGuests : 0);
      }, [selectedDate, selectedTimeSlot, reservations, allSchedules]);
      
      const handleCalendarChange = (date) => {
        setSelectedDate(date); 
    };
      
      const processReservations = (reservations, schedules) => {
        const fullyBookedDates = new Set();
        const partiallyBookedDates = new Set();
      
        const groupedByDate = {};
      
        
        reservations.forEach(res => {
          if (!groupedByDate[res.date]) {
            groupedByDate[res.date] = [];
          }
          groupedByDate[res.date].push(res);
        });
      
        Object.entries(groupedByDate).forEach(([date, reservationsForDate]) => {
          const dayOfWeek = reservationsForDate[0].dayOfWeek;
      
          const termsForDay = schedules.filter(term => term.dayOfWeek === dayOfWeek);
      
          let allTermsBooked = true; 
          let someTermsBooked = false; 
      
          termsForDay.forEach(term => {
            const matchingReservations = reservationsForDate.filter(r =>
              r.startTime === term.startTime &&
              r.endTime === term.endTime &&
              r.dayOfWeek === term.dayOfWeek
            );
      
            const totalGuests = matchingReservations.reduce((acc, r) => acc + r.numberOfGuests, 0);
            const numberOfReservations = matchingReservations.length;
            
            let isTermFullyBooked = false;
      
            if (term.maxReservations === 0) {
              if (totalGuests >= term.maxGuests) {
                isTermFullyBooked = true;
              }
            } else {
              if (numberOfReservations >= term.maxReservations && totalGuests <= term.maxGuests) {
                isTermFullyBooked = true;
              } else if (numberOfReservations < term.maxReservations && totalGuests >= term.maxGuests) {
                isTermFullyBooked = true;
              }
            }
      
            if (isTermFullyBooked) {
              someTermsBooked = true; 
            } else {
              allTermsBooked = false; 
            }
          });
      
          if (allTermsBooked) {
            fullyBookedDates.add(date); 
          } else if (someTermsBooked) {
            partiallyBookedDates.add(date); 
          }
        });
      
        return {
          fullyBooked: Array.from(fullyBookedDates),
          partiallyBooked: Array.from(partiallyBookedDates)
        };
      };
      const handleReservation = async () => {
        if (!selectedDate || numGuests < 1) {
          setMessage("Molimo unesite datum i broj gostiju.");
          return;
        }

        if (maxAvailableGuests !== null && numGuests > maxAvailableGuests) {
          setMessage(`Maksimalan broj gostiju za ovaj termin je ${maxAvailableGuests}.`);
          return;
        }
        
        const formattedDate = format(selectedDate, "dd-MM-yyyy");
        const dayOfWeek = getDayString(selectedDate);
        const [startTime, endTime] = selectedTimeSlot.split(" - ");


        const reservationData = {
          date: formattedDate, // Formatiraj datum u "yyyy-MM-dd"
          numberOfGuests: numGuests,
          dayOfWeek:dayOfWeek,
          startTime:startTime.trim(),
          endTime:endTime.trim(),
          state:"PENDING",
          offer: selectedOffer
        };

        console.log("Šaljem rezervaciju:", reservationData);
    
        try {
          const response = await ApiService.saveReservation(wineryId, user.id, reservationData);
          setMessage("Rezervacija uspješno spremljena!");
          navigate("/reservations");
        } catch (error) {
          setMessage("Greška prilikom spremanja rezervacije. Pokušajte ponovo.");
        }
      };


      if (isLoading) {
        return <div className="spinner-overlay"><div className="spinner"></div></div>;
      }

      return(
        <div className="save-reservation">
          <div className="reservation-content">
            <div className="reservation-details">
              <div className="reservation-winery-details">
                <img 
                        src={`data:image/jpeg;base64,${selectedWinery.photo}`} 
                        alt="Winery" 
                        className="reservation-winery-image" 
                    />
                    <div className="reservation-winery-info">
                        <p><strong>Ime vinarije:</strong> {selectedWinery.name}</p>
                        <p><strong>Lokacija:</strong> {selectedWinery.location}</p>
                        <p><strong>Opis:</strong> {selectedWinery.description}</p>
                        <p><strong>Poslužujete hranu?</strong> {selectedWinery.food ? "Da" : "Ne"}</p>
                        <p><strong>Vrste vina:</strong> {selectedWinery.wines.length > 0 ? selectedWinery.wines.join(", ") : "Nema dostupnih vina"}</p>
                        <div className="reservation-winery-extras">
                          <p><strong>Dodatne informacije:</strong></p>
                          {selectedWinery.extras && (
                              <div>
                                  {Object.entries(selectedWinery.extras).map(([key, value]) => (
                                      <p key={key}>{key}: {value}</p>
                                  ))}
                              </div>
                          )}
                        </div>
                    </div>
              </div>
              {selectedWinery.offers && Object.keys(selectedWinery.offers).length > 0 && (
                <div className="day-schedule">
                  <label>Odaberite ponudu:</label>
                  <select value={selectedOffer} onChange={(e) => setSelectedOffer(e.target.value)}>
                    <option value="">Odaberite ponudu</option>
                    {Object.entries(selectedWinery.offers).map(([offerName, price]) => (
                      <option key={offerName} value={offerName}>
                        {offerName} - {price}€
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                  <label>Odaberite datum:</label>
                  <DatePicker 
                    selected={selectedDate} 
                    onChange={(sDate) => setSelectedDate(sDate)} 
                    dateFormat="dd-MM-yyyy"
                    minDate={new Date()} // Blokira prošle datume
                    placeholderText="Odaberite datum"
                    className="custom-datepicker"
                    filterDate={(date) => {
                      const dateString = format(date, 'dd-MM-yyyy');
                      return !bookedDates.fullyBooked?.includes(dateString);
                    }}
                  />
              </div>

              {selectedDate && (
                <div className="day-schedule" >
                  <h4>Termini za {getDayString(selectedDate)}:</h4>
                  {dailyTerms.length > 0 ? (
                    <select
                      value={selectedTimeSlot || ""}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    >
                      <option value="">Odaberite termin</option>
                      {dailyTerms.map((term, index) => (
                        <option key={index} value={`${term.startTime} - ${term.endTime}`}>
                          {term.startTime} - {term.endTime}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>Za odabrani dan nema termina.</p>
                  )}
                </div>
              )}
              <div className='guest-container'>
                  <div className="guest-div">
                    <label>Broj gostiju:</label>
                    <input
                      type="number"
                      min="1"
                      max={maxAvailableGuests ?? ''}
                      value={numGuests}
                      onChange={(e) => setNumGuests(parseInt(e.target.value))}
                    />
                    {selectedTimeSlot && maxAvailableGuests !== null && (
                      <p style={{ fontSize: '0.85rem', color: 'gray' }}>
                        Maksimalno dostupno gostiju za ovaj termin: {maxAvailableGuests}
                      </p>
                    )}
                  </div>
              </div>

              <button onClick={handleReservation} className="reserve-button">Rezerviraj</button>
              {message && <p className="message">{message}</p>}
            </div>
            <div className="calendar-container">
              <Calendar tileClassName={tileClassName} onChange={handleCalendarChange} minDate={new Date()} />
            </div>
        
          </div>
        </div>
      );
}



export default SaveReservationPage;