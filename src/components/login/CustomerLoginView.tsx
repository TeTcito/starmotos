// src/components/login/CustomerLoginView.tsx
import React, { useState, useEffect } from 'react';
import {
  User,
  Bike,
  Lock,
  Mail,
  Phone,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  Shield,
  Wrench,
  Tag,
} from 'lucide-react';
import { UserRole, TallerClient, SystemAlert } from '../../types/customer';
import {
  getStoredWorkshops,
  getStoredClients,
  saveStoredClients,
  addStoredAlerts,
} from '../../data/mockMultiRoleData';
import { cloudSaveClient } from '../../services/supabaseService';

interface Props {
  onLoginSuccess: (role: UserRole) => void;
}

export const CustomerLoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerTab, setRegisterTab] = useState<'cliente' | 'moto'>('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const workshops = getStoredWorkshops();

  // Login
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
  });

  // Registro en 2 pasos
  const initialRegisterState = {
    firstNames: '',
    lastNames: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    workshopId: workshops[0]?.id || 'matriz-la-mana',
    password: '',
    confirmPassword: '',

    motoBrand: '',
    motoModel: '',
    motoPlate: '',
    motoColor: '',
    motoVin: '',
    motorNumber: '',
    motoMileage: '',
  };

  const [registerData, setRegisterData] = useState(initialRegisterState);

  const resetRegisterForm = () => {
    setRegisterData({
      ...initialRegisterState,
      workshopId: workshops[0]?.id || 'matriz-la-mana',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  useEffect(() => {
    if (isRegisterMode) {
      resetRegisterForm();
    }
  }, [isRegisterMode]);

  // Validaciones simplificadas: solo mínimo 8 caracteres y confirmación
  const hasMinLength = registerData.password.length >= 8;
  const passwordsMatch =
    registerData.password.length > 0 &&
    registerData.password === registerData.confirmPassword;
  const isPasswordValid = hasMinLength && passwordsMatch;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = loginData.identifier.trim().toLowerCase();
    const cleanPassword = loginData.password.trim();

    if (!cleanUser || !cleanPassword) {
      setErrorMessage('Por favor ingrese su correo electrónico o cédula y su contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const customPwd = localStorage.getItem(`starmotos_pwd_${cleanUser}`);
      const storedClients = getStoredClients();

      const matchedClient = storedClients.find(
        (c) =>
          c.email.trim().toLowerCase() === cleanUser ||
          c.idNumber.trim().toLowerCase() === cleanUser ||
          (c.phone && c.phone.trim() === cleanUser)
      );

      if (matchedClient) {
        const clientSavedPwd =
          matchedClient.password ||
          localStorage.getItem(`starmotos_client_pwd_${matchedClient.idNumber.trim().toLowerCase()}`) ||
          localStorage.getItem(`starmotos_client_pwd_${matchedClient.email.trim().toLowerCase()}`) ||
          customPwd;

        const isClientPwdValid = clientSavedPwd
          ? cleanPassword === clientSavedPwd
          : cleanPassword === 'StarMotos@2026' || cleanPassword === matchedClient.idNumber.trim();

        if (!isClientPwdValid) {
          setErrorMessage('Contraseña incorrecta. Verifique su clave de cliente.');
          return;
        }

        try {
          localStorage.setItem(
            'starmotos_current_client_profile',
            JSON.stringify({
              fullName: matchedClient.fullName,
              idNumber: matchedClient.idNumber,
              phone: matchedClient.phone,
              email: matchedClient.email,
              address: matchedClient.address || '',
              city: matchedClient.workshopName || 'StarMotos Sede Oficial',
              taxId: matchedClient.idNumber,
              mustChangePassword: Boolean(matchedClient.mustChangePassword),
            })
          );
          localStorage.setItem(
            'starmotos_current_client_moto',
            JSON.stringify({
              plate: matchedClient.motorcyclePlate,
              brand: matchedClient.motorcycleBrand,
              model: matchedClient.motorcycleModel,
              color: matchedClient.color || 'Negro',
              vin: matchedClient.motorcycleVin || 'S/N',
              currentKm: matchedClient.motorcycleMileage || 0,
              preferredBranchId: matchedClient.workshopId,
            })
          );
        } catch (_) {}

        onLoginSuccess('cliente');
        return;
      }

      setErrorMessage(
        `No se encontró ningún cliente registrado con "${loginData.identifier}". Si es cliente nuevo, por favor regístrese a continuación.`
      );
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !registerData.firstNames.trim() ||
      !registerData.lastNames.trim() ||
      !registerData.idNumber.trim() ||
      !registerData.email.trim() ||
      !registerData.password.trim() ||
      !registerData.confirmPassword.trim()
    ) {
      setRegisterTab('cliente');
      setErrorMessage('Complete los datos obligatorios del cliente.');
      return;
    }

    if (registerData.password.length < 8) {
      setRegisterTab('cliente');
      setErrorMessage('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterTab('cliente');
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    if (!registerData.motoModel.trim()) {
      setRegisterTab('moto');
      setErrorMessage('Por favor ingrese el modelo de su motocicleta.');
      return;
    }

    setIsLoading(true);

    const fullName = `${registerData.firstNames.trim()} ${registerData.lastNames.trim()}`.trim();
    const cleanId = registerData.idNumber.trim();
    const selectedWorkshop = workshops.find((w) => w.id === registerData.workshopId) || workshops[0];

    const newClient: TallerClient = {
      id: cleanId,
      fullName: fullName,
      idNumber: cleanId,
      phone: registerData.phone.trim(),
      email: registerData.email.trim(),
      address: registerData.address.trim(),
      workshopId: selectedWorkshop?.id || 'matriz-la-mana',
      workshopName: selectedWorkshop?.name || 'StarMotos Matriz La Maná',
      motorcycleBrand: registerData.motoBrand.trim() || 'StarMotos',
      motorcycleModel: registerData.motoModel.trim(),
      motorcyclePlate: registerData.motoPlate.trim().toUpperCase() || 'EN TRÁMITE',
      motorcycleVin: registerData.motoVin.trim().toUpperCase(),
      motorNumber: registerData.motorNumber.trim().toUpperCase(),
      color: registerData.motoColor.trim() || 'Negro',
      motorcycleMileage: Number(registerData.motoMileage) || 0,
      totalVisits: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      password: registerData.password.trim(),
    };

    try {
      localStorage.setItem(`starmotos_client_pwd_${cleanId.toLowerCase()}`, registerData.password.trim());
      localStorage.setItem(`starmotos_client_pwd_${registerData.email.trim().toLowerCase()}`, registerData.password.trim());

      const currentClients = getStoredClients();
      const updatedClients = [newClient, ...currentClients.filter((c) => c.idNumber !== cleanId)];
      saveStoredClients(updatedClients);
      cloudSaveClient(newClient);

      // Generar alertas diferenciadas por rol
      const alertsToPush: SystemAlert[] = [];

      // 1. Alerta para Matriz / Admin
      alertsToPush.push({
        id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'cliente_creado',
        targetRole: 'admin',
        title: 'Se creó un cliente',
        message: `Cliente ${newClient.fullName} (${newClient.idNumber}) se registró en línea para la sede ${newClient.workshopName}. Moto: ${newClient.motorcycleBrand} ${newClient.motorcycleModel}.`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: newClient.idNumber,
      });

      // 2. Alerta para Taller sede asignada
      if (newClient.workshopId) {
        alertsToPush.push({
          id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'cliente_creado',
          targetRole: 'taller',
          targetWorkshopId: newClient.workshopId,
          title: 'Se creó un cliente',
          message: `El cliente ${newClient.fullName} (${newClient.idNumber}) se registró en línea asignado a tu sede. Moto: ${newClient.motorcycleBrand} ${newClient.motorcycleModel}.`,
          timestamp: 'Ahora mismo',
          read: false,
          relatedId: newClient.idNumber,
        });
      }

      addStoredAlerts(alertsToPush);

      localStorage.setItem(
        'starmotos_current_client_profile',
        JSON.stringify({
          fullName: newClient.fullName,
          idNumber: newClient.idNumber,
          phone: newClient.phone,
          email: newClient.email,
          address: newClient.address || '',
          city: newClient.workshopName,
          taxId: newClient.idNumber,
        })
      );
      localStorage.setItem(
        'starmotos_current_client_moto',
        JSON.stringify({
          plate: newClient.motorcyclePlate,
          brand: newClient.motorcycleBrand,
          model: newClient.motorcycleModel,
          color: newClient.color,
          vin: newClient.motorcycleVin,
          currentKm: newClient.motorcycleMileage,
          preferredBranchId: newClient.workshopId,
        })
      );
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('¡Cuenta creada y motocicleta vinculada con éxito! Ingresando...');
      setTimeout(() => {
        onLoginSuccess('cliente');
      }, 600);
    }, 500);
  };

  return (
    <div className="w-full max-w-md my-auto py-2 sm:py-4 animate-fade-in">
      {/* Encabezado */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-1.5">
          <Bike className="w-3.5 h-3.5 text-blue-600" />
          <span>{isRegisterMode ? 'Nuevo Propietario' : 'Portal de Clientes'}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
          {isRegisterMode ? 'Registro de Cliente' : 'Acceso Clientes'}
        </h1>

        {/* Conmutador Registro / Login */}
        <div className="mt-1">
          {!isRegisterMode ? (
            <p className="text-xs text-zinc-500">
              ¿Eres cliente nuevo?{' '}
              <button
                type="button"
                onClick={() => {
                  resetRegisterForm();
                  setIsRegisterMode(true);
                  setRegisterTab('cliente');
                }}
                className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
              >
                Regístrate aquí
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-shake">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ===================== INICIAR SESIÓN ===================== */}
      {!isRegisterMode ? (
        <form onSubmit={handleLoginSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Cédula o Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="text"
                value={loginData.identifier}
                onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                placeholder="ej: 1724890123 o cliente@correo.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm rounded-xl transition-all"
                required
                autoFocus
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm rounded-xl transition-all"
                required
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded-full transition cursor-pointer text-zinc-500 hover:text-zinc-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={loginData.rememberMe}
                onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <span>Recordar sesión</span>
            </label>
            <span className="text-[11px] text-zinc-400">Portal Seguro</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm mt-1"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              'Ingresar como Cliente'
            )}
          </button>
        </form>
      ) : (
        /* ===================== REGISTRO DE CLIENTE ===================== */
        <form onSubmit={handleRegisterSubmit} className="space-y-3 pb-28 sm:pb-4">
          {/* Pestañas de Registro */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => setRegisterTab('cliente')}
              className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                registerTab === 'cliente' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. Cliente & Clave</span>
            </button>
            <button
              type="button"
              onClick={() => setRegisterTab('moto')}
              className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                registerTab === 'moto' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>2. Motocicleta</span>
            </button>
          </div>

          {registerTab === 'cliente' ? (
            <div className="space-y-2.5 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={registerData.firstNames}
                    onChange={(e) => setRegisterData({ ...registerData, firstNames: e.target.value })}
                    placeholder="Ej: Carlos"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={registerData.lastNames}
                    onChange={(e) => setRegisterData({ ...registerData, lastNames: e.target.value })}
                    placeholder="Ej: Andrade"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Cédula / RUC *</label>
                  <input
                    type="text"
                    required
                    value={registerData.idNumber}
                    onChange={(e) => setRegisterData({ ...registerData, idNumber: e.target.value })}
                    placeholder="10 dígitos"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Celular *</label>
                  <input
                    type="tel"
                    required
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    placeholder="0991234567"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Sede Preferida *</label>
                <select
                  value={registerData.workshopId}
                  onChange={(e) => setRegisterData({ ...registerData, workshopId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600 cursor-pointer"
                >
                  {workshops.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="Mín. 8 caracteres"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Mínimo 8 caracteres</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Confirmar *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="Repetir clave"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {registerData.confirmPassword && (
                    <span className={`text-[10px] mt-0.5 block font-bold ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                      {passwordsMatch ? '✓ Coinciden' : '✗ No coinciden'}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRegisterTab('moto')}
                className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer mt-1"
              >
                <span>Continuar a Datos de la Moto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Marca Moto *</label>
                  <input
                    type="text"
                    required
                    value={registerData.motoBrand}
                    onChange={(e) => setRegisterData({ ...registerData, motoBrand: e.target.value })}
                    placeholder="Ej: Benelli"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={registerData.motoModel}
                    onChange={(e) => setRegisterData({ ...registerData, motoModel: e.target.value })}
                    placeholder="Ej: TRK 502X"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Placa</label>
                  <input
                    type="text"
                    value={registerData.motoPlate}
                    onChange={(e) => setRegisterData({ ...registerData, motoPlate: e.target.value.toUpperCase() })}
                    placeholder="Ej: PBX-1234"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={registerData.motoColor}
                    onChange={(e) => setRegisterData({ ...registerData, motoColor: e.target.value })}
                    placeholder="Ej: Rojo / Negro"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">N° Chasis (VIN) *</label>
                  <input
                    type="text"
                    required
                    value={registerData.motoVin}
                    onChange={(e) => setRegisterData({ ...registerData, motoVin: e.target.value.toUpperCase() })}
                    placeholder="17 dígitos"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Kilometraje Inicial</label>
                  <input
                    type="number"
                    value={registerData.motoMileage}
                    onChange={(e) => setRegisterData({ ...registerData, motoMileage: e.target.value })}
                    placeholder="Ej: 1000"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterTab('cliente')}
                  className="w-1/3 py-2.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLoading ? 'Registrando...' : 'Finalizar y Crear Cuenta'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
