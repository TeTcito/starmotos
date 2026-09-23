// src/components/desktop/ProfileDesktop.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Save,
  CheckCircle2,
  X,
  Bike,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Edit3,
  AlertCircle,
  Building2,
  Gauge,
  Hash,
  Palette,
} from 'lucide-react';
import { ClientProfile, MotorcycleClientData, Branch, TallerClient } from '../../types/customer';
import { getStoredClients, saveStoredClients, getStoredWorkshops } from '../../data/mockMultiRoleData';
import { cloudSaveClient } from '../../services/supabaseService';

interface Props {
  profile: ClientProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
  motorcycle: MotorcycleClientData;
  onUpdateMotorcycle: (updated: MotorcycleClientData) => void;
  branches?: Branch[];
}

export const ProfileDesktop: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  motorcycle,
  onUpdateMotorcycle,
  branches = [],
}) => {
  const availableWorkshops = useMemo(() => {
    return branches.length > 0 ? branches : getStoredWorkshops();
  }, [branches]);

  // Modo edición para datos personales y de moto
  const [isEditing, setIsEditing] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Separar nombres y apellidos
  const initialNames = useMemo(() => {
    const parts = (profile.fullName || '').trim().split(' ');
    if (parts.length <= 1) return { first: parts[0] || '', last: '' };
    const mid = Math.ceil(parts.length / 2);
    return {
      first: parts.slice(0, mid).join(' '),
      last: parts.slice(mid).join(' '),
    };
  }, [profile.fullName]);

  // Obtener datos complementarios desde el registro en TallerClient
  const storedClient = useMemo(() => {
    const all = getStoredClients();
    return all.find(
      (c) =>
        (profile.idNumber && c.idNumber === profile.idNumber) ||
        (profile.email && c.email.toLowerCase() === profile.email.toLowerCase())
    );
  }, [profile.idNumber, profile.email]);

  // Formulario de datos del cliente
  const [formData, setFormData] = useState({
    firstNames: initialNames.first,
    lastNames: initialNames.last,
    idNumber: profile.idNumber || '',
    phone: profile.phone || '',
    email: profile.email || '',
    address: profile.address || '',
    workshopId: motorcycle.preferredBranchId || storedClient?.workshopId || availableWorkshops[0]?.id || 'matriz-la-mana',

    // Moto
    motoBrand: motorcycle.brand || storedClient?.motorcycleBrand || 'StarMotos',
    motoModel: motorcycle.model || storedClient?.motorcycleModel || '',
    motoPlate: motorcycle.plate || storedClient?.motorcyclePlate || '',
    motoColor: motorcycle.color || storedClient?.color || 'Negro',
    motoVin: motorcycle.vin || storedClient?.motorcycleVin || '',
    motoMileage: String(motorcycle.currentKm ?? storedClient?.motorcycleMileage ?? 0),
    motorNumber: storedClient?.motorNumber || '',
  });

  // Sincronizar si cambian las props
  useEffect(() => {
    setFormData({
      firstNames: initialNames.first,
      lastNames: initialNames.last,
      idNumber: profile.idNumber || '',
      phone: profile.phone || '',
      email: profile.email || '',
      address: profile.address || '',
      workshopId: motorcycle.preferredBranchId || storedClient?.workshopId || availableWorkshops[0]?.id || 'matriz-la-mana',

      motoBrand: motorcycle.brand || storedClient?.motorcycleBrand || 'StarMotos',
      motoModel: motorcycle.model || storedClient?.motorcycleModel || '',
      motoPlate: motorcycle.plate || storedClient?.motorcyclePlate || '',
      motoColor: motorcycle.color || storedClient?.color || 'Negro',
      motoVin: motorcycle.vin || storedClient?.motorcycleVin || '',
      motoMileage: String(motorcycle.currentKm ?? storedClient?.motorcycleMileage ?? 0),
      motorNumber: storedClient?.motorNumber || '',
    });
  }, [profile, motorcycle, initialNames, storedClient, availableWorkshops]);

  // --- Cambio de Contraseña ---
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  // Helper para obtener contraseña actual del cliente
  const getExpectedCurrentPassword = (): string => {
    const cleanId = (profile.idNumber || '').trim().toLowerCase();
    const cleanEmail = (profile.email || '').trim().toLowerCase();

    if (storedClient?.password) return storedClient.password;
    const fromId = cleanId ? localStorage.getItem(`starmotos_client_pwd_${cleanId}`) : null;
    if (fromId) return fromId;
    const fromEmail = cleanEmail ? localStorage.getItem(`starmotos_client_pwd_${cleanEmail}`) : null;
    if (fromEmail) return fromEmail;

    try {
      const accounts = JSON.parse(localStorage.getItem('starmotos_registered_accounts') || '{}');
      if (cleanEmail && accounts[cleanEmail]?.password) return accounts[cleanEmail].password;
      if (cleanId && accounts[cleanId]?.password) return accounts[cleanId].password;
    } catch (_) {}

    if (cleanId === '1724890123') return 'StarMotos@2026';
    return profile.idNumber?.trim() || 'StarMotos@2026';
  };

  // Guardar Cambios de Perfil y Moto
  const handleSaveProfileAndMoto = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!formData.firstNames.trim() || !formData.idNumber.trim() || !formData.email.trim()) {
      setProfileErrorMsg('Por favor complete los nombres, cédula y correo del cliente.');
      return;
    }

    if (!formData.motoBrand.trim() || !formData.motoModel.trim()) {
      setProfileErrorMsg('Por favor complete la marca y modelo de su motocicleta.');
      return;
    }

    const fullName = `${formData.firstNames.trim()} ${formData.lastNames.trim()}`.trim();
    const selectedWorkshop = availableWorkshops.find((w) => w.id === formData.workshopId);

    // 1. Actualizar Profile
    const updatedProfile: ClientProfile = {
      ...profile,
      fullName: fullName,
      idNumber: formData.idNumber.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: selectedWorkshop?.name || profile.city || 'Ecuador',
    };
    onUpdateProfile(updatedProfile);

    // 2. Actualizar Moto
    const updatedMoto: MotorcycleClientData = {
      ...motorcycle,
      brand: formData.motoBrand.trim(),
      model: formData.motoModel.trim(),
      plate: formData.motoPlate.trim().toUpperCase() || 'EN TRÁMITE',
      color: formData.motoColor.trim() || 'Negro',
      vin: formData.motoVin.trim().toUpperCase() || 'S/N',
      currentKm: Number(formData.motoMileage) || 0,
      preferredBranchId: formData.workshopId,
    };
    onUpdateMotorcycle(updatedMoto);

    // 3. Persistir en TallerClient / Supabase
    try {
      const allClients = getStoredClients();
      const existingIdx = allClients.findIndex(
        (c) =>
          c.idNumber === updatedProfile.idNumber ||
          (c.email && c.email.toLowerCase() === updatedProfile.email.toLowerCase())
      );

      const clientObj: TallerClient = {
        id: updatedProfile.idNumber,
        fullName: updatedProfile.fullName,
        idNumber: updatedProfile.idNumber,
        phone: updatedProfile.phone,
        email: updatedProfile.email,
        address: updatedProfile.address,
        workshopId: updatedMoto.preferredBranchId,
        workshopName: selectedWorkshop?.name || 'StarMotos Matriz',
        motorcycleBrand: updatedMoto.brand,
        motorcycleModel: updatedMoto.model,
        motorcyclePlate: updatedMoto.plate,
        motorcycleVin: updatedMoto.vin,
        motorNumber: formData.motorNumber.trim().toUpperCase(),
        color: updatedMoto.color,
        motorcycleMileage: updatedMoto.currentKm,
        lastVisit: storedClient?.lastVisit || new Date().toISOString().split('T')[0],
        totalVisits: storedClient?.totalVisits || 0,
        password: storedClient?.password || getExpectedCurrentPassword(),
      };

      let updatedList: TallerClient[];
      if (existingIdx >= 0) {
        updatedList = [...allClients];
        updatedList[existingIdx] = clientObj;
      } else {
        updatedList = [clientObj, ...allClients];
      }
      saveStoredClients(updatedList);
      cloudSaveClient(clientObj).catch(() => {});
    } catch (err) {
      console.error(err);
    }

    setIsEditing(false);
    setProfileSuccessMsg('¡Datos de perfil y motocicleta guardados con éxito!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  const handleCancelEditing = () => {
    setFormData({
      firstNames: initialNames.first,
      lastNames: initialNames.last,
      idNumber: profile.idNumber || '',
      phone: profile.phone || '',
      email: profile.email || '',
      address: profile.address || '',
      workshopId: motorcycle.preferredBranchId || storedClient?.workshopId || availableWorkshops[0]?.id || 'matriz-la-mana',

      motoBrand: motorcycle.brand || storedClient?.motorcycleBrand || 'StarMotos',
      motoModel: motorcycle.model || storedClient?.motorcycleModel || '',
      motoPlate: motorcycle.plate || storedClient?.motorcyclePlate || '',
      motoColor: motorcycle.color || storedClient?.color || 'Negro',
      motoVin: motorcycle.vin || storedClient?.motorcycleVin || '',
      motoMileage: String(motorcycle.currentKm ?? storedClient?.motorcycleMileage ?? 0),
      motorNumber: storedClient?.motorNumber || '',
    });
    setProfileErrorMsg('');
    setIsEditing(false);
  };

  // Guardar Cambio de Contraseña
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdCurrent.trim()) {
      setPwdError('Ingrese su contraseña actual.');
      return;
    }

    const expectedPwd = getExpectedCurrentPassword();
    if (pwdCurrent.trim() !== expectedPwd) {
      setPwdError('La contraseña actual es incorrecta. Verifique sus datos.');
      return;
    }

    if (pwdNew.length < 8) {
      setPwdError('La nueva contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    if (pwdNew !== pwdConfirm) {
      setPwdError('La confirmación de la nueva contraseña no coincide.');
      return;
    }

    if (pwdNew === pwdCurrent) {
      setPwdError('La nueva contraseña no puede ser idéntica a la anterior.');
      return;
    }

    setIsSavingPwd(true);

    setTimeout(() => {
      try {
        const cleanId = (profile.idNumber || '').trim().toLowerCase();
        const cleanEmail = (profile.email || '').trim().toLowerCase();

        if (cleanId) localStorage.setItem(`starmotos_client_pwd_${cleanId}`, pwdNew.trim());
        if (cleanEmail) localStorage.setItem(`starmotos_client_pwd_${cleanEmail}`, pwdNew.trim());

        const accounts = JSON.parse(localStorage.getItem('starmotos_registered_accounts') || '{}');
        if (cleanEmail) accounts[cleanEmail] = { ...(accounts[cleanEmail] || {}), password: pwdNew.trim(), mustChangePassword: false };
        if (cleanId) accounts[cleanId] = { ...(accounts[cleanId] || {}), password: pwdNew.trim(), mustChangePassword: false };
        localStorage.setItem('starmotos_registered_accounts', JSON.stringify(accounts));

        const allClients = getStoredClients();
        const updatedList = allClients.map((c) => {
          const matchId = cleanId && c.idNumber && c.idNumber.trim().toLowerCase() === cleanId;
          const matchEmail = cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail;
          if (matchId || matchEmail) {
            const up: TallerClient = { ...c, password: pwdNew.trim(), mustChangePassword: false };
            cloudSaveClient(up).catch(() => {});
            return up;
          }
          return c;
        });
        saveStoredClients(updatedList);

        setPwdSuccess('¡Contraseña actualizada con éxito! Utilice su nueva clave en su próximo inicio de sesión.');
        setPwdCurrent('');
        setPwdNew('');
        setPwdConfirm('');
        setTimeout(() => setPwdSuccess(''), 5000);
      } catch (err) {
        console.error(err);
        setPwdError('Ocurrió un error al guardar la contraseña.');
      } finally {
        setIsSavingPwd(false);
      }
    }, 400);
  };

  const workshopNameDisplay = useMemo(() => {
    const ws = availableWorkshops.find((w) => w.id === formData.workshopId);
    return ws ? `${ws.name} (${ws.city})` : 'StarMotos Matriz';
  }, [formData.workshopId, availableWorkshops]);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Encabezado de Sección */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Perfil del Cliente
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Información personal, datos oficiales de la motocicleta y configuración de seguridad
          </p>
        </div>

        {/* Acciones de Encabezado */}
        <div className="flex items-center gap-3">
          {profileSuccessMsg && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-300 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {profileSuccessMsg}
            </span>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Información</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEditing}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-zinc-500" />
                <span>Cancelar</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfileAndMoto}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {profileErrorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{profileErrorMsg}</span>
        </div>
      )}

      {/* ===================== CONTENEDOR HORIZONTAL EN 3 BLOQUES (UNO AL LADO DEL OTRO) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ===================== BLOQUE 1: INFORMACIÓN PERSONAL ===================== */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                    Bloque 1: Información Personal
                  </h3>
                  <p className="text-[11px] text-zinc-500">Datos personales y facturación</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase shrink-0">
                Cliente
              </span>
            </div>

            <div className="space-y-3">
              {/* Nombres & Apellidos */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nombres {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={formData.firstNames}
                      onChange={(e) => setFormData({ ...formData, firstNames: e.target.value })}
                      placeholder="Ej: Carlos"
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-medium outline-none transition"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                      {formData.firstNames || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Apellidos
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastNames}
                      onChange={(e) => setFormData({ ...formData, lastNames: e.target.value })}
                      placeholder="Ej: Andrade"
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-medium outline-none transition"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                      {formData.lastNames || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Cédula/RUC & Celular */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Cédula / RUC {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={formData.idNumber}
                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                        placeholder="10 o 13 dígitos"
                        className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-8 pr-2 py-2 text-xs font-mono font-medium outline-none transition"
                      />
                    ) : (
                      <div className="pl-8 pr-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                        {formData.idNumber || '—'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Celular / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0991234567"
                        className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-8 pr-2 py-2 text-xs font-mono font-medium outline-none transition"
                      />
                    ) : (
                      <div className="pl-8 pr-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                        {formData.phone || '—'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Correo Electrónico {isEditing && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {isEditing ? (
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ejemplo@correo.com"
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none transition"
                    />
                  ) : (
                    <div className="pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                      {formData.email || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Sede Preferida */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Sede Preferida StarMotos
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {isEditing ? (
                    <select
                      value={formData.workshopId}
                      onChange={(e) => setFormData({ ...formData, workshopId: e.target.value })}
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none transition cursor-pointer"
                    >
                      {availableWorkshops.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name} ({ws.city})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                      {workshopNameDisplay}
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección Domiciliaria */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Dirección Domiciliaria y Ciudad
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Dirección y ciudad"
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none transition"
                    />
                  ) : (
                    <div className="pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                      {formData.address || 'No especificada'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bloque 1 */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Identidad oficial validada</span>
            {isEditing && (
              <button
                type="button"
                onClick={handleSaveProfileAndMoto}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-[10px] transition cursor-pointer"
              >
                Guardar
              </button>
            )}
          </div>
        </div>

        {/* ===================== BLOQUE 2: INFORMACIÓN DE LA MOTOCICLETA ===================== */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                    Bloque 2: Información de la Moto
                  </h3>
                  <p className="text-[11px] text-zinc-500">Ficha técnica y chasis</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase font-mono shrink-0">
                {formData.motoPlate || 'EN TRÁMITE'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Marca & Modelo */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Marca Moto {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={formData.motoBrand}
                      onChange={(e) => setFormData({ ...formData, motoBrand: e.target.value })}
                      placeholder="Ej: Benelli"
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-medium outline-none transition"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                      {formData.motoBrand || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Modelo {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={formData.motoModel}
                      onChange={(e) => setFormData({ ...formData, motoModel: e.target.value })}
                      placeholder="Ej: TRK 502X"
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-medium outline-none transition"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                      {formData.motoModel || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Placa & Color */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Placa Oficial
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.motoPlate}
                        onChange={(e) => setFormData({ ...formData, motoPlate: e.target.value.toUpperCase() })}
                        placeholder="Ej: PBX-1234"
                        className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-8 pr-2 py-2 text-xs font-mono font-bold outline-none transition"
                      />
                    ) : (
                      <div className="pl-8 pr-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 truncate">
                        {formData.motoPlate || 'EN TRÁMITE'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Color
                  </label>
                  <div className="relative">
                    <Palette className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.motoColor}
                        onChange={(e) => setFormData({ ...formData, motoColor: e.target.value })}
                        placeholder="Ej: Negro"
                        className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-8 pr-2 py-2 text-xs font-medium outline-none transition"
                      />
                    ) : (
                      <div className="pl-8 pr-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                        {formData.motoColor || 'Negro'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* N° Chasis (VIN) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  N° Chasis (VIN)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.motoVin}
                    onChange={(e) => setFormData({ ...formData, motoVin: e.target.value.toUpperCase() })}
                    placeholder="17 caracteres"
                    className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-mono font-medium outline-none transition"
                  />
                ) : (
                  <div className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                    {formData.motoVin || 'S/N'}
                  </div>
                )}
              </div>

              {/* Kilometraje & N° Motor */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Kilometraje
                  </label>
                  <div className="relative">
                    <Gauge className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.motoMileage}
                        onChange={(e) => setFormData({ ...formData, motoMileage: e.target.value })}
                        placeholder="Ej: 1500"
                        className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl pl-8 pr-2 py-2 text-xs font-mono font-medium outline-none transition"
                      />
                    ) : (
                      <div className="pl-8 pr-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                        {Number(formData.motoMileage).toLocaleString()} KM
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    N° Motor
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.motorNumber}
                      onChange={(e) => setFormData({ ...formData, motorNumber: e.target.value.toUpperCase() })}
                      placeholder="Grabado en motor"
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-mono font-medium outline-none transition"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                      {formData.motorNumber || 'No registrado'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bloque 2 */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Vehículo asociado a la cuenta</span>
            {isEditing && (
              <button
                type="button"
                onClick={handleSaveProfileAndMoto}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-3 rounded-lg text-[10px] transition cursor-pointer"
              >
                Guardar
              </button>
            )}
          </div>
        </div>

        {/* ===================== BLOQUE 3: SEGURIDAD Y CAMBIO DE CONTRASEÑA ===================== */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4">
          <form onSubmit={handleSavePassword} className="h-full flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                      Bloque 3: Contraseña
                    </h3>
                    <p className="text-[11px] text-zinc-500">Actualiza tu clave de acceso</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 shrink-0">
                  <Shield className="w-3 h-3" />
                  Seguridad
                </span>
              </div>

              {pwdError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Contraseña Actual */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      required
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(e.target.value)}
                      placeholder="Tu clave actual"
                      className="w-full bg-white border border-zinc-300 focus:border-purple-600 text-zinc-900 rounded-xl pl-3 pr-9 py-2 text-xs font-medium outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                    >
                      {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-white border border-zinc-300 focus:border-purple-600 text-zinc-900 rounded-xl pl-3 pr-9 py-2 text-xs font-medium outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                    >
                      {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      required
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      placeholder="Repetir nueva clave"
                      className="w-full bg-white border border-zinc-300 focus:border-purple-600 text-zinc-900 rounded-xl pl-3 pr-9 py-2 text-xs font-medium outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                    >
                      {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {pwdConfirm && (
                    <span
                      className={`text-[10px] mt-1 block font-bold ${
                        pwdNew === pwdConfirm ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {pwdNew === pwdConfirm ? '✓ Las contraseñas coinciden' : '✗ No coinciden'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 leading-tight">
                  Mínimo 8 caracteres para acceso seguro a citas y órdenes.
                </p>
              </div>
            </div>

            {/* Footer Bloque 3: Botón Guardar */}
            <div className="pt-2 border-t border-zinc-100">
              <button
                type="submit"
                disabled={isSavingPwd}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isSavingPwd ? 'Guardando...' : 'Actualizar Contraseña'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
