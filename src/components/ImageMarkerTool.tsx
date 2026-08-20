import React, { useState, useRef, useEffect } from 'react';
import './ImageMarkerTool.css';

interface Marker {
  id: string;
  x: number; // porcentaje (0-100)
  y: number; // porcentaje (0-100)
  label: string;
}

interface ImageMarkerToolProps {
  imageUrl?: string;
  initialMarkers?: Marker[];
  onMarkersChange?: (markers: Marker[]) => void;
}

const ImageMarkerTool: React.FC<ImageMarkerToolProps> = ({
  imageUrl,
  initialMarkers = [],
  onMarkersChange,
}) => {
  const [markers, setMarkers] = useState<Marker[]>(initialMarkers);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [editingLabel, setEditingLabel] = useState('');
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cargar imagen desde URL o input
  useEffect(() => {
    if (imageUrl) {
      setImageData(imageUrl);
    }
  }, [imageUrl]);

  // Manejar carga de imagen local
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Actualizar dimensiones de imagen cuando carga
  const handleImageLoad = () => {
    if (imgRef.current) {
      setImageDimensions({
        width: imgRef.current.width,
        height: imgRef.current.height,
      });
      drawMarkers();
    }
  };

  // Dibujar marcadores en canvas
  const drawMarkers = () => {
    if (!canvasRef.current || !imageContainerRef.current) return;

    const canvas = canvasRef.current;
    const container = imageContainerRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar marcadores
    markers.forEach((marker) => {
      const x = (marker.x / 100) * canvas.width;
      const y = (marker.y / 100) * canvas.height;
      const isSelected = marker.id === selectedMarkerId;

      // Círculo del marcador
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 12 : 8, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#FF4444' : '#FF6B6B';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Número/etiqueta
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(marker.label, x, y);

      // Sombra si está seleccionado
      if (isSelected) {
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  // Redibujar cuando cambian marcadores
  useEffect(() => {
    drawMarkers();
    onMarkersChange?.(markers);
  }, [markers, selectedMarkerId]);

  // Manejar click en canvas para agregar/seleccionar marcador
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageContainerRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / canvas.width) * 100;
    const y = ((e.clientY - rect.top) / canvas.height) * 100;

    // Verificar si clickeó en un marcador existente
    let clickedMarker: Marker | null = null;
    for (let marker of markers) {
      const markerX = (marker.x / 100) * canvas.width;
      const markerY = (marker.y / 100) * canvas.height;
      const distance = Math.sqrt(
        Math.pow(markerX - (e.clientX - rect.left), 2) +
        Math.pow(markerY - (e.clientY - rect.top), 2)
      );
      if (distance < 15) {
        clickedMarker = marker;
        break;
      }
    }

    if (clickedMarker) {
      setSelectedMarkerId(clickedMarker.id);
      setEditingLabel(clickedMarker.label);
    } else {
      // Agregar nuevo marcador
      const newMarker: Marker = {
        id: Date.now().toString(),
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        label: (markers.length + 1).toString(),
      };
      setMarkers([...markers, newMarker]);
      setSelectedMarkerId(newMarker.id);
      setEditingLabel(newMarker.label);
    }
  };

  // Actualizar posición de marcador (draggable)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMarkerId || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Mostrar cursor de movimiento si está sobre un marcador seleccionado
    const marker = markers.find((m) => m.id === selectedMarkerId);
    if (marker) {
      const markerX = (marker.x / 100) * canvas.width;
      const markerY = (marker.y / 100) * canvas.height;
      const distance = Math.sqrt(
        Math.pow(markerX - (e.clientX - rect.left), 2) +
        Math.pow(markerY - (e.clientY - rect.top), 2)
      );
      canvas.style.cursor = distance < 15 ? 'grab' : 'crosshair';
    }
  };

  // Manejar movimiento de marcador (drag)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMarkerId || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const marker = markers.find((m) => m.id === selectedMarkerId);

    if (!marker) return;

    const markerX = (marker.x / 100) * canvas.width;
    const markerY = (marker.y / 100) * canvas.height;
    const distance = Math.sqrt(
      Math.pow(markerX - (e.clientX - rect.left), 2) +
      Math.pow(markerY - (e.clientY - rect.top), 2)
    );

    if (distance > 15) return; // No está sobre el marcador

    const startX = e.clientX;
    const startY = e.clientY;
    const startMarkerX = marker.x;
    const startMarkerY = marker.y;

    const handleDragMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / canvas.width;
      const deltaY = (moveEvent.clientY - startY) / canvas.height;

      const newX = Math.max(0, Math.min(100, startMarkerX + deltaX * 100));
      const newY = Math.max(0, Math.min(100, startMarkerY + deltaY * 100));

      setMarkers(
        markers.map((m) =>
          m.id === selectedMarkerId
            ? {
                ...m,
                x: Math.round(newX * 10) / 10,
                y: Math.round(newY * 10) / 10,
              }
            : m
        )
      );
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      canvas.style.cursor = 'crosshair';
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    canvas.style.cursor = 'grabbing';
  };

  // Actualizar etiqueta del marcador seleccionado
  const handleLabelChange = (newLabel: string) => {
    setEditingLabel(newLabel);
    setMarkers(
      markers.map((m) =>
        m.id === selectedMarkerId ? { ...m, label: newLabel } : m
      )
    );
  };

  // Eliminar marcador seleccionado
  const deleteSelectedMarker = () => {
    if (!selectedMarkerId) return;
    setMarkers(markers.filter((m) => m.id !== selectedMarkerId));
    setSelectedMarkerId(null);
    setEditingLabel('');
  };

  // Exportar datos de marcadores como JSON
  const exportMarkers = () => {
    const dataStr = JSON.stringify(markers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marcadores.json';
    link.click();
  };

  return (
    <div className="image-marker-tool">
      <div className="tool-header">
        <h2>📍 Herramienta de Marcadores</h2>
      </div>

      {/* Sección de carga de imagen */}
      <div className="image-upload-section">
        <label htmlFor="image-input" className="upload-label">
          {imageData ? '📸 Cambiar imagen' : '📸 Cargar imagen'}
        </label>
        <input
          id="image-input"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="image-input"
        />
      </div>

      {/* Canvas y imagen */}
      {imageData && (
        <div className="image-container" ref={imageContainerRef}>
          <img
            ref={imgRef}
            src={imageData}
            alt="Preparado histológico"
            onLoad={handleImageLoad}
            className="background-image"
          />
          <canvas
            ref={canvasRef}
            className="marker-canvas"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            title="Click para agregar marcador, arrastra para mover"
          />
        </div>
      )}

      {/* Panel de control */}
      <div className="control-panel">
        <div className="info-section">
          <h3>ℹ️ Instrucciones</h3>
          <ul>
            <li>Haz <strong>click en la imagen</strong> para agregar un marcador</li>
            <li><strong>Arrastra</strong> un marcador para moverlo</li>
            <li>Selecciona un marcador para editar su etiqueta</li>
          </ul>
        </div>

        {/* Editor del marcador seleccionado */}
        {selectedMarkerId && (
          <div className="marker-editor">
            <h3>✏️ Editar Marcador</h3>
            <div className="editor-row">
              <label>Etiqueta:</label>
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Nombre o número"
                className="label-input"
              />
            </div>
            <div className="editor-row">
              <label>Posición: X={markers.find(m => m.id === selectedMarkerId)?.x.toFixed(1)}% Y={markers.find(m => m.id === selectedMarkerId)?.y.toFixed(1)}%</label>
            </div>
            <button
              onClick={deleteSelectedMarker}
              className="btn btn-danger"
            >
              🗑️ Eliminar Marcador
            </button>
          </div>
        )}

        {/* Lista de marcadores */}
        <div className="markers-list">
          <h3>📍 Marcadores ({markers.length})</h3>
          {markers.length === 0 ? (
            <p className="empty-state">Aún no hay marcadores. Haz click en la imagen para agregar uno.</p>
          ) : (
            <div className="markers-grid">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className={`marker-item ${
                    marker.id === selectedMarkerId ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setSelectedMarkerId(marker.id);
                    setEditingLabel(marker.label);
                  }}
                >
                  <div className="marker-badge">{marker.label}</div>
                  <div className="marker-coords">
                    X: {marker.x.toFixed(1)}%
                    <br />
                    Y: {marker.y.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="action-buttons">
          <button
            onClick={exportMarkers}
            className="btn btn-primary"
            disabled={markers.length === 0}
          >
            💾 Exportar Datos
          </button>
          <button
            onClick={() => {
              setMarkers([]);
              setSelectedMarkerId(null);
              setEditingLabel('');
            }}
            className="btn btn-secondary"
            disabled={markers.length === 0}
          >
            🔄 Limpiar Todo
          </button>
        </div>
      </div>

      {/* Vista previa JSON */}
      <div className="json-preview">
        <h3>📋 JSON de Marcadores</h3>
        <pre>{JSON.stringify(markers, null, 2)}</pre>
      </div>
    </div>
  );
};

export default ImageMarkerTool;
