import PropTypes from "prop-types";
import Loading from "../common/Loading";
import Breadcrumb from "./Breadcrumb";
import AdminLayout from "./AdminLayout";

export default function MainContent({
  title,
  breadcrumb,
  loading = false,
  children,
  layout,
}) {
  return (
    <>
      {layout === "Admin" ? (
        <AdminLayout>
          <div className="flex-grow-1 p-4 py-3">
            <Loading
              loading={loading}
              size={60}
              message="Memuat data, mohon tunggu..."
            />

            {title && breadcrumb && (
              <Breadcrumb title={title} items={breadcrumb} />
            )}

            {children}
          </div>
        </AdminLayout>
      ) : (
        <>{children}</>
      )}
    </>
  );
}

MainContent.propTypes = {
  title: PropTypes.string,
  breadcrumb: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  children: PropTypes.node,
  layout: PropTypes.string,
};
