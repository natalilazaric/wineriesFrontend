import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'
import React, {useState, useEffect} from "react";
import { useNavigate, useLocation, replace } from "react-router-dom";
import ApiService from "../../service/ApiService";


function MapPage() {
  const [user, setUser] = useState(null);
  const [wineries, setWineries] = useState([]);
  const [selectedWinery, setSelectedWinery] = useState(null);
  const [wines, setWines] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();

  const wineList = wines ? (Array.isArray(wines) ? wines : Object.values(wines)) : [];
  
  const customIcon = new L.Icon({
    iconUrl: './assets/images/pin_7178080.png',  // Put do ikone (ako koristiš prilagođenu ikonu)
    iconSize: [35, 35],  // Veličina ikone
    iconAnchor: [12, 41],  // Točka gdje je pin na karti (donji centar ikone)
    popupAnchor: [1, -34],  // Točka odakle popup izlazi
  });

  useEffect(() => {
    const fetchWineries= async () => {
      try{
        const response = await ApiService.getAllWineries();
        const allWineries = response.wineryList;
        setWineries(allWineries);


        const result = await ApiService.getUserInfo();
        setUser(result.user);
  
      }catch(error){
        setError(error.response?.data?.message || error.message);
      }finally {
        setIsLoading(false); // Uvijek se izvrši
    }
    };
    fetchWineries();
  }, []);

  if (isLoading) {
    return <div className="spinner-overlay"><div className="spinner"></div></div>;
  }

  return (
    <div className='map-istria'>
      <div>
        <MapContainer center={[45.2400, 13.9361]} zoom={10} style={{ height: "680px", width: "680px", borderRadius: "10px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {wineries && wineries.map((winery) => (
            <Marker key={winery.id} position={[winery.latitude, winery.longitude]} icon={customIcon} 
            eventHandlers={{
              click: async () => {
                setSelectedWinery(winery); 
                try {
                  const winesbywinery = await ApiService.getWinesByWineryId(winery.id); // Čekaj odgovor
                  setWines(winesbywinery.wineNames || []);

                  const wineryReviews = await ApiService.getReviewsByWineryId(winery.id);
                  const reviewsWithUsers = await Promise.all(
                    (wineryReviews.reviewDTOList || []).map(async (review) => {
                      try {
                        const userInfo = await ApiService.getUser(review.userId);
                        return {
                          ...review,
                          userFullName: `${userInfo.user.name} ${userInfo.user.lastname}`
                        };
                      } catch (err) {
                        return {
                          ...review,
                          userFullName: "Nepoznati korisnik"
                        };
                      }
                    })
                  );
                  setReviews(reviewsWithUsers);

                } catch (error) {
                  console.error("Greška pri dohvaćanju vina:", error);
                  setWines([]);
                  setReviews([]);
                }
              }
            }}>
              <Popup>
                <b>{winery.name}</b>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {!selectedWinery ? (
        <div className='map-description'>
          <h2>Dobrodošli u vinsku regiju Istre</h2>
          <p>
          Istarske vinarije su prave opuštajuće oaze koje nude bijeg od gradskog stresa 
          i buke i idealna su odredišta za intimna druženja i degustacije.
          </p>
          <p>
          Ukoliko ove jeseni planirate posjetiti Istru, obiđite barem jednu vinariju. Na 
          turama po vinogradima i podrumima doznat ćete više o procesu proizvodnje vina i 
          kušati različite etikete. Mnoge se vinarije nalaze na brežuljcima ili padinama s 
          prekrasnim pogledom pa ćete uz dobru kapljicu uživati u spektakularnim prizorima. 
          Uz to, gotovo svaka vinarija uparuje svoja vina s gastro delicijama, što zaokružuje 
          cjelokupno iskustvo. U svakom slučaju, dva-tri sata provedena na ovim imanjima 
          sigurno će vas napuniti energijom potrebnom za novi radni tjedan.
          </p>
        </div>
      ) : (
        <div className='map-description'>
          <h2>{selectedWinery.name}</h2>
          <p><strong>Opis:</strong> {selectedWinery.description}</p>
          <p><strong>Lokacija:</strong> {selectedWinery.location}</p>
          {user && user.role === 'USER' && (
          <button className="reservation-button" onClick={() => navigate(`/save-reservation/${selectedWinery.id}`)}>
            Vidi više
          </button>
          )}
          {reviews.length > 0 ? (
            <div className="reviews-section">
              <ul>
                {reviews.map((review) => (
                  <li key={review.id}>
                    <p>{review.text}</p>
                    <small>{review.userFullName}, {new Date(review.createdAt).toLocaleDateString()}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Još nema recenzija za ovu vinariju.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MapPage;