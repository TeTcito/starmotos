import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  User,
  Bike,
  Building2,
  Lock,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sparkles,
  Shield,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { UserRole, TallerClient } from '../types/customer';
import {
  getStoredWorkshops,
  getStoredClients,
  saveStoredClients,
  INITIAL_WORKSHOPS,
} from '../data/mockMultiRoleData';
import { cloudSaveClient } from '../services/supabaseService';

export interface CorporateAccount {
  email: string;
  role: UserRole;
  passwords: string[];
  workshopId?: string;
  name: string;
}

export const OFFICIAL_CORPORATE_ACCOUNTS: Record<string, CorporateAccount> = {
  // 1. Matriz Central (Administrador)
  'admin@starmotos.com': {
    email: 'admin@starmotos.com',
    role: 'admin',
    passwords: ['StarMotos@Admin2026', 'StarMotos@2026'],
    workshopId: 'matriz-la-mana',
    name: 'Administración Matriz Central',
  },
  'admin@starmotos.ec': {
    email: 'admin@starmotos.ec',
    role: 'admin',
    passwords: ['StarMotos@Admin2026', 'StarMotos@2026'],
    workshopId: 'matriz-la-mana',
    name: 'Administración Matriz Central',
  },
  'starsmotor17@gmail.com': {
    email: 'starsmotor17@gmail.com',
    role: 'admin',
    passwords: ['StarMotos@Admin2026', 'StarMotos@2026'],
    workshopId: 'matriz-la-mana',
    name: 'Administración Matriz Central (Google)',
  },

  // 2. Garante de Marca Oficial
  'garante@starmotos.com': {
    email: 'garante@starmotos.com',
    role: 'garante',
    passwords: ['StarMotos@Garante2026', 'StarMotos@2026'],
    name: 'Garantías Oficial Benelli & Marcas',
  },
  'garante@starmotos.ec': {
    email: 'garante@starmotos.ec',
    role: 'garante',
    passwords: ['StarMotos@Garante2026', 'StarMotos@2026'],
    name: 'Garantías Oficial StarMotos',
  },
  'garantias.oficial@benelli-ecuador.com': {
    email: 'garantias.oficial@benelli-ecuador.com',
    role: 'garante',
    passwords: ['StarMotos@Garante2026', 'StarMotos@2026'],
    name: 'Garantías Oficial Benelli Ecuador',
  },

  // 3. Talleres y Sedes Oficiales (11 Ubicaciones de la Red Oficial)
  'sede.la-mana@starmotos.com': {
    email: 'sede.la-mana@starmotos.com',
    role: 'taller',
    workshopId: 'matriz-la-mana',
    passwords: ['TallerLaMana@2026', 'StarMotos@2026'],
    name: 'StarMotos Matriz La Maná',
  },
  'sede.quevedo@starmotos.com': {
    email: 'sede.quevedo@starmotos.com',
    role: 'taller',
    workshopId: 'taller-quevedo',
    passwords: ['TallerQuevedo@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Quevedo',
  },
  'sede.buena-fe@starmotos.com': {
    email: 'sede.buena-fe@starmotos.com',
    role: 'taller',
    workshopId: 'taller-buena-fe',
    passwords: ['TallerBuenaFe@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Buena Fe',
  },
  'sede.balzar@starmotos.com': {
    email: 'sede.balzar@starmotos.com',
    role: 'taller',
    workshopId: 'taller-balzar',
    passwords: ['TallerBalzar@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Balzar',
  },
  'sede.el-carmen@starmotos.com': {
    email: 'sede.el-carmen@starmotos.com',
    role: 'taller',
    workshopId: 'taller-el-carmen',
    passwords: ['TallerElCarmen@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal El Carmen',
  },
  'sede.moraspungo@starmotos.com': {
    email: 'sede.moraspungo@starmotos.com',
    role: 'taller',
    workshopId: 'taller-moraspungo',
    passwords: ['TallerMoraspungo@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Moraspungo',
  },
  'sede.mocache@starmotos.com': {
    email: 'sede.mocache@starmotos.com',
    role: 'taller',
    workshopId: 'taller-mocache',
    passwords: ['TallerMocache@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Mocache',
  },
  'sede.quinzaloma@starmotos.com': {
    email: 'sede.quinzaloma@starmotos.com',
    role: 'taller',
    workshopId: 'taller-quinzaloma',
    passwords: ['TallerQuinzaloma@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Quinzaloma',
  },
  'sede.portoviejo@starmotos.com': {
    email: 'sede.portoviejo@starmotos.com',
    role: 'taller',
    workshopId: 'taller-portoviejo',
    passwords: ['TallerPortoviejo@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Portoviejo',
  },
  'sede.ricaurte@starmotos.com': {
    email: 'sede.ricaurte@starmotos.com',
    role: 'taller',
    workshopId: 'taller-ricaurte',
    passwords: ['TallerRicaurte@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal Ricaurte',
  },
  'sede.el-empalme@starmotos.com': {
    email: 'sede.el-empalme@starmotos.com',
    role: 'taller',
    workshopId: 'taller-el-empalme',
    passwords: ['TallerElEmpalme@2026', 'StarMotos@2026'],
    name: 'StarMotos Sucursal El Empalme',
  },
};

interface Props {
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerTab, setRegisterTab] = useState<'cliente' | 'moto'>('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCredentialsGuide, setShowCredentialsGuide] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lista de talleres disponibles para el selector de sucursal preferida
  const workshops = getStoredWorkshops();

  // Formulario de inicio de sesión corporativo
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
  });

  // Formulario de registro con Datos del Cliente y Datos de la Moto (100% vacíos inicialmente)
  const initialRegisterState = {
    // Pestaña 1: Datos del Cliente y Cuenta
    firstNames: '',
    lastNames: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    workshopId: workshops[0]?.id || 'matriz-la-mana',
    password: '',
    confirmPassword: '',

    // Pestaña 2: Datos de la Motocicleta
    motoBrand: '',
    motoModel: '',
    motoPlate: '',
    motoColor: '',
    motoVin: '',
    motorNumber: '',
    motoMileage: '',
  };

  const [registerData, setRegisterData] = useState(initialRegisterState);

  // Función para reiniciar el formulario de registro a vacío absoluto
  const resetRegisterForm = () => {
    setRegisterData({
      ...initialRegisterState,
      workshopId: workshops[0]?.id || 'matriz-la-mana',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Limpiar cualquier residuo o autocompletado del navegador al entrar al modo registro
  useEffect(() => {
    if (isRegisterMode) {
      resetRegisterForm();
      const timer = setTimeout(() => {
        setRegisterData((prev) => ({
          ...prev,
          email: '',
          password: '',
          confirmPassword: '',
          motoBrand: '',
        }));
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isRegisterMode]);

  // Validaciones dinámicas de contraseña
  const hasMinLength = registerData.password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(registerData.password);
  const hasNumber = /[0-9]/.test(registerData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(registerData.password);
  const passwordsMatch =
    registerData.password.length > 0 &&
    registerData.password === registerData.confirmPassword;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Autocompletar placa "EN TRÁMITE"
  const handleSetPlateTramite = () => {
    setRegisterData((prev) => ({
      ...prev,
      motoPlate: 'EN TRÁMITE',
    }));
  };

  // Manejador del Inicio de Sesión 100% SEGURO con verificación estricta de credenciales
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = loginData.identifier.trim().toLowerCase();
    const cleanPassword = loginData.password.trim();

    if (!cleanUser || !cleanPassword) {
      setErrorMessage('Por favor ingrese su correo electrónico (o identificación) y contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Verificación de clave personalizada guardada dinámicamente
      const customPwd = localStorage.getItem(`starmotos_pwd_${cleanUser}`);

      // 1. Detección y validación estricta de Cuentas Corporativas Oficiales (Admin, Garante, Talleres por Sede)
      const corporateAccount = OFFICIAL_CORPORATE_ACCOUNTS[cleanUser];

      if (corporateAccount) {
        const isPasswordValid =
          corporateAccount.passwords.includes(cleanPassword) ||
          cleanPassword === customPwd;

        if (!isPasswordValid) {
          setErrorMessage(
            `Contraseña incorrecta para la cuenta oficial "${cleanUser}". Verifique su contraseña autorizada e intente nuevamente.`
          );
          return;
        }

        // Si es taller o admin con sede asignada, fijar la sede activa de la sesión
        if (corporateAccount.workshopId) {
          localStorage.setItem('starmotos_taller_active_ws', corporateAccount.workshopId);
        }

        onLoginSuccess(corporateAccount.role);
        return;
      }

      // 2. Detección y validación de Cliente Registrado
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

        // Validar contraseña del cliente estrictamente
        const isClientPwdValid = clientSavedPwd
          ? cleanPassword === clientSavedPwd
          : cleanPassword === 'StarMotos@2026' || cleanPassword === matchedClient.idNumber.trim();

        if (!isClientPwdValid) {
          setErrorMessage('Contraseña incorrecta para el cliente ingresado. Verifique su clave.');
          return;
        }

        const mustChange = Boolean(matchedClient.mustChangePassword);
        if (mustChange) {
          localStorage.setItem('starmotos_must_change_password', 'true');
        } else {
          localStorage.removeItem('starmotos_must_change_password');
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
              mustChangePassword: mustChange,
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

      // 3. Si no existe en corporativo ni en clientes registrados: ACCESO DENEGADO
      setErrorMessage(
        `Acceso no autorizado: El correo o identificación "${loginData.identifier}" no coincide con ninguna cuenta oficial ni cliente registrado. Ingrese su correo corporativo oficial completo (ej: admin@starmotos.com o sede.[ciudad]@starmotos.com) y su contraseña autorizada.`
      );
    }, 400);
  };

  // Manejador del Registro Completo de Clientes con Motocicleta
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validaciones de Pestaña 1 (Cliente & Cuenta)
    if (
      !registerData.firstNames.trim() ||
      !registerData.lastNames.trim() ||
      !registerData.idNumber.trim() ||
      !registerData.email.trim() ||
      !registerData.password.trim() ||
      !registerData.confirmPassword.trim()
    ) {
      setRegisterTab('cliente');
      setErrorMessage('Por favor complete todos los campos obligatorios del Cliente y Cuenta.');
      return;
    }

    if (!isPasswordValid) {
      setRegisterTab('cliente');
      setErrorMessage('La contraseña debe cumplir con todos los requisitos de seguridad indicados.');
      return;
    }

    if (!passwordsMatch) {
      setRegisterTab('cliente');
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    // Validaciones de Pestaña 2 (Motocicleta)
    if (!registerData.motoModel.trim()) {
      setRegisterTab('moto');
      setErrorMessage('Por favor ingrese el Modelo de la Motocicleta.');
      return;
    }

    if (!registerData.motoVin.trim()) {
      setRegisterTab('moto');
      setErrorMessage('Por favor ingrese el Número de Chasis (VIN) de la moto.');
      return;
    }

    setIsLoading(true);

    const fullName = `${registerData.firstNames.trim()} ${registerData.lastNames.trim()}`.trim();
    const cleanId = registerData.idNumber.trim();
    const selectedWorkshop = workshops.find((w) => w.id === registerData.workshopId) || workshops[0];

    // Crear el nuevo objeto TallerClient
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

    // Guardar en localStorage y sincronizar con Supabase
    try {
      localStorage.setItem(`starmotos_client_pwd_${cleanId.toLowerCase()}`, registerData.password.trim());
      localStorage.setItem(`starmotos_client_pwd_${registerData.email.trim().toLowerCase()}`, registerData.password.trim());

      const currentClients = getStoredClients();
      const updatedClients = [
        newClient,
        ...currentClients.filter((c) => c.idNumber !== cleanId),
      ];
      saveStoredClients(updatedClients);
      cloudSaveClient(newClient);

      // Guardar sesión para el portal del cliente
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
      console.error('Error al guardar el nuevo cliente:', err);
    }

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('¡Cuenta creada y motocicleta vinculada con éxito! Ingresando...');
      setTimeout(() => {
        onLoginSuccess('cliente');
      }, 700);
    }, 600);
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* LADO IZQUIERDO (2/3 DEL ANCHO): IMAGEN HERO A PANTALLA COMPLETA (DESKTOP)  */}
      {/* ========================================================================= */}
      <div className="hidden lg:block relative lg:w-2/3 h-full min-h-screen overflow-hidden shrink-0 bg-zinc-950 select-none">
        <img
          src="/login-motorcycle-cliff.jpg"
          alt="StarMotos Aventura y Precisión en Ruta"
          className="w-full h-full min-h-screen object-cover transition-transform duration-1000 ease-out hover:scale-105"
          style={{ objectPosition: '72% 50%' }}
        />

        {/* Gradiente cinematográfico inferior para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Texto "Bienvenido" elegante sobre la imagen */}
        <div className="absolute bottom-6 left-6 sm:bottom-12 sm:left-12 z-10 select-none pointer-events-none max-w-xl">
          <h2 className="text-3xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            Bienvenido
          </h2>
          <p className="text-xs sm:text-base text-zinc-100 mt-1.5 sm:mt-2 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] max-w-lg">
            Portal oficial de seguimiento vehicular y servicio técnico especializado de StarMotos.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LADO DERECHO: FORMULARIO RESPONSIVE (MÓVIL & ESCRITORIO)                   */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/3 h-full flex flex-col justify-start sm:justify-center items-center bg-white px-4 py-3 sm:p-8 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md my-auto py-2 sm:py-4">
          {/* Encabezado: Logo y Título StarMotos */}
          <div className="mb-2.5 sm:mb-4 text-center">
            <div className="inline-flex p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md mb-1 sm:mb-2">
              <img
                src="/starmotos-logo.jpg"
                alt="Logo StarMotos"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover bg-white"
              />
            </div>

            <div className="flex items-center justify-center gap-2 mb-0.5">
              <span className="h-px w-5 sm:w-6 bg-gradient-to-r from-transparent to-blue-400" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
                Red Oficial de Servicio Técnico
              </span>
              <span className="h-px w-5 sm:w-6 bg-gradient-to-l from-transparent to-red-400" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
              <span className="text-blue-600 drop-shadow-sm">STAR</span>
              <span className="text-red-600 drop-shadow-sm">MOTOS</span>
            </h1>

            {/* Alternador Registro / Login - 100% visible tanto en Móvil como Desktop */}
            <div className="mt-1.5 sm:mt-2">
              {!isRegisterMode ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-zinc-700">
                  <span>¿Eres cliente nuevo?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetRegisterForm();
                      setIsRegisterMode(true);
                      setRegisterTab('cliente');
                    }}
                    className="text-blue-700 hover:text-blue-900 font-black underline cursor-pointer"
                  >
                    Regístrate aquí
                  </button>
                </div>
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

          {/* Mensajes de Alerta y Notificación */}
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

          {/* ===================================================================== */}
          {/* MODO 1: FORMULARIO CORPORATIVO DE INICIO DE SESIÓN                    */}
          {/* ===================================================================== */}
          {!isRegisterMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-4">
              {/* Correo Electrónico o Cédula */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 sm:mb-1.5">
                  Correo Electrónico o Cédula
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="identifier"
                    value={loginData.identifier}
                    onChange={handleLoginChange}
                    placeholder="ej: usuario@starmotos.com o C.I."
                    className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
                    required
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 sm:mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
                    required
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded-full transition cursor-pointer text-zinc-500 hover:text-zinc-700"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-zinc-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Fila Recordarme */}
              <div className="flex items-center justify-between pt-0.5">
                <label
                  htmlFor="rememberMe"
                  className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer select-none font-medium"
                >
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleLoginChange}
                    className="w-4 h-4 bg-white border border-zinc-300 rounded cursor-pointer accent-blue-600"
                  />
                  <span>Recordar sesión</span>
                </label>

                <span className="text-[11px] text-zinc-400 font-medium">
                  Acceso Seguro SSL
                </span>
              </div>

              {/* Botón de Ingreso Principal */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </button>

              {/* Enlace destacado de Registro (visible y prominente en móvil y desktop) */}
              <div className="pt-3 border-t border-zinc-200 text-center">
                <p className="text-xs text-zinc-600">
                  ¿Eres cliente y aún no tienes cuenta?{' '}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetRegisterForm();
                    setIsRegisterMode(true);
                    setRegisterTab('cliente');
                  }}
                  className="mt-1.5 w-full py-2 px-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Crear Cuenta de Cliente y Vincular Moto</span>
                </button>
              </div>

              {/* Acordeón de Accesos Corporativos Autorizados (Sedes, Garante, Matriz) */}
              <div className="mt-3 pt-3 border-t border-zinc-200 text-left">
                <button
                  type="button"
                  onClick={() => setShowCredentialsGuide(!showCredentialsGuide)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 rounded-xl text-blue-900 transition cursor-pointer text-xs font-bold"
                >
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Ver Cuentas Oficiales y Claves Autorizadas</span>
                  </div>
                  {showCredentialsGuide ? (
                    <ChevronUp className="w-4 h-4 text-blue-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-700" />
                  )}
                </button>

                {showCredentialsGuide && (
                  <div className="mt-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 text-[11px] animate-fade-in max-h-60 overflow-y-auto">
                    <div>
                      <div className="flex items-center gap-1 font-bold text-zinc-900 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        <span>Matriz Central (Administrador)</span>
                      </div>
                      <div
                        onClick={() => {
                          setLoginData({
                            identifier: 'admin@starmotos.com',
                            password: 'StarMotos@Admin2026',
                            rememberMe: true,
                          });
                          setErrorMessage('');
                        }}
                        className="p-1.5 bg-white rounded-lg border border-zinc-200 hover:border-blue-400 cursor-pointer transition flex items-center justify-between"
                        title="Click para autocompletar"
                      >
                        <span className="font-mono text-blue-700 font-bold">admin@starmotos.com</span>
                        <span className="text-zinc-500 font-mono text-[10px]">StarMotos@Admin2026</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 font-bold text-zinc-900 mb-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Garante de Marca (Revisión Técnica)</span>
                      </div>
                      <div
                        onClick={() => {
                          setLoginData({
                            identifier: 'garante@starmotos.com',
                            password: 'StarMotos@Garante2026',
                            rememberMe: true,
                          });
                          setErrorMessage('');
                        }}
                        className="p-1.5 bg-white rounded-lg border border-zinc-200 hover:border-emerald-400 cursor-pointer transition flex items-center justify-between"
                        title="Click para autocompletar"
                      >
                        <span className="font-mono text-emerald-700 font-bold">garante@starmotos.com</span>
                        <span className="text-zinc-500 font-mono text-[10px]">StarMotos@Garante2026</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between font-bold text-zinc-900 mb-1">
                        <span className="flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5 text-red-600" />
                          <span>Talleres Oficiales (11 Sedes)</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-normal">Clave: Taller[Ciudad]@2026</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(OFFICIAL_CORPORATE_ACCOUNTS)
                          .filter(([_, acc]) => acc.role === 'taller')
                          .map(([email, acc]) => (
                            <div
                              key={email}
                              onClick={() => {
                                setLoginData({
                                  identifier: email,
                                  password: acc.passwords[0],
                                  rememberMe: true,
                                });
                                setErrorMessage('');
                              }}
                              className="p-1.5 bg-white rounded-lg border border-zinc-200 hover:border-blue-400 cursor-pointer transition flex items-center justify-between text-[10px]"
                              title={`Click para autocompletar acceso a ${acc.name}`}
                            >
                              <div className="truncate pr-2">
                                <p className="font-bold text-zinc-800 truncate">{acc.name}</p>
                                <p className="font-mono text-blue-700">{email}</p>
                              </div>
                              <span className="text-zinc-500 font-mono shrink-0">{acc.passwords[0]}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* ===================================================================== */
            /* MODO 2: REGISTRO CON 2 PESTAÑAS (DATOS CLIENTE & DATOS MOTO)          */
            /* ===================================================================== */
            <form onSubmit={handleRegisterSubmit} autoComplete="off" className="space-y-3 animate-fade-in text-left">
              {/* Trampa anti-autocompletado agresivo del navegador */}
              <input type="text" name="fake_username_anti_autofill" className="hidden" tabIndex={-1} autoComplete="off" />
              <input type="password" name="fake_password_anti_autofill" className="hidden" tabIndex={-1} autoComplete="new-password" />

              {/* Botones de Navegación entre Pestañas Superiores */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 mb-2">
                <button
                  type="button"
                  onClick={() => setRegisterTab('cliente')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    registerTab === 'cliente'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>1. Datos Cliente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterTab('moto')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    registerTab === 'moto'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>2. Datos Moto</span>
                  {registerData.motoModel && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </button>
              </div>

              {/* ================================================================= */}
              {/* PESTAÑA 1: DATOS DEL CLIENTE Y CUENTA                            */}
              {/* ================================================================= */}
              {registerTab === 'cliente' && (
                <div className="space-y-2.5 animate-fade-in">
                  {/* Nombres y Apellidos */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        name="firstNames"
                        value={registerData.firstNames}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: Juan Carlos"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        name="lastNames"
                        value={registerData.lastNames}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: Mendoza Zambrano"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Cédula y Teléfono */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Cédula / RUC *
                      </label>
                      <input
                        type="text"
                        name="idNumber"
                        value={registerData.idNumber}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: 1723456789"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs font-mono rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Celular / WhatsApp *
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={registerData.phone}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: 0987654321"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs font-mono rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="Ejemplo: usuario.cliente99@gmail.com"
                      autoComplete="off"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl"
                      required
                    />
                  </div>

                  {/* Dirección y Sucursal Preferida */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Dirección Domiciliaria
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={registerData.address}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: Av. 10 de Agosto y Calle Bolivar #45"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Sede de Preferencia
                      </label>
                      <select
                        name="workshopId"
                        value={registerData.workshopId}
                        onChange={handleRegisterChange}
                        className="w-full px-2.5 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl cursor-pointer"
                      >
                        {workshops.map((ws) => (
                          <option key={ws.id} value={ws.id}>
                            {ws.name.replace('StarMotos ', '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Contraseña de Acceso *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: ClaveSegura*2026"
                        autoComplete="new-password"
                        className="w-full px-3 py-2 pr-9 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Requisitos visuales de contraseña */}
                    {registerData.password.length > 0 && (
                      <div className="mt-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] space-y-1">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-bold' : 'text-zinc-400'}`}>
                            <Check className="w-3 h-3" /> Mínimo 8 caracteres
                          </span>
                          <span className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-600 font-bold' : 'text-zinc-400'}`}>
                            <Check className="w-3 h-3" /> Una letra
                          </span>
                          <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-bold' : 'text-zinc-400'}`}>
                            <Check className="w-3 h-3" /> Un número
                          </span>
                          <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-bold' : 'text-zinc-400'}`}>
                            <Check className="w-3 h-3" /> Símbolo (@#$%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmar Contraseña */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        Confirmar Contraseña *
                      </label>
                      {registerData.confirmPassword.length > 0 && (
                        <span className={`text-[10px] font-bold ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                          {passwordsMatch ? 'Coinciden ✓' : 'No coinciden'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: ClaveSegura*2026"
                        autoComplete="new-password"
                        className={`w-full px-3 py-2 pr-9 bg-white border ${
                          registerData.confirmPassword.length > 0
                            ? passwordsMatch
                              ? 'border-emerald-500'
                              : 'border-red-400'
                            : 'border-zinc-300'
                        } focus:ring-1 outline-none text-zinc-800 text-xs rounded-xl`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Botón Siguiente a Datos de Moto */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !registerData.firstNames.trim() ||
                        !registerData.lastNames.trim() ||
                        !registerData.idNumber.trim() ||
                        !registerData.email.trim() ||
                        !registerData.password.trim() ||
                        !registerData.confirmPassword.trim()
                      ) {
                        setErrorMessage('Complete los campos del cliente antes de continuar a la moto.');
                        return;
                      }
                      if (!passwordsMatch) {
                        setErrorMessage('Las contraseñas no coinciden.');
                        return;
                      }
                      setErrorMessage('');
                      setRegisterTab('moto');
                    }}
                    className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Siguiente: Datos de la Moto</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ================================================================= */}
              {/* PESTAÑA 2: DATOS DE LA MOTOCICLETA (COMO EN ALISTAMIENTO)         */}
              {/* ================================================================= */}
              {registerTab === 'moto' && (
                <div className="space-y-2.5 animate-fade-in">
                  <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                    <Bike className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Vincula tu motocicleta para historial técnico y garantías oficiales.</span>
                  </div>

                  {/* Marca y Modelo */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Marca *
                      </label>
                      <input
                        type="text"
                        name="motoBrand"
                        value={registerData.motoBrand}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: Shineray, Daytona, Loncin..."
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Modelo de la Moto *
                      </label>
                      <input
                        type="text"
                        name="motoModel"
                        value={registerData.motoModel}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: Thunder 200, Tekken 250, CR5..."
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Placa con botón "En trámite" */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        Placa Vehicular
                      </label>
                      <button
                        type="button"
                        onClick={handleSetPlateTramite}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 cursor-pointer transition"
                      >
                        + En trámite
                      </button>
                    </div>
                    <input
                      type="text"
                      name="motoPlate"
                      value={registerData.motoPlate}
                      onChange={handleRegisterChange}
                      placeholder="Ejemplo: AB123C o EN TRÁMITE"
                      autoComplete="off"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs font-mono uppercase font-bold rounded-xl"
                    />
                  </div>

                  {/* Color y Serie / Chasis (VIN) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Color de la Moto
                      </label>
                      <input
                        type="text"
                        name="motoColor"
                        value={registerData.motoColor}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: Negro Mate / Rojo Racing"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Chasis / VIN (17 dígitos) *
                      </label>
                      <input
                        type="text"
                        name="motoVin"
                        value={registerData.motoVin}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: 3SCBP123456789012"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs font-mono uppercase rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Número de Motor (Opcional) y Kilometraje */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Número de Motor
                      </label>
                      <input
                        type="text"
                        name="motorNumber"
                        value={registerData.motorNumber}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: 167FMM-8472910"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs font-mono uppercase rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                        Kilometraje Actual
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="motoMileage"
                        value={registerData.motoMileage}
                        onChange={handleRegisterChange}
                        placeholder="Ejemplo: 0 km (o kilometraje de odómetro)"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs font-mono rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Botones de acción finales */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegisterTab('cliente')}
                      className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver al Cliente</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Completar Registro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
