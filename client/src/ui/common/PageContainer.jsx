function PageContainer({ children, className = "" }) {
  return (
    <div className={`p-6 lg:p-8 ${className}`}>{children}</div>
  );
}

export default PageContainer;
