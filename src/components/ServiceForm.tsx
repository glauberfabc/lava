import React, { useState } from 'react';
import { WrenchIcon } from 'lucide-react';
import { VehicleCategory } from '../types';
import { addService } from '../utils/storage';

interface ServiceFormProps {
  onAdd: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('carro_pequeno');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { value: VehicleCategory; label: string }[] = [
    { value: 'carro_pequeno', label: 'Carro Pequeno' },
    { value: 'carro_medio', label: 'Carro Médio' },
    { value: 'carro_grande', label: 'Carro Grande' },
    { value: 'suv', label: 'SUV' },
    { value: 'van', label: 'Van' },
    { value: 'caminhonete', label: 'Caminhonete' },
    { value: 'moto', label: 'Moto' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !price.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await addService(name, Number(price), category);
      setName('');
      setPrice('');
      setCategory('carro_pequeno');
      onAdd();
    } catch (err) {
      setError('Erro ao adicionar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex items-center mb-4">
        <WrenchIcon className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">Novo Serviço</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Serviço
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Lavagem Completa"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Preço (R$)
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as VehicleCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-all ${
            isSubmitting
              ? 'bg-green-500 transform scale-95'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? 'Adicionando...' : 'Adicionar Serviço'}
        </button>
      </form>
    </div>
  );
};

export default ServiceForm;