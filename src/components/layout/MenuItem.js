"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../common/Icon";
import PropTypes from "prop-types";

function SubMenu({ items, pathname }) {
  return (
    <div className="ms-4 mt-1 d-flex flex-column gap-1">
      {items.map((child) => {
        const isActiveChild =
          pathname === child.href || pathname.startsWith(`${child.href}/`);
        return (
          <Link
            key={child.label}
            href={child.href}
            className={`menu-item text-decoration-none ps-2 py-1 rounded-start-4 small ${
              isActiveChild ? "bg-white text-primary fw-bold" : "text-white"
            }`}
            style={{
              fontSize: "13px",
              transition: "background 0.3s ease",
            }}
          >
            {child.label}
          </Link>
        );
      })}
    </div>
  );
}

SubMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ).isRequired,
  pathname: PropTypes.string.isRequired,
};

function MenuLabel({ collapsed, label, color }) {
  if (collapsed) {
    return null;
  }
  return (
    <span className={`${color} fw-bold`} style={{ fontSize: "13px" }}>
      {label}
    </span>
  );
}

MenuLabel.propTypes = {
  collapsed: PropTypes.bool,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

function MenuChevron({ hasChildren, collapsed, open, color }) {
  if (!hasChildren || collapsed) {
    return null;
  }
  return (
    <div className="ms-auto d-flex align-items-center justify-content-end ps-2">
      <Icon name={open ? "chevron-down" : "chevron-right"} cssClass={color} />
    </div>
  );
}

MenuChevron.propTypes = {
  hasChildren: PropTypes.bool,
  collapsed: PropTypes.bool,
  open: PropTypes.bool,
  color: PropTypes.string.isRequired,
};

export default function MenuItem({
  icon,
  label,
  href,
  collapsed,
  menuItems,
  open,
  onToggle,
}) {
  const hasChildren = !!menuItems && menuItems.length > 0;
  const pathname = usePathname();
  const isActive =
    href &&
    !hasChildren &&
    (pathname === href || pathname.startsWith(`${href}/`));
  const isParentOfActive =
    hasChildren &&
    menuItems.some(
      (child) =>
        pathname === child.href || pathname.startsWith(`${child.href}/`)
    );
  const color = "text-white";

  useEffect(() => {
    if (isParentOfActive && !open && !collapsed && onToggle) {
      onToggle();
    }
  }, [pathname, isParentOfActive, open, collapsed]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  const MainTag = hasChildren ? "div" : Link;

  const mainTagProps = {
    ...(hasChildren ? {} : { href: href }),
    className: `menu-item d-flex align-items-center justify-content-between p-2 rounded-start-4 w-100 border-0 ${
      isActive || isParentOfActive ? "active-menu" : ""
    } ${hasChildren ? "" : "text-decoration-none"}`,
    style: {
      cursor: "pointer",
      transition: "background 0.3s ease",
    },
    onClick: hasChildren ? onToggle : undefined,
    onKeyDown: hasChildren ? handleKeyDown : undefined,
    "aria-label": label,
    ...(hasChildren && { "aria-expanded": open }),
  };

  return (
    <div
      data-tooltip-id="menu-tooltip"
      data-tooltip-content={collapsed ? label : ""}
      className="w-100"
    >
      <MainTag {...mainTagProps}>
        <div
          className={`d-flex align-items-center flex-grow-1 ${
            collapsed ? "justify-content-center" : ""
          }`}
        >
          <Icon name={icon} cssClass={`me-2 ${color}`} />
          <MenuLabel collapsed={collapsed} label={label} color={color} />
        </div>

        <MenuChevron
          hasChildren={hasChildren}
          collapsed={collapsed}
          open={open}
          color={color}
        />
      </MainTag>

      {hasChildren && open && !collapsed && (
        <SubMenu items={menuItems} pathname={pathname} />
      )}
    </div>
  );
}

MenuItem.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  href: PropTypes.string,
  collapsed: PropTypes.bool,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ),
  open: PropTypes.bool,
  onToggle: PropTypes.func,
};
