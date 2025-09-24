import { useState, useRef, useEffect } from "react";

export default function Triangles() {
  const [vertices, setVertices] = useState([
    { x: 300, y: 100 },   // Top vertex
    { x: 150, y: 350 },   // Bottom left
    { x: 450, y: 350 }    // Bottom right
  ]);

  const [dragging, setDragging] = useState(null);
  const [activeBadges, setActiveBadges] = useState([]);
  const svgRef = useRef(null);

  // Calculate angle at a vertex given three points
  const calculateAngle = (vertex, prev, next) => {
    const v1 = { x: prev.x - vertex.x, y: prev.y - vertex.y };
    const v2 = { x: next.x - vertex.x, y: next.y - vertex.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;

    let angle = Math.atan2(det, dot) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    if (angle > 180) angle = 360 - angle;

    return Math.round(angle);
  };

  // Calculate all three angles
  const getAngles = () => {
    const [v0, v1, v2] = vertices;
    return [
      calculateAngle(v0, v2, v1), // Angle at vertex 0
      calculateAngle(v1, v0, v2), // Angle at vertex 1
      calculateAngle(v2, v1, v0)  // Angle at vertex 2
    ];
  };

  // Calculate side lengths
  const getSideLengths = () => {
    const [v0, v1, v2] = vertices;
    const side1 = Math.sqrt(Math.pow(v1.x - v0.x, 2) + Math.pow(v1.y - v0.y, 2));
    const side2 = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
    const side3 = Math.sqrt(Math.pow(v0.x - v2.x, 2) + Math.pow(v0.y - v2.y, 2));
    return [side1, side2, side3];
  };

  // Classify triangle by sides
  const classifyBySides = () => {
    const [side1, side2, side3] = getSideLengths();
    const tolerance = 5; // Tolerance for "equal" sides due to pixel precision

    const isEqual = (a, b) => Math.abs(a - b) < tolerance;

    if (isEqual(side1, side2) && isEqual(side2, side3)) {
      return "Triángulo Equilátero";
    } else if (isEqual(side1, side2) || isEqual(side2, side3) || isEqual(side1, side3)) {
      return "Triángulo Isósceles";
    } else {
      return "Triángulo Escaleno";
    }
  };

  // Classify triangle by angles
  const classifyByAngles = () => {
    const angles = getAngles();
    const tolerance = 2; // Tolerance for angle comparison

    const hasRightAngle = angles.some(angle => Math.abs(angle - 90) < tolerance);
    const hasObtuseAngle = angles.some(angle => angle > 90 + tolerance);

    if (hasRightAngle) {
      return "Triángulo Rectángulo";
    } else if (hasObtuseAngle) {
      return "Triángulo Obtusángulo";
    } else {
      return "Triángulo Acutángulo";
    }
  };

  // Get complete triangle classification
  const getTriangleType = () => {
    const sideClassification = classifyBySides();
    const angleClassification = classifyByAngles();

    // Return both classifications
    return {
      primary: sideClassification,
      secondary: angleClassification
    };
  };

  // Triangle presets for badges
  const trianglePresets = {
    equilatero: [{ x: 300, y: 80 }, { x: 200, y: 300 }, { x: 400, y: 300 }],
    isosceles: [{ x: 300, y: 100 }, { x: 220, y: 350 }, { x: 380, y: 350 }],
    escaleno: [{ x: 280, y: 120 }, { x: 150, y: 350 }, { x: 450, y: 320 }],
    rectangulo: [{ x: 200, y: 100 }, { x: 200, y: 300 }, { x: 400, y: 300 }],
    obtusangulo: [{ x: 300, y: 250 }, { x: 150, y: 150 }, { x: 450, y: 350 }],
    acutangulo: [{ x: 300, y: 100 }, { x: 180, y: 320 }, { x: 420, y: 320 }]
  };

  // Check if badges can be combined based on mathematical rules
  const canCombine = (badge1, badge2) => {
    // Valid combinations based on triangle properties:
    const validCombinations = {
      'equilatero': ['acutangulo'], // Equilátero solo puede ser acutángulo (60° cada ángulo)
      'isosceles': ['acutangulo', 'rectangulo'], // Isósceles puede ser acutángulo o rectángulo
      'escaleno': ['acutangulo', 'rectangulo', 'obtusangulo'], // Escaleno puede ser cualquier tipo de ángulo
      'acutangulo': ['equilatero', 'isosceles', 'escaleno'],
      'rectangulo': ['isosceles', 'escaleno'], // Rectángulo no puede ser equilátero
      'obtusangulo': ['escaleno'] // Obtusángulo solo puede ser escaleno
    };

    return validCombinations[badge1]?.includes(badge2) || validCombinations[badge2]?.includes(badge1);
  };

  // Set triangle to specific type or toggle badge
  const handleBadgeClick = (type) => {
    const currentBadges = [...activeBadges];
    const badgeIndex = currentBadges.indexOf(type);

    if (badgeIndex >= 0) {
      // Badge is already active, remove it
      currentBadges.splice(badgeIndex, 1);
    } else {
      // Badge is not active, try to add it
      if (currentBadges.length === 0) {
        // No active badges, just add this one
        currentBadges.push(type);
      } else if (currentBadges.length === 1) {
        // One active badge, check if they can be combined
        if (canCombine(currentBadges[0], type)) {
          currentBadges.push(type);
        } else {
          // Replace the current badge
          currentBadges[0] = type;
        }
      } else {
        // Two badges already active, replace with this one
        currentBadges.length = 0;
        currentBadges.push(type);
      }
    }

    setActiveBadges(currentBadges);

    // If we have exactly one badge active, set the triangle shape
    if (currentBadges.length === 1) {
      setVertices(trianglePresets[currentBadges[0]]);
    }

    // If we have two compatible badges, try to create a combined shape
    if (currentBadges.length === 2) {
      const sideType = ['equilatero', 'isosceles', 'escaleno'].find(t => currentBadges.includes(t));
      const angleType = ['rectangulo', 'obtusangulo', 'acutangulo'].find(t => currentBadges.includes(t));

      // Create combined shapes based on valid combinations
      if (sideType === 'equilatero' && angleType === 'acutangulo') {
        // Equilátero acutángulo (triángulo equilátero perfecto)
        setVertices([{ x: 300, y: 80 }, { x: 200, y: 300 }, { x: 400, y: 300 }]);
      } else if (sideType === 'isosceles' && angleType === 'rectangulo') {
        // Isósceles rectángulo
        setVertices([{ x: 200, y: 100 }, { x: 200, y: 300 }, { x: 380, y: 300 }]);
      } else if (sideType === 'isosceles' && angleType === 'acutangulo') {
        // Isósceles acutángulo
        setVertices([{ x: 300, y: 100 }, { x: 220, y: 350 }, { x: 380, y: 350 }]);
      } else if (sideType === 'escaleno' && angleType === 'rectangulo') {
        // Escaleno rectángulo
        setVertices([{ x: 200, y: 100 }, { x: 200, y: 300 }, { x: 450, y: 320 }]);
      } else if (sideType === 'escaleno' && angleType === 'obtusangulo') {
        // Escaleno obtusángulo
        setVertices([{ x: 300, y: 250 }, { x: 150, y: 150 }, { x: 450, y: 350 }]);
      } else if (sideType === 'escaleno' && angleType === 'acutangulo') {
        // Escaleno acutángulo
        setVertices([{ x: 280, y: 120 }, { x: 150, y: 350 }, { x: 450, y: 320 }]);
      } else {
        // Default to the first badge's shape if combination not defined
        setVertices(trianglePresets[currentBadges[0]]);
      }
    }
  };


  // Get explanation text
  const getExplanation = () => {
    const { primary, secondary } = triangleType;

    const explanations = {
      "Triángulo Equilátero": "tiene los tres lados de igual longitud y todos sus ángulos miden 60°.",
      "Triángulo Isósceles": "tiene dos lados de igual longitud y dos ángulos iguales.",
      "Triángulo Escaleno": "tiene los tres lados de diferente longitud y todos sus ángulos son diferentes.",
      "Triángulo Rectángulo": "tiene un ángulo de exactamente 90° (ángulo recto).",
      "Triángulo Obtusángulo": "tiene un ángulo mayor a 90° (ángulo obtuso).",
      "Triángulo Acutángulo": "tiene todos sus ángulos menores a 90° (ángulos agudos)."
    };

    const items = [];
    if (primary && explanations[primary]) {
      items.push({ name: primary, explanation: explanations[primary] });
    }
    if (secondary && explanations[secondary]) {
      items.push({ name: secondary, explanation: explanations[secondary] });
    }

    return items;
  };

  const handleMouseDown = (index, e) => {
    e.preventDefault();
    setDragging(index);
  };

  const handleMouseMove = (e) => {
    if (dragging === null || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - svgRect.left) / svgRect.width) * 600;
    const y = ((e.clientY - svgRect.top) / svgRect.height) * 500;

    // Keep vertices within bounds with more margin
    const boundedX = Math.max(30, Math.min(570, x));
    const boundedY = Math.max(30, Math.min(470, y));

    setVertices(prev =>
      prev.map((vertex, index) =>
        index === dragging
          ? { x: boundedX, y: boundedY }
          : vertex
      )
    );

    // Update badges based on current shape after dragging
    // We'll do this in a useEffect to avoid calling it on every mouse move
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const pointsString = vertices.map(v => `${v.x},${v.y}`).join(' ');
  const angles = getAngles();
  const triangleType = getTriangleType();
  const explanation = getExplanation();

  // Auto-update badges when vertices change (but not when dragging from badge clicks)
  useEffect(() => {
    // Only auto-update if no dragging is happening
    if (dragging === null) {
      const { primary, secondary } = triangleType;
      const newBadges = [];

      // Convert triangle types to badge keys
      const sideTypeToBadge = {
        "Triángulo Equilátero": "equilatero",
        "Triángulo Isósceles": "isosceles",
        "Triángulo Escaleno": "escaleno"
      };

      const angleTypeToBadge = {
        "Triángulo Rectángulo": "rectangulo",
        "Triángulo Obtusángulo": "obtusangulo",
        "Triángulo Acutángulo": "acutangulo"
      };

      // Add corresponding badges
      if (sideTypeToBadge[primary]) {
        newBadges.push(sideTypeToBadge[primary]);
      }
      if (angleTypeToBadge[secondary]) {
        newBadges.push(angleTypeToBadge[secondary]);
      }

      // Only update if the combination is valid
      if (newBadges.length === 2 && canCombine(newBadges[0], newBadges[1])) {
        setActiveBadges(newBadges);
      } else if (newBadges.length === 1) {
        setActiveBadges(newBadges);
      } else if (newBadges.length === 0) {
        setActiveBadges([]);
      }
    }
  }, [vertices, dragging, triangleType]);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Triángulos</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Arrastra las esquinas del triángulo para modificar su forma
          </p>


          {/* Triangle type badges */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleBadgeClick('equilatero')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeBadges.includes('equilatero')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Equilátero
              </button>
              <button
                onClick={() => handleBadgeClick('isosceles')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeBadges.includes('isosceles')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Isósceles
              </button>
              <button
                onClick={() => handleBadgeClick('escaleno')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeBadges.includes('escaleno')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Escaleno
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleBadgeClick('rectangulo')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeBadges.includes('rectangulo')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Rectángulo
              </button>
              <button
                onClick={() => handleBadgeClick('obtusangulo')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeBadges.includes('obtusangulo')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Obtusángulo
              </button>
              <button
                onClick={() => handleBadgeClick('acutangulo')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeBadges.includes('acutangulo')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Acutángulo
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <svg
            ref={svgRef}
            width="600"
            height="500"
            viewBox="0 0 600 500"
            className="drop-shadow-lg rounded-lg bg-slate-50 dark:bg-slate-800/50"
            style={{ cursor: dragging !== null ? 'grabbing' : 'default' }}
          >
            <defs>
              <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* Grid lines for better reference */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Triangle */}
            <polygon
              points={pointsString}
              fill="url(#triangleGradient)"
              stroke="#3b82f6"
              strokeWidth="3"
              opacity="0.7"
            />

            {/* Angle labels */}
            {vertices.map((vertex, index) => {
              const angle = angles[index];
              // Calculate label position (offset from vertex)
              const offsetDistance = 25;
              let offsetX = 0;
              let offsetY = 0;

              // Position label based on vertex location
              if (index === 0) { // Top vertex
                offsetY = -offsetDistance;
              } else if (index === 1) { // Bottom left
                offsetX = -offsetDistance;
                offsetY = offsetDistance;
              } else { // Bottom right
                offsetX = offsetDistance;
                offsetY = offsetDistance;
              }

              return (
                <g key={`angle-${index}`}>
                  {/* Angle arc visualization */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r="15"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                  {/* Angle text */}
                  <text
                    x={vertex.x + offsetX}
                    y={vertex.y + offsetY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-sm font-semibold fill-purple-700 dark:fill-purple-300"
                    fontSize="14"
                  >
                    {angle}°
                  </text>
                </g>
              );
            })}

            {/* Draggable vertices */}
            {vertices.map((vertex, index) => (
              <g key={`vertex-${index}`}>
                {/* Vertex circle */}
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r="10"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="3"
                  className="cursor-grab hover:fill-red-500 transition-colors drop-shadow-sm"
                  style={{ cursor: dragging === index ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => handleMouseDown(index, e)}
                />
                {/* Vertex label */}
                <text
                  x={vertex.x}
                  y={vertex.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-bold fill-white pointer-events-none"
                  fontSize="10"
                >
                  {String.fromCharCode(65 + index)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-8 text-center space-y-6">
          {/* Explanations */}
          <div className="max-w-2xl mx-auto bg-slate-100 dark:bg-slate-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">
              ¿Qué estás viendo?
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
              {explanation.map((item, index) => (
                <p key={index}>
                  <strong>{item.name}:</strong> {item.explanation}
                </p>
              ))}
            </div>
          </div>

          {/* Angles panel */}
          <div className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Ángulos:</h3>
              {angles.map((angle, i) => (
                <div key={i}>
                  ∠{String.fromCharCode(65 + i)}: {angle}°
                </div>
              ))}
              <div className="mt-2 text-xs text-slate-500">
                Suma: {angles.reduce((sum, angle) => sum + angle, 0)}° (debe ser 180°)
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setVertices([
                  { x: 300, y: 100 },
                  { x: 150, y: 350 },
                  { x: 450, y: 350 }
                ]);
                setActiveBadges([]);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Resetear
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Volver al Menú
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}