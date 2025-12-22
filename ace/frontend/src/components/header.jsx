import React, { useState, useRef, useEffect } from "react";
import "../index.css"
import TeamDropdown from "./team-dropdown";

const API_BASE = import.meta.env.VITE_API_BASE;

const HeaderTeal = () => {
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleProfileClick = () => {
    setShowTeamDropdown((prev) => !prev);  //Dropdown for profile
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

  return (
    <div className="sticky w-screen left-0 top-0 h-20 bg-darkteal rounded-b-xl border-1 shadow-md z-50">
      <div className="flex justify-between w-full h-full">
        <div className="flex flex-col justify-start pl-1 pt-1">
          <h1 className="font-semibold italic pl-10">ACE</h1>
          <p className="text-sm pl-10">AI Client for Engineering</p>
        </div>
        <div className="flex flex-1 justify-end pr-10 items-center gap-2">
          <div className="relative">
            <button onClick={handleProfileClick}>Profile</button>
            {showTeamDropdown && (
              <div className="absolute right-0 mt-2 z-50">
                <TeamDropdown />
              </div>
            )}
          </div>
          <button>Tutorial</button>
        </div>
      </div>
    </div>
  );
};

export default HeaderTeal;