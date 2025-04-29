import React, { useState, useRef, useEffect } from 'react';
import { Car, Camera, Plus, X } from 'lucide-react';
import { addVehicle, getServices } from '../utils/storage';
import { createWorker } from 'tesseract.js';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Service } from '../types';

interface VehicleFormProps {
  onAdd: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onAdd }) => {
  const [licensePlate, setLicensePlate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadServices();
    initializeModel();
  }, []);

  const loadServices = async () => {
    try {
      const servicesList = await getServices();
      setServices(servicesList);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const initializeModel = async () => {
    try {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    } catch (err) {
      console.error('Error loading TensorFlow model:', err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Erro ao acessar a câmera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const detectLicensePlate = async (imageData: ImageData) => {
    if (!model) return null;

    const predictions = await model.detect(imageData);
    const carPrediction = predictions.find(p => p.class === 'car' && p.score > 0.5);

    if (carPrediction) {
      const { bbox } = carPrediction;
      return {
        x: bbox[0],
        y: bbox[1],
        width: bbox[2],
        height: bbox[3]
      };
    }

    return null;
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setError('');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const plateRegion = await detectLicensePlate(imageData);

      if (plateRegion) {
        const plateCanvas = document.createElement('canvas');
        plateCanvas.width = plateRegion.width;
        plateCanvas.height = plateRegion.height;
        const plateContext = plateCanvas.getContext('2d');

        if (plateContext) {
          plateContext.drawImage(
            canvas,
            plateRegion.x,
            plateRegion.y,
            plateRegion.width,
            plateRegion.height,
            0,
            0,
            plateRegion.width,
            plateRegion.height
          );

          const worker = await createWorker('por');
          const { data: { text } } = await worker.recognize(plateCanvas);
          await worker.terminate();

          const platePattern = /[A-Z]{3}[-]?\d{4}/i;
          const match = text.match(platePattern);

          if (match) {
            setLicensePlate(match[0].toUpperCase());
          } else {
            setError('Não foi possível identificar a placa');
          }
        }
      } else {
        setError('Nenhum veículo detectado na imagem');
      }
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Erro ao processar imagem');
    } finally {
      setIsProcessing(false);
      stopCamera();
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licensePlate.trim() || !customerName.trim() || !customerPhone.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      await addVehicle(licensePlate, customerName, customerPhone, selectedServices);
      setLicensePlate('');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedServices([]);
      onAdd();
      setTimeout(() => setIsSubmitting(false), 600);
    } catch (err) {
      setError('Erro ao adicionar veículo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6 transition-all">
      <div className="flex items-center mb-4">
        <Car className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">Novo Veículo</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
            Placa do Veículo
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="licensePlate"
              placeholder="AAA-0000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              maxLength={8}
            />
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
              title="Ler placa com câmera"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Cliente
          </label>
          <input
            type="text"
            id="customerName"
            placeholder="Nome completo"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone do Cliente
          </label>
          <input
            type="tel"
            id="customerPhone"
            placeholder="(00) 00000-0000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Serviços
          </label>
          <div className="space-y-2">
            {services.map((service) => (
              <div
                key={service.id}
                className={`flex items-center justify-between p-2 rounded-md border ${
                  selectedServices.includes(service.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-gray-600">
                    R$ {service.price.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleServiceToggle(service.id)}
                  className={`p-1 rounded-full ${
                    selectedServices.includes(service.id)
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {selectedServices.includes(service.id) ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
          {selectedServices.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-green-700 font-medium">
                Total: R$ {calculateTotal().toFixed(2)}
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-all ${
            isSubmitting
              ? 'bg-green-500 transform scale-95'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adicionando...' : 'Adicionar Veículo'}
        </button>
      </form>

      {/* Camera UI */}
      <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center ${videoRef.current?.srcObject ? 'block' : 'hidden'}`}>
        <div className="bg-white p-4 rounded-lg max-w-lg w-full mx-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={captureImage}
              disabled={isProcessing}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {isProcessing ? 'Processando...' : 'Capturar Placa'}
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleForm;