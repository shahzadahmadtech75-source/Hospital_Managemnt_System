const SectionPulseDivider = ({ id = 'pulseFade', color = '#23a609' }) => (
  <div style={{ position: 'relative', padding: '1.5rem 0', overflow: 'hidden' }}>
    <svg
      viewBox="0 0 800 40"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '32px', display: 'block', color }}
      fill="none"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="15%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="85%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points="0,20 320,20 350,20 365,4 380,36 395,20 410,20 480,20 800,20"
        stroke={`url(#${id})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export default SectionPulseDivider;