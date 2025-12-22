import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE;

export default function TeamDropdown() {
  const navigate = useNavigate();
  const [userTeam, setUserTeam] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUserAndTeams = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);

    try {
      const res = await fetch(`${API_BASE}/api/decode_token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;

      const decoded = await res.json();
      const currentUserId = decoded.current_user;

      // fetch user's team
      const userRes = await fetch(`${API_BASE}/api/team/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      setUserTeam(userData.team || null);

      // fetch all teams
      const teamsRes = await fetch(`${API_BASE}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamsData = await teamsRes.json();
      setAllTeams(teamsData.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndTeams();
  }, []);

  const handleJoinTeam = async (teamId) => {
    const teamPassword = prompt("Enter team password:");
    if (!teamPassword) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/join_team/${teamId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team_password: teamPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setUserTeam(allTeams.find((t) => t.team_id === teamId));
        localStorage.setItem("requiresTeam", false);
        alert("Successfully joined team! Please login.");
        navigate("/"); //need to log back in to reset team logic
      } else {
        alert(data.error || "Failed to join team");
      }
    } catch (err) {
      console.error("Join team error:", err);
      alert("Failed to join team");
    }
  };

  if (loading) return <p>Loading teams...</p>;

  // Filter teams based on search term
  const filteredTeams = allTeams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <label className="block mb-2 font-bold">Your Team</label>
      {userTeam ? (
        <p>{userTeam.name}</p>
      ) : (
        <div>
          <p>No team joined</p>
          {/* Search input */}
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2 p-1 border rounded w-full"
          />
          <ul>
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <li
                  key={team.team_id}
                  className="flex justify-between items-center my-1"
                >
                  <span>{team.name}</span>
                  <button
                    className="px-2 py-1 bg-teal-500 text-white rounded"
                    onClick={() => handleJoinTeam(team.team_id)}
                  >
                    Join
                  </button>
                </li>
              ))
            ) : (
              <li>No teams found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}