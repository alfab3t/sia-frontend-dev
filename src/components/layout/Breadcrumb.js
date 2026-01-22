import PropTypes from "prop-types";
import Link from "next/link";

export default function Breadcrumb({ title, items }) {
  return (
    <div>
      <h5 className="fw-bold mb-1 text-primary">{title}</h5>
      <nav className="mb-3" aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          {items.map((item, index) => (
            <li
              style={{ fontSize: "13px" }}
              key={item.label}
              className={`breadcrumb-item ${
                index === items.length - 1 ? "active" : ""
              }`}
              aria-current={index === items.length - 1 ? "page" : undefined}
            >
              {item.href ? (
                <Link href={item.href} className="text-decoration-none">
                  {item.label}
                </Link>
              ) : (
                item.label
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

Breadcrumb.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ).isRequired,
};
