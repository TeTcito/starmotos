// src/components/LoginView.tsx
import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Check,
} from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Formulario de inicio de sesión
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });

  // Formulario de registro con nombres y apellidos independientes
  const [registerData, setRegisterData] = useState({
    firstNames: '',
    lastNames: '',
    idNumber: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Validaciones dinámicas de la contraseña
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

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuickFill = () => {
    setLoginData({
      identifier: 'cliente@starmotos.ec',
      password: '123456',
      rememberMe: true,
    });
    setErrorMessage('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginData.identifier.trim() || !loginData.password.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico o cédula y contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = loginData.identifier.trim().toLowerCase();
      if (
        cleanUser === 'cliente@starmotos.ec' ||
        cleanUser === '1724890123' ||
        cleanUser.includes('cliente') ||
        cleanUser.includes('starmotos') ||
        loginData.password.length >= 4
      ) {
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setErrorMessage('Credenciales no encontradas en el sistema.');
      }
    }, 500);
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
      setErrorMessage('Por favor complete todos los campos obligatorios para registrarse.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('La contraseña debe cumplir con todos los requisitos de seguridad indicados.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('¡Cuenta creada con éxito! Redirigiendo a tu portal...');
      setTimeout(() => {
        onLoginSuccess();
      }, 700);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row overflow-x-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* LADO IZQUIERDO (2/3 DEL ANCHO): IMAGEN HERO A PANTALLA COMPLETA (DESKTOP)  */}
      {/* ========================================================================= */}
      <div className="hidden lg:block relative lg:w-2/3 h-full min-h-screen overflow-hidden shrink-0 bg-zinc-950 select-none">
        {/* Imagen ocupando el 100% del contenedor con encuadre perfecto hacia la moto */}
        <img
          src="/login-motorcycle-cliff.jpg"
          alt="StarMotos Aventura y Precisión en Ruta"
          className="w-full h-full min-h-screen object-cover transition-transform duration-1000 ease-out hover:scale-105"
          style={{ objectPosition: '72% 50%' }}
        />

        {/* Gradiente cinematográfico inferior para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Texto "Bienvenido" elegante sobre la imagen en la esquina inferior */}
        <div className="absolute bottom-6 left-6 sm:bottom-12 sm:left-12 z-10 select-none pointer-events-none max-w-xl">
          <h2 className="text-3xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            Bienvenido
          </h2>
          <p className="text-xs sm:text-base text-zinc-100 mt-1.5 sm:mt-2 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] max-w-lg">
            Portal oficial de seguimiento vehicular y servicio técnico de StarMotos.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LADO DERECHO (1/3 EN DESKTOP, PANTALLA COMPLETA EN MÓVIL): FORMULARIO       */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/3 min-h-screen lg:min-h-full flex items-center justify-center bg-white p-5 sm:p-8 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Encabezado: Logo, Nombre del Taller y Título Elegante StarMotos */}
          <div className="mb-6 text-center">
            {/* Logo Oficial de StarMotos */}
            <div className="inline-flex p-1.5 rounded-full bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md mb-2.5">
              <img
                src="/starmotos-logo.jpg"
                alt="Logo StarMotos"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover bg-white"
              />
            </div>

            {/* Nombre del Taller */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
                Taller Mecánico Especializado
              </span>
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-red-400" />
            </div>

            {/* Título Elegante y Original StarMotos */}
            <h1 className="text-3xl sm:text-4xl font-black tracking-wider uppercase">
              <span className="text-blue-600 drop-shadow-sm">STAR</span>
              <span className="text-red-600 drop-shadow-sm">MOTOS</span>
            </h1>

            {/* Subtítulo con toggle a Registrarse */}
            {!isRegisterMode ? (
              <p className="text-xs sm:text-sm text-zinc-600 mt-1.5">
                ¿No tienes una cuenta aún?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  Registrarse
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-zinc-600 mt-1.5 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a Iniciar Sesión
                </button>
              </p>
            )}
          </div>

          {/* Mensajes de Alerta */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ===================================================================== */}
          {/* MODO 1: FORMULARIO DE INICIO DE SESIÓN                                */}
          {/* ===================================================================== */}
          {!isRegisterMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Correo Electrónico o Cédula */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico o Cédula
                </label>
                <input
                  type="text"
                  name="identifier"
                  value={loginData.identifier}
                  onChange={handleLoginChange}
                  placeholder="Ejemplo: correo electrónico de ejemplo (o C.I.)"
                  className="w-full px-4 py-3 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-sm placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all"
                  required
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Ejemplo: ••••••••"
                    className="w-full px-4 py-3 pr-12 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-sm placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded-full transition cursor-pointer text-zinc-500 hover:text-zinc-700"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-zinc-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Fila Recordarme + Olvidaste contraseña */}
              <div className="flex items-center justify-between pt-1">
                <label htmlFor="rememberMe" className="flex items-center space-x-2 text-xs sm:text-sm text-zinc-700 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleLoginChange}
                    className="w-4 h-4 bg-white border border-zinc-400 rounded cursor-pointer accent-blue-600"
                  />
                  <span>Recordarme</span>
                </label>

                <button
                  type="button"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón de Ingreso */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>

              {/* Enlace inferior: ¿No tienes cuenta? Registrarte */}
              <div className="text-center pt-2 text-xs sm:text-sm text-zinc-600">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMessage('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  Registrarte
                </button>
              </div>

              {/* Divisor */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-zinc-500 font-medium">o continuar con</span>
                </div>
              </div>

              {/* Botones de Acción: Google y Acceso Demo */}
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="flex items-center justify-center px-4 py-2.5 bg-white border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 rounded-xl transition cursor-pointer text-zinc-700 font-semibold text-xs sm:text-sm shadow-xs"
                >
                  {/* Google SVG */}
                  <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="flex items-center justify-center px-4 py-2.5 bg-white border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 rounded-xl transition cursor-pointer group text-zinc-700 font-semibold text-xs sm:text-sm shadow-xs"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <span>Acceso Demo</span>
                </button>
              </div>
            </form>
          ) : (
            /* ===================================================================== */
            /* MODO 2: FORMULARIO DE REGISTRO CON CAMPOS Y VALIDACIÓN DINÁMICA        */
            /* ===================================================================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-fade-in text-left">
              <div className="border-b border-zinc-200 pb-2 mb-2">
                <h3 className="text-base font-bold text-zinc-800">Crear Cuenta de Cliente</h3>
                <p className="text-xs text-zinc-500">Registra tus datos para vincular tu motocicleta</p>
              </div>

              {/* Nombres y Apellidos Independientes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    name="firstNames"
                    value={registerData.firstNames}
                    onChange={handleRegisterChange}
                    placeholder="Ejemplo: Fernando David"
                    className="w-full px-3 py-2 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-xs placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="lastNames"
                    value={registerData.lastNames}
                    onChange={handleRegisterChange}
                    placeholder="Ejemplo: Paredes Zambrano"
                    className="w-full px-3 py-2 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-xs placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              {/* Cédula de Identidad / RUC */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Cédula de Identidad / RUC
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={registerData.idNumber}
                  onChange={handleRegisterChange}
                  placeholder="Ejemplo: 1724890123"
                  className="w-full px-3 py-2 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-xs placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all font-mono"
                  required
                />
              </div>

              {/* Correo Electrónico y Teléfono */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="Ejemplo: correo de ejemplo"
                    className="w-full px-3 py-2 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-xs placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    placeholder="Ejemplo: 0991234567"
                    className="w-full px-3 py-2 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-xs placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all font-mono"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Ejemplo: ••••••••"
                    className="w-full px-3 py-2 pr-10 bg-white border border-zinc-400 hover:border-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-700 font-normal text-xs placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition cursor-pointer text-zinc-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-zinc-600" /> : <Eye className="w-4 h-4 text-zinc-600" />}
                  </button>
                </div>

                {/* Indicaciones dinámicas con aspecto en verde al ir completando */}
                {registerData.password.length > 0 && (
                  <div className="mt-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 text-[11px] animate-fade-in">
                    <span className="font-bold text-zinc-600 block mb-1">
                      Requisitos de seguridad:
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className={`flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-zinc-400'}`}>
                        {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 ml-1 mr-1 shrink-0" />}
                        <span>Mínimo 8 caracteres</span>
                      </div>
                      <div className={`flex items-center gap-1.5 transition-colors ${hasLetter ? 'text-emerald-700 font-semibold' : 'text-zinc-400'}`}>
                        {hasLetter ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 ml-1 mr-1 shrink-0" />}
                        <span>Al menos una letra</span>
                      </div>
                      <div className={`flex items-center gap-1.5 transition-colors ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-zinc-400'}`}>
                        {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 ml-1 mr-1 shrink-0" />}
                        <span>Al menos un número</span>
                      </div>
                      <div className={`flex items-center gap-1.5 transition-colors ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-zinc-400'}`}>
                        {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 ml-1 mr-1 shrink-0" />}
                        <span>Símbolo (@#$%*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Confirmar Contraseña
                  </label>
                  {registerData.confirmPassword.length > 0 && (
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                      {passwordsMatch ? (
                        <>
                          <Check className="w-3 h-3" /> Coinciden
                        </>
                      ) : (
                        'No coinciden'
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Repite tu contraseña"
                    className={`w-full px-3 py-2 pr-10 bg-white border ${
                      registerData.confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-emerald-500 focus:border-emerald-600'
                          : 'border-red-400 focus:border-red-500'
                        : 'border-zinc-400 hover:border-zinc-500 focus:border-blue-600'
                    } focus:ring-1 outline-none text-zinc-700 font-normal text-xs placeholder:text-zinc-400 placeholder:font-normal rounded-xl transition-all`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition cursor-pointer text-zinc-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-zinc-600" /> : <Eye className="w-4 h-4 text-zinc-600" />}
                  </button>
                </div>
              </div>

              {/* Botón de Registro */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm mt-3"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registrando cuenta...</span>
                  </>
                ) : (
                  'Registrarse e Ingresar'
                )}
              </button>

              <div className="text-center pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-900 font-medium underline cursor-pointer"
                >
                  ¿Ya tienes cuenta? Iniciar Sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
