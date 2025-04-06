"use client"

export function DentalChartSVG() {
  return (
    <div className="w-full max-w-md mx-auto bg-white">
      <svg viewBox="0 0 400 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
        {/* Oval path for teeth arrangement */}
        <ellipse cx="200" cy="250" rx="150" ry="200" fill="none" stroke="none" />

        {/* Upper teeth - front */}
        <g transform="translate(160, 60)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(190, 55)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(220, 55)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(250, 60)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        {/* Upper teeth - sides */}
        <g transform="translate(130, 75)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(280, 75)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        {/* Upper teeth - X pattern */}
        <g transform="translate(105, 100)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(305, 100)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(85, 130)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(325, 130)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        {/* Upper teeth - star pattern */}
        <g transform="translate(70, 165)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(340, 165)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(60, 205)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(350, 205)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        {/* Labels */}
        <text x="30" y="270" fontSize="14" fontWeight="500" fill="#000">
          Right
        </text>
        <text x="350" y="270" fontSize="14" fontWeight="500" fill="#000">
          Left
        </text>

        {/* Lower teeth - star pattern */}
        <g transform="translate(60, 335)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(350, 335)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(70, 375)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(340, 375)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M0,-10 L0,10 M-10,0 L10,0 M-7,-7 L7,7 M-7,7 L7,-7" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        {/* Lower teeth - X pattern */}
        <g transform="translate(85, 410)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(325, 410)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(105, 440)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(305, 440)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-10 L10,10 M-10,10 L10,-10" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        {/* Lower teeth - sides */}
        <g transform="translate(130, 465)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(280, 465)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        {/* Lower teeth - front */}
        <g transform="translate(160, 480)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(190, 485)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(220, 485)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>

        <g transform="translate(250, 480)">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#999" strokeWidth="2" />
          <path d="M-10,-5 C-5,-15 5,-15 10,-5" fill="none" stroke="#999" strokeWidth="2" />
        </g>
      </svg>
    </div>
  )
}

