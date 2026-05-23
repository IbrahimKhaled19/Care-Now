function PageContainer({ children, className = "" }) {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 ${className}`}>{children}</div>
  );
}

export default PageContainer;
