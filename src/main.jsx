import React, { useState } from 'react';
import { Eye, EyeOff, Lock, X, Plus, Copy, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const VirtualCardSystem = () => {
  const [screen, setScreen] = useState('dashboard'); // dashboard, create, confirm, cards, detail
  const [cards, setCards] = useState([
    {
      id: 'vc_001',
      name: 'Netflix',
      number: '4532 **** **** 8901',
      numberFull: '4532123456788901',
      expiry: '12/26',
      cvv: '847',
      balance: 15.99,
      limit: 20,
      spent: 4.01,
      status: 'active',
      type: 'limited', // limited, single-use, permanent
      createdAt: '2025-01-15',
      expiresAt: '2025-02-15',
      lastUsed: '2025-01-18',
      showCVV: false,
    },
    {
      id: 'vc_002',
      name: 'Spotify',
      number: '4532 **** **** 7654',
      numberFull: '4532987654327654',
      expiry: '01/27',
      cvv: '234',
      balance: 9.99,
      limit: 15,
      spent: 5.01,
      status: 'active',
      type: 'permanent',
      createdAt: '2024-12-01',
      expiresAt: '2026-12-01',
      lastUsed: '2025-01-20',
      showCVV: false,
    },
  ]);

  const [createForm, setCreateForm] = useState({
    name: '',
    amount: 50,
    limit: 50,
    duration: '30', // days
    type: 'limited', // limited, single-use, permanent
  });

  const [selectedCard, setSelectedCard] = useState(null);

  // === SCREEN 1: DASHBOARD ===
  const DashboardScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartes Virtuelles</h1>
          <p className="text-sm text-gray-500">Gérez vos cartes de paiement en ligne</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">D</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Cartes actives</p>
          <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Dépensé ce mois</p>
          <p className="text-2xl font-bold text-red-600">
            HTG {cards.reduce((sum, c) => sum + c.spent, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => {
          setCreateForm({ name: '', amount: 50, limit: 50, duration: '30', type: 'limited' });
          setScreen('create');
        }}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition mb-6 flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Créer une carte
      </button>

      {/* Cards List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 px-1">Mes cartes ({cards.length})</h2>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => {
              setSelectedCard(card);
              setScreen('detail');
            }}
            className="w-full bg-white rounded-lg p-4 border border-gray-200 hover:border-red-300 hover:shadow-md transition text-left"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{card.name}</h3>
                <p className="text-xs text-gray-500">{card.number}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                card.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {card.status === 'active' ? '✓ Actif' : 'Inactif'}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-500">Limite</p>
                <p className="font-semibold text-gray-900">HTG {card.limit}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Dépensé</p>
                <p className="font-semibold text-gray-900">HTG {card.spent}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // === SCREEN 2: CREATE CARD ===
  const CreateScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <X size={20} className="text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Créer une carte</h1>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Nom de la carte
          </label>
          <input
            type="text"
            placeholder="Ex: Netflix, Spotify, etc."
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Type de carte
          </label>
          <div className="space-y-2">
            {[
              { value: 'limited', label: 'Limitée (dépense max)', desc: 'Peut être réutilisée' },
              { value: 'single-use', label: 'À usage unique', desc: 'Se bloque après 1 paiement' },
              { value: 'permanent', label: 'Permanente', desc: 'Sans limite de durée' },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setCreateForm({ ...createForm, type: type.value })}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  createForm.type === type.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Montant initial (HTG)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="500"
              value={createForm.amount}
              onChange={(e) => setCreateForm({ ...createForm, amount: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <input
              type="number"
              value={createForm.amount}
              onChange={(e) => setCreateForm({ ...createForm, amount: parseInt(e.target.value) || 0 })}
              className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-red-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Montant minimum: HTG 10</p>
        </div>

        {/* Limit */}
        {createForm.type !== 'permanent' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Limite de dépense (HTG)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="1000"
                value={createForm.limit}
                onChange={(e) => setCreateForm({ ...createForm, limit: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <input
                type="number"
                value={createForm.limit}
                onChange={(e) => setCreateForm({ ...createForm, limit: parseInt(e.target.value) || 0 })}
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        )}

        {/* Duration */}
        {createForm.type !== 'permanent' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Durée de validité
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '7', label: '7 jours' },
                { value: '30', label: '30 jours' },
                { value: '90', label: '90 jours' },
              ].map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setCreateForm({ ...createForm, duration: dur.value })}
                  className={`py-3 rounded-lg font-medium transition ${
                    createForm.duration === dur.value
                      ? 'bg-red-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-900 hover:border-red-300'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Lock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Sécurisé par défaut</p>
            <p className="text-xs text-blue-700 mt-1">
              OTP obligatoire pour chaque paiement. Bloquez la carte à tout moment.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        <button
          onClick={() => setScreen('dashboard')}
          className="py-3 border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            if (createForm.name.trim()) {
              setScreen('confirm');
            }
          }}
          disabled={!createForm.name.trim()}
          className="py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition"
        >
          Continuer
        </button>
      </div>
    </div>
  );

  // === SCREEN 3: CONFIRM ===
  const ConfirmScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          onClick={() => setScreen('create')}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <X size={20} className="text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Vérifier les détails</h1>
      </div>

      <div className="flex-1">
        {/* Preview Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white mb-6 shadow-lg h-56 flex flex-col justify-between">
          <div>
            <p className="text-sm opacity-75">Carte Virtuelle</p>
            <p className="text-2xl font-bold mt-2">{createForm.name || 'Nouvelle carte'}</p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Montant</p>
            <p className="text-3xl font-bold">HTG {createForm.amount}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Type</p>
            <p className="font-semibold text-gray-900">
              {createForm.type === 'limited' && '💳 Limitée'}
              {createForm.type === 'single-use' && '🔐 À usage unique'}
              {createForm.type === 'permanent' && '♾️ Permanente'}
            </p>
          </div>

          {createForm.type !== 'permanent' && (
            <>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Limite de dépense</p>
                <p className="font-semibold text-gray-900">HTG {createForm.limit}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Expire dans</p>
                <p className="font-semibold text-gray-900">{createForm.duration} jours</p>
              </div>
            </>
          )}

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Sécurité</p>
            <p className="font-semibold text-gray-900">OTP + Antifraude activés</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">À noter</p>
            <p className="text-xs text-amber-700 mt-1">
              Les fonds sont déduits de votre solde wallet. Vous pouvez bloquer la carte à tout moment.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        <button
          onClick={() => setScreen('create')}
          className="py-3 border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Retour
        </button>
        <button
          onClick={() => {
            const newCard = {
              id: `vc_${Date.now()}`,
              name: createForm.name,
              number: '4532 **** **** ' + Math.random().toString().slice(-4),
              numberFull: '4532' + Math.random().toString().slice(2, 12) + Math.random().toString().slice(2, 6),
              expiry: createForm.type === 'permanent' ? '12/27' : `${new Date().getMonth() + 1}/${parseInt(new Date().getFullYear().toString().slice(-2)) + parseInt(createForm.duration) / 365}`,
              cvv: Math.floor(Math.random() * 900) + 100,
              balance: createForm.amount,
              limit: createForm.limit || createForm.amount,
              spent: 0,
              status: 'active',
              type: createForm.type,
              createdAt: new Date().toISOString().split('T')[0],
              expiresAt: new Date(Date.now() + parseInt(createForm.duration) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              lastUsed: null,
              showCVV: false,
            };
            setCards([...cards, newCard]);
            setScreen('success');
          }}
          className="py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
        >
          Créer la carte
        </button>
      </div>
    </div>
  );

  // === SCREEN 4: SUCCESS ===
  const SuccessScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <CheckCircle size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carte créée !</h1>
        <p className="text-gray-600">Votre carte virtuelle est prête à l'emploi</p>
      </div>

      {/* Card Preview */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white w-full shadow-lg mb-8 h-48 flex flex-col justify-between">
        <div>
          <p className="text-sm opacity-75">Carte Virtuelle</p>
          <p className="text-2xl font-bold mt-2">{createForm.name}</p>
        </div>
        <div>
          <p className="text-sm opacity-75 mb-1">Montant</p>
          <p className="text-3xl font-bold">HTG {createForm.amount}</p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-xl p-6 w-full mb-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="font-bold text-red-500 flex-shrink-0">1</span>
            <span className="text-gray-700">Consultez les détails de votre carte</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-red-500 flex-shrink-0">2</span>
            <span className="text-gray-700">Utilisez le numéro lors de vos paiements en ligne</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-red-500 flex-shrink-0">3</span>
            <span className="text-gray-700">Confirmez chaque paiement avec l'OTP par SMS</span>
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          onClick={() => setScreen('dashboard')}
          className="py-3 border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Accueil
        </button>
        <button
          onClick={() => {
            setSelectedCard(cards[cards.length - 1]);
            setScreen('detail');
          }}
          className="py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
        >
          Voir détails
        </button>
      </div>
    </div>
  );

  // === SCREEN 5: CARD DETAIL ===
  const DetailScreen = () => {
    if (!selectedCard) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <X size={20} className="text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{selectedCard.name}</h1>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg mb-6 h-56 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-75">Carte Virtuelle</p>
              <p className="text-xl font-bold mt-2">{selectedCard.name}</p>
            </div>
            <Lock size={24} className="opacity-75" />
          </div>
          <div>
            <p className="text-xs opacity-75 mb-2">Numéro</p>
            <p className="font-mono text-lg tracking-widest">{selectedCard.number}</p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-75">Exp.</p>
              <p className="font-mono">{selectedCard.expiry}</p>
            </div>
            <div>
              <p className="text-xs opacity-75">CVV</p>
              <button
                onClick={() => {
                  const newCards = [...cards];
                  newCards[newCards.findIndex(c => c.id === selectedCard.id)].showCVV = 
                    !newCards[newCards.findIndex(c => c.id === selectedCard.id)].showCVV;
                  setCards(newCards);
                  setSelectedCard(newCards[newCards.findIndex(c => c.id === selectedCard.id)]);
                }}
                className="font-mono hover:opacity-90 transition cursor-pointer flex items-center gap-1"
              >
                {selectedCard.showCVV ? selectedCard.cvv : '***'}
                {selectedCard.showCVV ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Solde disponible</p>
            <p className="text-2xl font-bold text-gray-900">HTG {(selectedCard.balance - selectedCard.spent).toFixed(2)}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(selectedCard.spent / selectedCard.limit) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedCard.spent} / {selectedCard.limit} HTG dépensés
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Créée</p>
              <p className="font-semibold text-gray-900">{selectedCard.createdAt}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Expire</p>
              <p className="font-semibold text-gray-900">{selectedCard.expiresAt}</p>
            </div>
          </div>

          {selectedCard.lastUsed && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Dernier paiement</p>
              <p className="font-semibold text-gray-900">{selectedCard.lastUsed}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Sécurité</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✓ OTP obligatoire pour chaque paiement</li>
              <li>✓ Antifraude activé</li>
              <li>✓ Vous pouvez bloquer cette carte à tout moment</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 mb-6">
          <button className="w-full py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <Copy size={18} /> Copier le numéro
          </button>
          <button className="w-full py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition">
            Ajouter des fonds
          </button>
          <button className="w-full py-3 bg-white border-2 border-orange-300 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition">
            Bloquer la carte
          </button>
          <button 
            onClick={() => {
              setCards(cards.filter(c => c.id !== selectedCard.id));
              setScreen('dashboard');
            }}
            className="w-full py-3 bg-white border-2 border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
          >
            <Trash2 size={18} /> Supprimer
          </button>
        </div>
      </div>
    );
  };

  // ROUTER
  return (
    <div className="font-sans antialiased bg-gray-100">
      {screen === 'dashboard' && <DashboardScreen />}
      {screen === 'create' && <CreateScreen />}
      {screen === 'confirm' && <ConfirmScreen />}
      {screen === 'success' && <SuccessScreen />}
      {screen === 'detail' && <DetailScreen />}
    </div>
  );
};

export default VirtualCardSystem;
