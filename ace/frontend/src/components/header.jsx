import React, { useState, useRef, useEffect } from "react";
import "../index.css"
import { useNavigate } from "react-router-dom";
import TeamDropdown from "./team-dropdown";

const API_BASE = import.meta.env.VITE_API_BASE;

const HeaderTeal = () => {
  const navigate = useNavigate();
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleAboutClick = () => {
    navigate("/about");  //Navigate to the about page
  };

  const handleProfileClick = () => {
    setShowTeamDropdown((prev) => !prev);  //Dropdown for profile
  };

  const handleChatClick = () => {
    navigate("/chat");  // Navigate to the chat page
  };

  //close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowTeamDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //open profile for team adding after login
  useEffect(() => {
    const shouldOpenProfile = localStorage.getItem("requiresTeam");

    if (shouldOpenProfile === "true") {
        setShowTeamDropdown(true);
    }
  }, []);

  return (
    <div className="fixed w-screen left-0 top-0 h-20 bg-darkteal rounded-b-xl border-1 shadow-md z-50">
      <div className="flex justify-between w-full h-full">
        <div className="flex flex-col justify-start pl-1 pt-1">
          <h1 className="font-semibold italic">ACE</h1>
          <p className="text-sm">AI Client for Engineering</p>
        </div>
        <div className="flex flex-1 justify-evenly items-center relative">
          <button onClick={handleAboutClick}>About</button>

          <button onClick={handleChatClick}>Chat</button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleProfileClick}
              className="px-2 py-1 rounded bg-gray-300"
            >
              Profile
            </button>

            {showTeamDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded border z-50">
                <TeamDropdown />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderTeal;