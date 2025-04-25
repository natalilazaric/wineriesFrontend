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

    const [showPassword, setShowPassword] = useState(false);

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
                    <input className="input-register" name="name" value={formData.name} onChange={handleInputChange} required/>
                </div>
                <div className="form-group">
                    <label>Prezime: </label>
                    <input className="input-register" name="lastname" value={formData.lastname} onChange={handleInputChange} required/>
                </div>
                <div className="form-group">
                    <label>Email: </label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required/>
                </div>
                <div className="form-group">
                    <label>Lozinka: </label>
                    <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            style={{ paddingRight: "10px" }}
                        />
                        <span
                            onClick={() => setShowPassword(prev => !prev)}
                            style={{
                                position: "absolute",
                                right: "30px",
                                cursor: "pointer",
                            }}
                            title={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
                        >
                            {showPassword ? (
                                // Ikona zatvorenog oka
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor" width="22" height="22">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.045 10.045 0 012.153-3.328m3.47-2.439A9.973 9.973 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.056 10.056 0 01-4.155 5.176M15 12a3 3 0 11-6 0 3 3 0 016 0zm-7.5 7.5l12-12" />
                                </svg>
                            ) : (
                                // Ikona otvorenog oka
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor" width="22" height="22">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </span>
                    </div>
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