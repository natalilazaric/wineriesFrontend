import React, {useState} from "react";
import { useNavigate, useLocation, replace } from "react-router-dom";
import ApiService from "../../service/ApiService";

function LoginPage(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();


    const from = location.state?.from?.pathname || '/'

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!email || !password){
            setError('Potrebno popuniti sva polja.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try{
            const response = await ApiService.loginUser({email, password});
            if(response.statusCode === 200){
                localStorage.setItem('token', response.token);
                localStorage.setItem('role', response.role);
                if(response.role === 'WINEMAKER'){
                    navigate('/profile', {replace:true});
                }
                else{
                    navigate(from, {replace: true});
                }
            }
        } catch (error){
            setError(error.response?.data?.message || error.message);
            setTimeout(() => setError(''), 5000);
        }

    };

    return (
        <div className="auth-container">
            <h2>Prijava</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit = {handleSubmit}>
                <div className="form-group">
                    <label>Email: </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </div>
                <div className="form-group">
                    <label>Lozinka: </label>
                    <input type="password" value={password} onChange={(p) => setPassword(p.target.value)} required/>
                </div>
                <button type="submit">Prijava</button>
            </form>
            <p className="register-link">
                Još uvijek nemate račun? <a href="/register">Registrirajte se</a>
            </p>
        </div>

    );
}

export default LoginPage;