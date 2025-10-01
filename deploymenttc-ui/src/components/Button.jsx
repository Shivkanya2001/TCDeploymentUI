export default function Button({
  children,
  onClick,
  color = "blue",
  disabled,
}) {
  const base = "px-6 py-1 rounded-lg font-medium transition";
  const colors = {
    blue: "bg-[#0072b1] text-white hover:bg-blue-700",
    gray: "bg-gray-300 text-gray-700 hover:bg-gray-400",
    green: "bg-green-600 text-white hover:bg-green-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${colors[color]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
