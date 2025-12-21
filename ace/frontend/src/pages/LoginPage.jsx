import React from "react";
import "../index.css"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderTeal from "../components/header";

const API_BASE = import.meta.env.VITE_API_BASE;

const LoginPage = () => {
    const [email, setEmail] = useState("");  
    const [password, setPassword] = useState("");  
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate(); 
    
    const handleSubmit = async () => {
        setErrorMessage("");

        if (!email || !password) {
            alert("Please fill in both fields.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                //save token either way -> holds user_id, team_id, session expiration
                localStorage.setItem("token", data.token);
                localStorage.setItem("canSendMessages", data.can_send_messages ? "true" : "false");
                localStorage.setItem("requiresTeam", data.requires_team ? "true" : "false");

                navigate("/chat");
            } else {
                setErrorMessage(data.error || "Login failed.");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Could not connect to server.");
        }
    };

    const handleBack = () => {
        navigate("/")
    }

    return (
        <div className="pt-20 w-full">
            <HeaderTeal />
                <div>
                    <h1 className='text-5xl font-bold'>Login Page</h1>
                    <div className="flex flex-col justify-center items-center w-full h-100 bg-darkteal rounded-3xl shadow-lg space-y-3">
                        <input className="h-10 w-50 rounded-md justify-center flex items-center p-4 bg-white"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}  // Update email state
                            />
                        <input className="h-10 w-50 rounded-md justify-center flex items-center p-4 bg-white"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}  // Update password state
                            />

                        {errorMessage && (
                            <p className="text-red-500 font-semibold">{errorMessage}</p>
                        )}

                        <div className="flex space-x-5 p-5">
                            <button className="h-10 w-1/8 rounded-md justify-center flex items-center p-4" onClick={handleBack}>back</button>
                            <button className="h-10 w-50 rounded-md justify-center flex items-center p-4" onClick={handleSubmit}>Submit</button>
                        </div>
                    </div>
                </div>
        </div>
    );
}

export default LoginPage;