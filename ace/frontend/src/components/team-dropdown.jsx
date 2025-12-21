import React, { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE;

export default function TeamDropdown() {
  const [userTeam, setUserTeam] = useState<{ name: String } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndTeams = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Decode token
      const res = await fetch(`${API_BASE}/api/decode_token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setUserTeam(null);
        return;
      }

      const decoded = await res.json();
      const currentUserId = decoded.current_user;

      // Fetch user's team
      const userRes = await fetch(`${API_BASE}/api/team/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) {
        setUserTeam(null);
        return;
      }

      const userData = await userRes.json();
      setUserTeam(userData?.team || null);
    } catch (err) {
      console.error(err);
      setUserTeam(null);
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
      {userTeam?.name ? (
        <p>{userTeam.name}</p>
      ) : (
        <p className="text-gray-500">Please login to see team info</p>
      )}
    </div>
  );
}