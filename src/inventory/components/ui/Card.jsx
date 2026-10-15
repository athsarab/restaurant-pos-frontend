export default function Card({ title, children, actions, className = '' }) {
  return (
    <div className={`inventory-card ${className}`}>
      {(title || actions) && (
        <div className="inventory-card-header">
          <div className="font-medium text-foreground">{title}</div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}
      <div className="inventory-card-body">{children}</div>
    </div>
  );
}
