import React, { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE;

export default function TeamDropdown() {
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndTeams = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);

    try {
      //decode token
      const res = await fetch(`${API_BASE}/api/decode_token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;

      const decoded = await res.json();
      const currentUserId = decoded.current_user;

      //fetch user's team
      const userRes = await fetch(`${API_BASE}/api/team/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      setUserTeam(userData.team || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndTeams();
  }, []);

  if (loading) return <p>Loading teams...</p>;

  return (
    <div>
      <label className="block mb-2 font-bold">Your Team</label>
      {userTeam && userTeam.name ? (
        <p>{userTeam.name}</p>
      ) : (
        <p className="text-gray-500">Please login to see team info</p>
      )}
    </div>
  );
}