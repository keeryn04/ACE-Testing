import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE;

export default function TeamDropdown() {
  const navigate = useNavigate();
  const [userTeam, setUserTeam] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamPassword, setTeamPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

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

  const handleJoinTeam = (teamId) => {
    setSelectedTeamId(teamId);
    setTeamPassword("");
    setJoinError("");
    setShowJoinModal(true);
  };

  const submitJoinTeam = async () => {
    if (!teamPassword.trim()) {
      setJoinError("Team password is required");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setJoining(true);
      setJoinError("");

      const res = await fetch(`${API_BASE}/api/join_team/${selectedTeamId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team_password: teamPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join team");
      }

      setUserTeam(allTeams.find((t) => t.team_id === selectedTeamId));
      localStorage.setItem("requiresTeam", false);

      setShowJoinModal(false);
      alert("Successfully joined team! Please login.");
      navigate("/");
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
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
          {showJoinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
                <h2 className="text-lg font-semibold mb-2">Join Team</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the password to join this team.
                </p>

                <input
                  type="password"
                  value={teamPassword}
                  onChange={(e) => setTeamPassword(e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="Team password"
                  autoFocus
                />

                {joinError && (
                  <div className="text-sm text-red-600 mb-2">
                    {joinError}
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="px-3 py-1 rounded border"
                    disabled={joining}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={submitJoinTeam}
                    disabled={joining}
                    className="px-4 py-1 rounded bg-teal-600 text-white disabled:opacity-60"
                  >
                    {joining ? "Joining…" : "Join"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}