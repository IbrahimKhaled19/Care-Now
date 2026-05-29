function Card({ children, className = "", padding = true, style }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 ${padding ? "p-5" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

export default Card;
