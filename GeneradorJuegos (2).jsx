import React, { useState } from "react";
import { UploadCloud, Download, MonitorPlay } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Fix para producción en Vercel
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;


function GeneradorJuegos() {
  const [pdfFile, setPdfFile] = useState(null);
  const [juegos, setJuegos] = useState([]);
  const [presentacion, setPresentacion] = useState(false);
  const [indexActual, setIndexActual] = useState(0);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const extractTextFromPDF = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str).join(" ");
          fullText += strings + " ";
        }

        if (!fullText.trim()) {
          alert("No se pudo extraer texto del PDF. Verificá que no sea un escaneo o imagen.");
          return;
        }

        console.log("Texto extraído del PDF:", fullText);
        generarJuegos(fullText);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error al procesar el PDF:", error);
      alert("Hubo un error al procesar el PDF. Revisá la consola del navegador.");
    }
  };

  const generarJuegos = (texto) => {
    const bloques = texto.split(/\d+\.\s+/).slice(1);
    if (bloques.length === 0) {
      alert("No se encontraron preguntas en el formato esperado (1. ¿...? 2. ¿...?).");
      return;
    }

    const juegosGenerados = bloques.slice(0, 5).map((bloque) => {
      const [pregunta, ...resto] = bloque.split("?");
      const respuestaCompleta = resto.join("?").trim();
      const respuesta = respuestaCompleta.split(" ").slice(0, 15).join(" ") + "...";

      const palabras = respuestaCompleta.split(" ");
      const palabraClave = palabras[Math.floor(Math.random() * palabras.length)];
      const fraseIncompleta = respuestaCompleta.replace(palabraClave, "_____");

      return [
        {
          tipo: "multiple",
          pregunta: pregunta.trim() + "?",
          opciones: [respuesta, "Distractor 1", "Distractor 2", "Distractor 3"].sort(() => Math.random() - 0.5),
          correcta: respuesta
        },
        {
          tipo: "flashcard",
          pregunta: pregunta.trim() + "?",
          respuesta: respuestaCompleta
        },
        {
          tipo: "completar",
          pregunta: pregunta.trim() + "?",
          frase: fraseIncompleta,
          correcta: palabraClave
        }
      ];
    }).flat();

    setJuegos(juegosGenerados);
  };

  const descargarJuegos = () => {
    const blob = new Blob([JSON.stringify(juegos, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "juegos_obstetricia.json";
    link.click();
  };

  const iniciarPresentacion = () => {
    if (juegos.length === 0) return alert("Primero generá algunos juegos.");
    setIndexActual(0);
    setPresentacion(true);
  };

  const avanzar = () => {
    if (indexActual + 1 < juegos.length) {
      setIndexActual(indexActual + 1);
    } else {
      setPresentacion(false);
    }
  };

  const handleUpload = () => {
    if (!pdfFile) return alert("Subí un archivo PDF primero.");
    extractTextFromPDF(pdfFile);
  };

  if (presentacion && juegos.length > 0) {
    const j = juegos[indexActual];
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'black', color: 'white', padding: 20 }}>
        <h1>Juego {indexActual + 1} de {juegos.length}</h1>
        <div style={{ background: 'white', color: 'black', padding: 20, borderRadius: 20, maxWidth: 600, width: '100%' }}>
          <p><strong>{j.pregunta}</strong></p>
          {j.tipo === "multiple" && (
            <ul>{j.opciones.map((op, idx) => <li key={idx}>{op}</li>)}</ul>
          )}
          {j.tipo === "flashcard" && <p><em>Respuesta: {j.respuesta}</em></p>}
          {j.tipo === "completar" && <p><em>{j.frase}</em></p>}
          <button onClick={avanzar} style={{ width: '100%', marginTop: 10 }}>Siguiente</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Generador de Juegos de Obstetricia</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Generar Juegos</button>
      <button onClick={descargarJuegos}>Descargar</button>
      <button onClick={iniciarPresentacion}>Presentación</button>
    </div>
  );
}

export default GeneradorJuegos;
