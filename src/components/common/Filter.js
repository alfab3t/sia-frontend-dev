import PropTypes from "prop-types";
import Button from "./Button";

export default function Filter({ children, onClick }) {
  return (
    <>
      <Button
        iconName="funnel"
        classType="primary dropdown-toggle border-start"
        title="Saring atau Urutkan Data"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
      />
      <div className="dropdown-menu p-4 rounded-4" style={{ width: "350px" }}>
        {children}
        <div className="d-flex justify-content-end">
          <Button
            classType="primary "
            iconName="save"
            title="Terapkan"
            label="Terapkan"
            onClick={onClick}
          />
        </div>
      </div>
    </>
  );
}

Filter.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
};
