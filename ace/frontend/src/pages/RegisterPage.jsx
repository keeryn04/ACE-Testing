import React, { useState } from "react";
import "../index.css";
import { useNavigate } from "react-router-dom";
import HeaderTeal from "../components/header";

const API_BASE = import.meta.env.VITE_API_BASE;

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/register_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);

        if (data.requires_team) {
          localStorage.setItem("openProfile", "true");
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
    navigate("/");
  };

  return (
    <div className="pt-20 w-full">
      <HeaderTeal />

      <div>
        <h1 className="text-5xl font-bold">Register</h1>

        <div className="flex flex-col justify-center items-center w-full h-100 bg-darkteal rounded-3xl shadow-lg space-y-3">
          <input
            className="h-10 w-50 rounded-md p-4 bg-white"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="h-10 w-50 rounded-md p-4 bg-white"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="h-10 w-50 rounded-md p-4 bg-white"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {errorMessage && (
            <p className="text-red-500 font-semibold">{errorMessage}</p>
          )}

          <div className="flex space-x-5">
            <button
              className="h-10 w-1/8 rounded-md flex items-center justify-center p-4"
              onClick={handleBack}
            >
              Back
            </button>

            <button
              className="h-10 w-1/2 rounded-md flex items-center justify-center p-4"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;