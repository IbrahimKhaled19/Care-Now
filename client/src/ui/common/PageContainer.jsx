function PageContainer({ children, className = "" }) {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 ${className}`}>{children}</div>
  );
}

import PropTypes from "prop-types";

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default PageContainer;
