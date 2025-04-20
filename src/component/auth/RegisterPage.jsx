import React, {useState} from "react";
import { useNavigate} from "react-router-dom";
import ApiService from "../../service/ApiService";

function RegisterPage(){
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        lastname: '',
        email: '',
        password: '',
        role:''
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [succesMessage, setSuccesMessage] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    const handleInputChange = (e) => {
        const {name,value} = e.target;
        setFormData({...formData, [name]: value});
    };

    const handleRoleSelection = (role) => {
        setSelectedRole(role);
        setFormData({...formData, role});
    };

    const validateForm = () => {
        const {name, lastname, email, password, role} = formData;
        if (!name || !lastname || !email || !password || !role){
            return false;
        }
        return true;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!validateForm()){
            setErrorMessage('Potrebno popuniti sva polja.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }
        try{
            const response = await ApiService.registerUser(formData);
            if(response.statusCode === 200){
                setFormData({
                    name:'',
                    lastname:'',
                    email:'',
                    password:'',
                    role:''
                });
                setSuccesMessage('Korisnik je uspješno registriran.');
                setTimeout(() => {
                    setSuccesMessage('');
                    navigate('/login');
                }, 5000);
            }
        }catch (error) {
            setErrorMessage(error.response?.data?.message || error.message);
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };
    return (
        <div className="auth-container">
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {succesMessage && <p className="succes-message">{succesMessage}</p>}
            <h2>Registracija</h2>
            {!selectedRole ? (
                <div className="role-selection">
                    <button onClick={() => handleRoleSelection("USER")} className="role-button user" >Registriraj se kao korisnik</button>
                    <button onClick={() => handleRoleSelection("WINEMAKER")} className="role-button winemaker" >Registriraj se kao vinar</button>
                </div>
            ) : (
            <form onSubmit = {handleSubmit}>
                <div className="form-group">
                    <label>Ime: </label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required/>
                </div>
                <div className="form-group">
                    <label>Prezime: </label>
                    <input type="text" name="lastname" value={formData.lastname} onChange={handleInputChange} required/>
                </div>
                <div className="form-group">
                    <label>Email: </label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required/>
                </div>
                <div className="form-group">
                    <label>Lozinka: </label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} required/>
                </div>
                <button type="submit">Registracija</button>
            </form>
            )}
            <p className="register-link">
                Vec imate račun? <a href="/login">Prijavite se</a>
            </p>
        </div>
    );

}

export default RegisterPage;