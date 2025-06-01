import axios from "axios"

export default class ApiService{

    /*static BASE_URL = "https://wineriesbackend.onrender.com"*/
    static BASE_URL = "http://localhost:4040"

    static getHeader(){
        const token = localStorage.getItem("token");
        console.log(token)
        return {
            Authorization:`Bearer ${token}`,
            "Content-Type": "application/json"
        };
    }

    /*AUTH*/

    static async registerUser(registration){
        const response = await axios.post(`${this.BASE_URL}/auth/register`, registration)
        return response.data
    }

    static async loginUser(loginDetails) {
        const response = await axios.post(`${this.BASE_URL}/auth/login`, loginDetails)
        return response.data
    }

    /*USERS*/

    static async getAllUsers(){
        const response = await axios.get(`${this.BASE_URL}/users/all`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async getUserInfo(){
        const response = await axios.get(`${this.BASE_URL}/users/get-profile-info`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async getUser(userId){
        const response = await axios.get(`${this.BASE_URL}/users/get-by-id/${userId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async getUserReservations(userId){
        const response = await axios.get(`${this.BASE_URL}/users/get-user-reservations/${userId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async deleteUser(userId){
        const response = await axios.delete(`${this.BASE_URL}/users/delete/${userId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async updateUser(userId, user){
        const response = await axios.put(`${this.BASE_URL}/users/update-user/${userId}`, user, {
            headers: this.getHeader()
        })
        return response.data
    }



    /*WINERIES*/

    static async addWinery(userId, formData){
        const response = await axios.post(`${this.BASE_URL}/wineries/add/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    }

    static async addSchedule(wineryId, scheduleData) {
        const response = await axios.post(`${this.BASE_URL}/wineries/schedule/${wineryId}`, scheduleData, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    }

    static async getScheduleByWineryId(wineryId){
        const response = await axios.get(`${this.BASE_URL}/wineries/scheduleAll/${wineryId}`)
        return response.data
    }

    static async getAllWineries(){
        const response = await axios.get(`${this.BASE_URL}/wineries/all`)
        return response.data
    }

    static async getWinesByWineryId(wineryId){
        const response = await axios.get(`${this.BASE_URL}/wineries/wines/${wineryId}`)
        return response.data
    }

    static async getWineryById(wineryId){
        const response = await axios.get(`${this.BASE_URL}/wineries/winery-by-id/${wineryId}`)
        return response.data
    }

    static async getWineryByUserId(userId){
        const response = await axios.get(`${this.BASE_URL}/wineries/winery-by-userid/${userId}`)
        return response.data
    }

    static async deleteWineryById(wineryId){
        const response = await axios.delete(`${this.BASE_URL}/wineries/delete/${wineryId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async updateWinery(wineryId, winery, wines) {
        try {
            console.log("u funkciji su vina: ", wines);
        
            const data = {
                winery: winery,
                wines: wines
            };
            console.log("Šaljem update vinarije:", data);
        
            const response = await axios.put(`${this.BASE_URL}/wineries/update-winery/${wineryId}`, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        
            console.log("Odgovor od backend-a:", response);
        
            return response.data;
        } catch (error) {
            console.error("Došlo je do pogreške:", error);
        }
    }

    static async updateSchedule(wineryId, scheduleData){
        const response = await axios.put(`${this.BASE_URL}/wineries/update-schedule/${wineryId}`, scheduleData, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    }

    /**RESERVATIONS */

    static async saveReservation(wineryId, userId, reservation){
        const response = await axios.post(`${this.BASE_URL}/reservations/save/${wineryId}/${userId}`, reservation, {
            headers: this.getHeader()
        })
        return response.data
    }


    static async getAllReservations(){
        const response = await axios.get(`${this.BASE_URL}/reservations/all`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async getReservationsByWineryId(wineryId){
        const response = await axios.get(`${this.BASE_URL}/reservations/reservation-by-wineryid/${wineryId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async approveReservation(reservationId){
        const response = await axios.put(`${this.BASE_URL}/reservations/approve/${reservationId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async pastReservation(reservationId){
        const response = await axios.put(`${this.BASE_URL}/reservations/past/${reservationId}`, {
            headers: this.getHeader()
        })
        return response.data
    }
    
    static async cancelReservation(reservationId){
        const response = await axios.delete(`${this.BASE_URL}/reservations/delete/${reservationId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    /**REVIEWS */

    static async addReview(reviewData) {
        const response = await axios.post(`${this.BASE_URL}/reviews/add`, reviewData)
        return response.data
    }

    static async getReviewsByWineryId(wineryId){
        const response = await axios.get(`${this.BASE_URL}/reviews/get-review-by-wineryid/${wineryId}`)
        return response.data
    }

    static async getReviewsByUserId(userId){
        const response = await axios.get(`${this.BASE_URL}/reviews/get-review-by-userId/${userId}`)
        return response.data
    }

    static async deleteReview(reviewId){
        const response = await axios.delete(`${this.BASE_URL}/reviews/delete-review/${reviewId}`, {
            headers: this.getHeader()
        })
        return response.data
    }

    static async editReview(reviewId, text){
        const response = await axios.put(`${this.BASE_URL}/reviews/edit-review/${reviewId}`, text,{
            headers: this.getHeader()
        })
        return response.data
    }

    /**AUTH */

    static logout(){
        localStorage.removeItem('token')
        localStorage.removeItem('role')
    }

    static isAuthenticated(){
        const token = localStorage.getItem('token')
        return !!token
    }

    static isUser(){
        const role = localStorage.getItem('role')
        return role ==='USER'
    }

    static isWinemaker(){
        const role = localStorage.getItem('role')
        return role ==='WINEMAKER'
    }


}