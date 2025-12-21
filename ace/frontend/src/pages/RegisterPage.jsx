import React, { useState }from "react";
import "../index.css"
import { useNavigate } from "react-router-dom";
import HeaderTeal from "../components/header";

const API_BASE = import.meta.env.VITE_API_BASE;

const RegisterPage = () => {
    const [ucid,setUcid] = useState("");
    const [name,setName] = useState("");
    const [email, setEmail] = useState("");  
    const [password, setPassword] = useState("");  
    const [password_copy, setPasswordCopy] = useState("");
    const [passwordmismatch, setPasswordMismatch] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (passwordmismatch) {
            setErrorMessage("Passwords do not match!");
            return;
        }

        if (!email || !password || !name || !ucid) {
            setErrorMessage("Please fill in all fields.");
            return;
        }

        try {
            const res = await fetch(`/api/register_user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, ucid }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("token", data.token);

                if (data.requires_team) {
                    localStorage.setItem("openProfile", "true"); //will open profile dropdown, always true
                }

                navigate("/chat");
            } else {
                setErrorMessage(data.error || "Registration failed");
            }
        } catch (e) {
            setErrorMessage(`An error occurred: ${e.message}`);
        }
};

    const handleBack = () => {
        navigate("/")
    }

    const checkPasswordMatch = (value) => {
        setPasswordCopy(value);  // Update the password copy state
        if (password !== value) {
            setPasswordMismatch(true);  // Set mismatch state to true if passwords do not match
        } else {
            setPasswordMismatch(false);  // Set mismatch state to false if passwords match
        }
  };

    
    return(
        <div className ="pt-20 w-full">
            <HeaderTeal />
                <div>
                    <h1 className='text-5xl font-bold'>Register</h1>
                    <div className="flex flex-col justify-center items-center w-full h-100 bg-darkteal rounded-3xl shadow-lg space-y-3">
                        <input className="h-10 w-50 rounded-md justify-center flex items-center p-4 bg-white"
                            type="ucid"
                            placeholder="UCID"
                            value={ucid}
                            onChange={(e) => setUcid(e.target.value)}  
                            />
                        <input className="h-10 w-50 rounded-md justify-center flex items-center p-4 bg-white"
                            type="name"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)} 
                            />
                        <input className="h-10 w-50 rounded-md justify-center flex items-center p-4 bg-white"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}  
                            />
                        <input className="h-10 w-50 rounded-md justify-center flex items-center p-4 bg-white"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}  
                            />
                        <input className="h-10 w-50 rounded-md justify-center flex items-center p-4 bg-white"
                            type="password"
                            placeholder="Re Enter Password"
                            value={password_copy}
                            onChange={(e) => checkPasswordMatch(e.target.value)}  
                            />

                        {errorMessage && (
                            <p className="text-red-500 font-semibold">{errorMessage}</p>
                        )}
                        <div className="flex space-x-5" >
                            <button className="h-10 w-1/8 rounded-md justify-center flex items-center p-4" onClick={handleBack}>back</button>
                            <button className="h-10 w-1/2 rounded-md justify-center flex items-center p-4" onClick={handleSubmit}>Submit</button>
                        </div>
                    </div>
                </div>
        </div>
    )
}

export default RegisterPage;