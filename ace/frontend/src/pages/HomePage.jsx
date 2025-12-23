import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderTeal from "../components/header";
const HomePage = () => {
    const navigate = useNavigate(); 
    
    const handleLoginClick = () => {
        navigate("/login");  // Navigate to the login page
    };

    const handleRegisterClick = () => {
        navigate("/register");  // Navigate to the register page
    };

    return(
        <div className="pt-20">
            <HeaderTeal />
                <div className="w-full flex flex-col border-2 items-center justify-center">
                    <h1 className='text-5xl font-bold'>Welcome to ACE!</h1>
                    <div    className="flex flex-col justify-center items-center w-full h-100 bg-darkteal rounded-3xl shadow-lg space-y-3">
                        <button className="h-10 w-50 rounded-md justify-center flex items-center p-4" onClick={handleLoginClick}>Login</button>
                        <button className="h-10 w-50 rounded-md justify-center flex items-center p-4" onClick={handleRegisterClick}>Register</button>
                    </div>
                </div>
        </div>
    );
}

export default HomePage;  // Default export