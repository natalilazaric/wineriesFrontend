import React, {useState, useEffect} from "react";
import { useNavigate, useLocation, replace } from "react-router-dom";
import ApiService from "../../service/ApiService";

const ReservationsPage = () => {
    const [user, setUser] = useState(null);
    const [userReservations, setUserReservations] = useState(null);
    const [winemakerReservations, setWinemakerReservations] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [activeReviewReservationId, setActiveReviewReservationId] = useState(null);
    const [reviewText, setReviewText] = useState("");

    const [editReviewText, setEditReviewText] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [userReviews, setUserReviews] = useState([]);

    const parseDateTime = (dateStr, timeStr) => {
        const [day, month, year] = dateStr.split("-");
        return new Date(`${year}-${month}-${day}T${timeStr}`);
      };

    const handleReviewSubmit = async (reservationId, wineryId) => {
        try {
            await ApiService.addReview({
                userId: user.id,
                wineryId: wineryId,
                reservationId: reservationId,
                text: `"${reviewText}"`
            });

            const reviewsResponse = await ApiService.getReviewsByUserId(user.id);
            const updatedReviews = reviewsResponse.reviewDTOList || [];
            setUserReviews(updatedReviews);

            alert("Recenzija je uspješno spremljena!");
            setUserReservations(prevReservations =>
                prevReservations.map(reservation =>
                    reservation.id === reservationId
                        ? { ...reservation, hasReview: true }
                        : reservation
                )
            );
            setActiveReviewReservationId(null);
            setReviewText("");
        } catch (error) {
            console.error("Greška prilikom slanja recenzije:", error);
            alert("Dogodila se greška prilikom spremanja recenzije.");
        }
    };

    const handleEditReview = async (reviewId) => {
        try {
            await ApiService.editReview(reviewId, editReviewText);
            const reviewsResponse = await ApiService.getReviewsByUserId(user.id);
            const updatedReviews = reviewsResponse.reviewDTOList || [];
            setUserReviews(updatedReviews);

            alert("Recenzija je uspješno ažurirana.");
            setEditingReviewId(null);
            setEditReviewText("");
        } catch (error) {
            console.error("Greška prilikom uređivanja recenzije:", error);
            alert("Dogodila se greška prilikom ažuriranja recenzije.");
        }
    };
    
    const handleDeleteReview = async (reviewId, reservationId) => {
        const isDelete = window.confirm("Jeste li sigurni da želite izbrisati ovu recenziju?");
        if (isDelete) {
            try {
                await ApiService.deleteReview(reviewId);
                setUserReservations(prev =>
                    prev.map(r =>
                        r.id === reservationId ? { ...r, hasReview: false } : r
                    )
                );
                alert("Recenzija je uspješno izbrisana.");
            } catch (error) {
                console.error("Greška prilikom brisanja recenzije:", error);
            }
        }
    };

    const markPastReservationsAsFinished = async (reservations) => {
        const today = new Date();
    
        for (let reservation of reservations) {
            const reservationDate = parseDateTime(reservation.date, reservation.endTime);
            if (reservationDate < today && reservation.state !== "FINISHED") {
                try {
                    await ApiService.pastReservation(reservation.id);
                    reservation.state = "FINISHED"; 
                } catch (err) {
                    console.error("Greška kod označavanja rezervacije kao završene:", err);
                }
            }
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setIsLoading(true);
                const result = await ApiService.getUserInfo();
                setUser(result.user);
                
                if(result.user.role === 'USER'){
                    const response = await ApiService.getUserReservations(result.user.id);
                    const sortedReservations = response.user.reservations.sort((a, b) => {
                        const dateA = parseDateTime(a.date, a.startTime);
                        const dateB = parseDateTime(b.date, b.startTime);
                        return dateA - dateB;
                    });
                    
                    const reviewsResponse = await ApiService.getReviewsByUserId(result.user.id);
                    const reviewsByUser = reviewsResponse.reviewDTOList || [];
                    setUserReviews(reviewsByUser);
                    // Ažuriraj rezervacije sa informacijom da li imaju recenziju
                    const reservationsWithReviews = sortedReservations.map(reservation => {
                    const hasReview = reviewsByUser.some(review => review.reservationId === reservation.id);
                    return { ...reservation, hasReview };
                    });

                    await markPastReservationsAsFinished(reservationsWithReviews);
                    setUserReservations(reservationsWithReviews);
                    console.log("USER RESERVATIONS SU ", reservationsWithReviews);
                    
                }
                if(result.user.role === 'WINEMAKER'){
                    const response = await ApiService.getWineryByUserId(result.user.id);
                    const newresponse = await ApiService.getReservationsByWineryId(response.winery.id);
                    const sortedWinemakerReservations = newresponse.reservationList.sort((a, b) => {
                        const dateA = parseDateTime(a.date, a.startTime);
                        const dateB = parseDateTime(b.date, b.startTime);
                        return dateA - dateB;
                    });
                    await markPastReservationsAsFinished(sortedWinemakerReservations);
                    setWinemakerReservations(sortedWinemakerReservations);
                }

                setIsLoading(false);


            } catch (error) {
                setError(error.response?.data?.message || error.message);
            }
        };
        fetchUser();
    }, []);

    const handleApprove = async (reservationId) => {
        try {
            const updatedReservation = await ApiService.approveReservation(reservationId);
            setWinemakerReservations(prevReservations =>
                prevReservations.map(reservation =>
                    reservation.id === reservationId
                        ? { ...reservation, state: updatedReservation.state }
                        : reservation
                )
            );
        } catch (error) {
            console.error('Došlo je do pogreške pri odobravanju rezervacije:', error);
        }
    };

    const handleDelete= async(reservationId) =>{
        const isDelete = window.confirm("Jeste li sigurni da se želite otkazati rezervaciju?");
        if(isDelete){
            try{
                await ApiService.cancelReservation(reservationId);

            }catch(err){
                console.log("Greška prilikom otkazivanja rezervacije: ", err);
            }
        }
        navigate('/reservations');
    }


    return (
        <div className="reservations-page">
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
                )}
            { !isLoading && user && user.role ==='USER' ? (
            <div className="user-reservations">
                {userReservations && userReservations.map((reservation) => (
                <div key={reservation.id} className="reservation-card">
                    <div className={`reservation-status ${
                        reservation.state === "APPROVED" ? "approved" :
                        reservation.state === "PENDING" ? "pending" :
                        reservation.state === "FINISHED" ? "finished" : "unknown"
                    }`}>
                        {reservation.state === "FINISHED" ? (
                            <>
                            {reservation.hasReview ? (
                            <>
                            {editingReviewId === reservation.id ? (
                                <div className="review-form">
                                    <textarea 
                                        value={editReviewText}
                                        onChange={(e) => setEditReviewText(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="review-buttons">
                                    <button className="submit-review-btn" onClick={() => handleEditReview(
                                        userReviews.find(r => r.reservationId === reservation.id)?.id
                                    )}>
                                        Spremi izmjene
                                    </button>
                                    <button className="cancel-edit-btn" onClick={() => {
                                        setEditingReviewId(null);
                                        setEditReviewText("");
                                    }}>
                                        Odustani
                                    </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="review-action-buttons">
                                    <button className="edit-review-btn" onClick={() => {
                                        const review = userReviews.find(r => r.reservationId === reservation.id);
                                        if (review) {
                                            setEditReviewText(review.text);
                                            setEditingReviewId(reservation.id);
                                        }
                                    }}>
                                        Uredi recenziju
                                    </button>
                                    <button className="delete-review-btn" onClick={() => {
                                        const review = userReviews.find(r => r.reservationId === reservation.id);
                                        if (review) {
                                            handleDeleteReview(review.id, reservation.id);
                                        }
                                    }}>
                                        Obriši recenziju
                                    </button>
                                    </div>
                                </>
                            )}
                        </>
                            ) : (
                            <>
                             {activeReviewReservationId !== reservation.id && (
                            <button 
                                className="review-btn"
                                onClick={() => setActiveReviewReservationId(reservation.id)}
                            >
                                Ostavi recenziju
                            </button>
                            
                             )}
                            {activeReviewReservationId === reservation.id && (
                                <div className="review-form">
                                    <textarea 
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Napišite recenziju..."
                                        rows={3}
                                    />
                                    <div className="review-buttons">
                                    <button 
                                        className="submit-review-btn"
                                        onClick={() => handleReviewSubmit(reservation.id, reservation.winery.id)}
                                    >
                                        Spremi recenziju
                                    </button>
                                    <button 
                                        className="cancel-edit-btn"
                                        onClick={() => {
                                            setActiveReviewReservationId(null);
                                            setReviewText("");
                                        }}
                                    >
                                        Odustani
                                    </button>
                                </div>
                                </div>
                            )}
                            </>
                            )}
                            </>
                        ) : (
                            reservation.state === "PENDING" ? "U redu čekanja" :
                            reservation.state === "APPROVED" ? "Odobreno" : "Nepoznat status"
                        )}
                    </div>
                    <img 
                        src={`data:image/jpeg;base64,${reservation.winery.photo}`} 
                        alt="Winery" 
                        className="reservation-image" 
                    />
                    <div className="reservation-info">
                        <p><strong>Ime vinarije:</strong> {reservation.winery.name}</p>
                        <p><strong>Lokacija:</strong> {reservation.winery.location}</p>
                        <p><strong>Odabrana ponuda:</strong> {reservation.offer}</p>
                        <p><strong>Datum rezervacije:</strong> {reservation.date}</p>
                        <p><strong>Termin:</strong> {reservation.startTime} - {reservation.endTime}</p>
                        <p><strong>Broj gostiju:</strong> {reservation.numberOfGuests}</p>
                        <p><strong>Ukupna cijena:</strong> {reservation.totalPrice}€</p>
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <div className="winemaker-reservations">
                {winemakerReservations && winemakerReservations.map((reservation) => (
                <div key={reservation.id} className="winemaker-card">
                    <p><strong>Kupac:</strong> {reservation.user.name} {reservation.user.lastname}</p>
                    <p><strong>Odabrana ponuda:</strong> {reservation.offer}</p>
                    <p><strong>Datum rezervacije:</strong> {reservation.date}</p>
                    <p><strong>Termin:</strong> {reservation.startTime} - {reservation.endTime}</p>
                    <p><strong>Broj gostiju:</strong> {reservation.numberOfGuests}</p>
                    <p><strong>Ukupna cijena:</strong> {reservation.totalPrice}€</p>
                    {reservation.state === "PENDING" && (
                        <div className="card-buttons">
                            <button 
                                className="approve-btn"
                                onClick={() => handleApprove(reservation.id)}
                            >
                                Odobriti
                            </button>
                            <button 
                                className="delete-btn" 
                                onClick={() => handleDelete(reservation.id)}
                            >
                                Otkazati
                            </button>
                        </div>
                    )}
                </div>
                ))}
            </div>
            )}
        </div>

        
    );

}

export default ReservationsPage;