import React, {useState} from "react";
import { useNavigate, useLocation, replace } from "react-router-dom";
import ApiService from "../../service/ApiService";

function LoginPage(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(p) => setPassword(p.target.value)}
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
                <button type="submit">Prijava</button>
            </form>
            <p className="register-link">
                Još uvijek nemate račun? <a href="/register">Registrirajte se</a>
            </p>
        </div>

    );
}

export default LoginPage;