export const PulseLine = ({ className = '' }) => (
  <svg viewBox="0 0 200 40" className={className} fill="none" preserveAspectRatio="none">
    <polyline
      points="0,20 40,20 55,5 68,35 82,20 200,20"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pulse-path"
    />
  </svg>
);
