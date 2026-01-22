import PropTypes from "prop-types";
import Button from "../common/Button";
import NotificationIcon from "./NotificationIcon";
import UserProfile from "./UserProfile";
import { getUserData } from "@/context/user";
import { useMemo } from "react";

export default function Topbar({ onToggle, marginLeft }) {
  const userData = useMemo(() => getUserData(), []);
  const userName = userData?.nama || "Unknown";
  const userRole = userData?.role || "Unknown";

  return (
    <div
      className="d-flex justify-content-between align-items-center pe-4 py-2 border-bottom bg-white w-100"
      style={{
        height: 65,
        paddingLeft: marginLeft,
        top: 0,
        right: 0,
        position: "fixed",
        zIndex: 1000,
      }}
    >
      <Button
        onClick={onToggle}
        classType="link text-primary d-lg-inline-flex ps-3"
        iconName="list"
        cssIcon="fs-1"
      />

      <div className="d-flex align-items-center ms-auto">
        <NotificationIcon />
        <UserProfile name={userName} role={userRole} />
      </div>
    </div>
  );
}

Topbar.propTypes = {
  onToggle: PropTypes.func.isRequired,
  marginLeft: PropTypes.string,
};
