import React, {useState, useEffect} from "react";
import { useNavigate, useLocation, replace } from "react-router-dom";
import ApiService from "../../service/ApiService";

const WineriesPage = () => {
    const [user, setUser] = useState(null);
    const [wineries, setWineries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchWineries = async () => {
            try {
                const response = await ApiService.getAllWineries();
                const allWineries = response.wineryList;

                try {
                    const result = await ApiService.getUserInfo();
                    setUser(result.user);
                } catch (err) {
                    console.log("Korisnik nije prijavljen ili nije moguće dohvatiti podatke", err);
                }

                const wineriesWithWines = await Promise.all(
                    allWineries.map(async (winery) => {
                        try {
                            const wineResponse = await ApiService.getWinesByWineryId(winery.id);
                            const wineList = wineResponse.wineNames || []; 
                            return { ...winery, wines: wineList };
                        } catch (err) {
                            console.error(`Greška pri dohvaćanju vina za vinariju ${winery.id}`, err);
                            return { ...winery, wines: [] };
                        }
                    })
                );

                setWineries(wineriesWithWines);
            } catch (error) {
                setError(error.response?.data?.message || error.message);
            }finally {
                setIsLoading(false); // Uvijek se izvrši
            }
        };

        fetchWineries();
    }, []);
    return (
        <div className="wineries-page">
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
                )}
            {wineries && wineries.map((winery) => (
                <div key={winery.id} className="winery-details">
                    <img 
                        src={`data:image/jpeg;base64,${winery.photo}`} 
                        alt="Winery" 
                        className="winery-image" 
                    />
                    <div className="winery-info">
                        <p><strong>{winery.name}</strong></p>
                        <p><strong>Lokacija:</strong> {winery.location}</p>
                        <p><strong>Opis:</strong> {winery.description}</p>
                    </div>
                    {user && user.role === 'USER' && (
                    <div>
                        <button className="reservation-button" onClick={() => navigate(`/save-reservation/${winery.id}`)}>
                            Vidi više
                        </button>
                    </div>
                    )}
                </div>
            ))}
        </div>
        
    );

}

export default WineriesPage;