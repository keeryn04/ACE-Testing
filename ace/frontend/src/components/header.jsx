import React, { useState, useRef, useEffect } from "react";
import "../index.css"
import TeamDropdown from "./team-dropdown";
import { useNavigate } from "react-router-dom";


const API_BASE = import.meta.env.VITE_API_BASE;

const HeaderTeal = ({ onTutorial }) => {
  const navigate = useNavigate();
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleProfileClick = () => {
    setShowTeamDropdown((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTeamDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await fetch(`${API_BASE}/api/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <div className="sticky w-screen left-0 top-0 h-20 bg-darkteal rounded-b-xl shadow-md z-50">
      <div className="flex justify-between w-full h-full">
        <div className="flex flex-col justify-start pl-1 pt-1">
          <h1 className="font-semibold italic pl-10">ACE</h1>
          <p className="text-sm pl-10">AI Client for Engineering</p>
        </div>

        <div className="flex flex-1 justify-end pr-10 items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button onClick={handleProfileClick}>Profile</button>
            {showTeamDropdown && (
              <div className="absolute right-0 mt-2 z-50 bg-white border rounded shadow">
                <TeamDropdown />
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>

          {onTutorial && (
            <button onClick={onTutorial}>
              Tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderTeal;