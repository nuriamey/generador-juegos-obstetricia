
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, Download, MonitorPlay } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

export default function GeneradorJuegos() {
  const [pdfFile, setPdfFile] = useState(null);
  const [juegos, setJuegos] = useState([]);
  const [presentacion, setPresentacion] = useState(false);
  const [indexActual, setIndexActual] = useState(0);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const extractTextFromPDF = async (file) => {
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

      generarJuegos(fullText);
    };
    reader.readAsArrayBuffer(file);
  };

  const generarJuegos = (texto) => {
    const bloques = texto.split(/\d+\.\s+/).slice(1);
    const juegosGenerados = bloques.slice(0, 5).map((bloque, index) => {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
        <h1 className="text-2xl mb-4">Juego {indexActual + 1} de {juegos.length}</h1>
        <div className="bg-white text-black p-6 rounded-xl w-full max-w-xl space-y-4">
          <p className="font-bold text-lg">{j.pregunta}</p>

          {j.tipo === "multiple" && (
            <ul className="list-disc ml-6">
              {j.opciones.map((op, idx) => (
                <li key={idx}>{op}</li>
              ))}
            </ul>
          )}

          {j.tipo === "flashcard" && (
            <p className="italic">Respuesta: {j.respuesta}</p>
          )}

          {j.tipo === "completar" && (
            <p className="italic">{j.frase}</p>
          )}

          <Button onClick={avanzar} className="bg-pink-600 hover:bg-pink-700 w-full">Siguiente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-pink-100 to-purple-200">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center">Generador de Juegos de Obstetricia</h1>
        <Card className="shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <UploadCloud className="w-8 h-8 text-pink-600" />
              <Input type="file" accept="application/pdf" onChange={handleFileChange} />
            </div>
            <div className="flex space-x-4">
              <Button onClick={handleUpload} className="bg-pink-500 hover:bg-pink-600">Generar Juegos</Button>
              <Button onClick={descargarJuegos} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Descargar
              </Button>
              <Button onClick={iniciarPresentacion} variant="outline" className="flex items-center gap-2">
                <MonitorPlay className="w-4 h-4" /> Presentación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
