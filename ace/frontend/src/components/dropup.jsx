import React, { useRef, useEffect } from "react";

// Close dropdown when clicking outside it
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function PersonaDropup({ open, personas, selected, onSelect, onClose }) {
  const menuRef = useRef(null);
  useOnClickOutside(menuRef, onClose);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute bottom-full mb-2 right-0 z-20 w-56 rounded-xl border bg-white shadow-lg ring-1 ring-black/5"
    >
      <div className="max-h-64 overflow-auto py-1">
        {personas.map((p) => {
          const isSelected = p.id === selected;
          return (
            <button
              key={p.id}
              role="menuitem"
              onClick={() => {
                onSelect(p.id);
                onClose();
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                isSelected ? "font-medium text-blue-700" : "text-gray-800"
              }`}
            >
              {p.name}
              {p.role}
              {isSelected && <span className="text-xs opacity-70"> • current</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
