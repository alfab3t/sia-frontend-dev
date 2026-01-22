import PropTypes from "prop-types";

export default function Card({ title, children, height }) {
  return (
    <div
      className="shadow-sm border"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        className="fw-bold px-3 py-2 border-bottom"
        style={{
          backgroundColor: "#f9fafb",
          fontSize: "14px",
        }}
      >
        {title}
      </div>

      <div className="p-3" style={{ fontSize: "14px", height: height }}>
        {children}
      </div>
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
