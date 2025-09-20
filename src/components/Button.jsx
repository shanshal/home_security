export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 text-white';
  const variants = {
    primary:
      'bg-primary hover:opacity-90 focus:ring-primary focus:ring-offset-base-100',
    secondary:
      'bg-secondary ring-1 ring-base-300 hover:bg-base-200 focus:ring-secondary',
    success:
      'bg-success hover:opacity-90 focus:ring-success focus:ring-offset-base-100',
    error:
      'bg-error hover:opacity-90 focus:ring-error focus:ring-offset-base-100',
  };

  const variantClasses = variants[variant] || variants.primary;

  return (
    <button className={`${base} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
