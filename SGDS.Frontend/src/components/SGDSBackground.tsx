import React from "react";

interface CircuitProps {
  path: string;
  delay?: string;
  duration?: string;
  green?: boolean;
}

const Circuit = ({
  path,
  delay = "0s",
  duration = "4s",
  green = false,
}: CircuitProps) => {
  return (
    <g>
      {/* Línea base */}
      <path
        d={path}
        fill="none"
        stroke={green ? "#8FA65A" : "#1687D9"}
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />

      {/* Línea animada */}
      <path
        d={path}
        fill="none"
        stroke={green ? "#A9C66A" : "#31A8FF"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="8 180"
        className="circuit-flow"
        style={{
          animationDelay: delay,
          animationDuration: duration,
        }}
      />
    </g>
  );
};

const Node = ({
  cx,
  cy,
  green = false,
}: {
  cx: number;
  cy: number;
  green?: boolean;
}) => {
  return (
    <g>
      {/* Halo */}
      <circle
        cx={cx}
        cy={cy}
        r="8"
        fill={green ? "#8FA65A" : "#1687D9"}
        opacity="0.08"
      />

      {/* Nodo */}
      <circle
        cx={cx}
        cy={cy}
        r="3"
        fill={green ? "#A9C66A" : "#31A8FF"}
        className="circuit-node"
      />
    </g>
  );
};

const SGDSBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F0F0FA]">

      {/* =====================================================
          GRADIENTES DE FONDO
      ====================================================== */}

      <div
        className="
          absolute
          -left-40
          -top-40
          h-[500px]
          w-[500px]
          rounded-full
          bg-[#1687D9]/50
          blur-[120px]
        "
      />

      <div
        className="
          absolute
          -bottom-40
          -right-40
          h-[500px]
          w-[500px]
          rounded-full
          bg-[#1687D9]/50
          blur-[120px]
        "
      />

      {/* =====================================================
          GRID TECNOLÓGICO
      ====================================================== */}

      <div
        className="
          absolute
          inset-0
          opacity-[0.06]
          [background-image:linear-gradient(rgba(60,160,230,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(60,160,230,0.5)_1px,transparent_1px)]
          [background-size:45px_45px]
        "
      />

      {/* =====================================================
          SVG PRINCIPAL
      ====================================================== */}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >

        {/* =================================================
            ANILLOS HUD
        ================================================== */}

        <g
          className="hud-rotate"
          style={{
            transformOrigin: "960px 540px",
          }}
        >
           
            <circle
                cx="960"
                cy="540"
                r="420"
                fill="none"
                stroke="#0B1E4D"
                strokeWidth="1"
                strokeOpacity="0.5"
            />

            <circle
                cx="960"
                cy="540"
                r="470"
                fill="none"
                stroke="#0B1E4D"
                strokeWidth="1"
                strokeDasharray="4 12"
                strokeOpacity="0.4"
            />

            <circle
                cx="960"
                cy="540"
                r="520"
                fill="none"
                stroke="#0B1E4D"
                strokeWidth="1"
                strokeOpacity="0.5"
             />
        </g>

        <g
            className="hud-rotate-reverse"
            style={{ 
                transformOrigin: "960px 540px" 
            }}
        >
            <circle 
                cx="960" 
                cy="540" 
                r="350" 
                fill="none" 
                stroke="#0B1E4D" 
                strokeWidth="1" 
                strokeDasharray="4 12" 
                strokeOpacity="0.3" 
            />
        
        <g
            className="hud-rotate-reverse"
            style={{ 
                transformOrigin: "960px 540px" 
            }}
        ></g>

            <circle 
                cx="960" 
                cy="540" 
                r="570" 
                fill="none" 
                stroke="#0B1E4D" 
                strokeWidth="1" 
                strokeDasharray="4 12" 
                strokeOpacity="0.3" 
            />
        </g>

        {/* =================================================
            CIRCUITOS IZQUIERDOS
        ================================================== */}

        <Circuit
          path="M0 150 H120 L160 190 H300 L340 150 H450"
          duration="5s"
        />

        <Circuit
          path="M0 300 H170 L210 340 H380 L420 300 H520"
          delay="1s"
          duration="6s"
        />

        <Circuit
          path="M0 720 H150 L190 680 H330 L370 720 H500"
          delay="2s"
          duration="5s"
          green
        />

        <Circuit
          path="M0 880 H180 L220 840 H400 L440 880 H560"
          delay="0.5s"
          duration="7s"
        />

        {/* =================================================
            CIRCUITOS DERECHOS
        ================================================== */}

        <Circuit
          path="M1920 180 H1800 L1760 220 H1630 L1590 180 H1480"
          delay="1s"
          duration="5s"
        />

        <Circuit
          path="M1920 360 H1810 L1770 400 H1650 L1610 360 H1510"
          delay="2s"
          duration="6s"
        />

        <Circuit
          path="M1920 700 H1800 L1760 660 H1630 L1590 700 H1480"
          delay="1.5s"
          duration="5s"
          green
        />

        <Circuit
          path="M1920 870 H1790 L1750 830 H1600 L1560 870 H1460"
          delay="3s"
          duration="7s"
        />

        {/* =================================================
            NODOS IZQUIERDOS
        ================================================== */}

        <Node cx={160} cy={190} />
        <Node cx={300} cy={190} />
        <Node cx={210} cy={340} />
        <Node cx={380} cy={340} />

        <Node
          cx={190}
          cy={680}
          green
        />

        <Node
          cx={330}
          cy={680}
          green
        />

        <Node cx={220} cy={840} />
        <Node cx={400} cy={840} />

        {/* =================================================
            NODOS DERECHOS
        ================================================== */}

        <Node cx={1760} cy={220} />
        <Node cx={1630} cy={220} />

        <Node cx={1770} cy={400} />
        <Node cx={1650} cy={400} />

        <Node
          cx={1760}
          cy={660}
          green
        />

        <Node
          cx={1630}
          cy={660}
          green
        />

        <Node cx={1750} cy={830} />
        <Node cx={1600} cy={830} />

        {/* =================================================
            PUNTOS DECORATIVOS
        ================================================== */}

        <circle
          cx="100"
          cy="500"
          r="2"
          fill="#31A8FF"
          className="particle"
        />

        <circle
          cx="300"
          cy="100"
          r="2"
          fill="#31A8FF"
          className="particle"
        />

        <circle
          cx="1800"
          cy="520"
          r="2"
          fill="#31A8FF"
          className="particle"
        />

        <circle
          cx="1650"
          cy="950"
          r="2"
          fill="#A9C66A"
          className="particle"
        />

        <circle
          cx="250"
          cy="930"
          r="2"
          fill="#A9C66A"
          className="particle"
        />

      </svg>

      {/* =====================================================
          VIÑETA
      ====================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,transparent_30%,rgba(2,10,25,0.45)_100%)]
        "
      />

    </div>
  );
};

export default SGDSBackground;