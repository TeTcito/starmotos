// src/components/mobile/ProfileMobile.tsx
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

export const ProfileMobile: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  motorcycle,
  onUpdateMotorcycle,
  branches = [],
}) => {
  const availableWorkshops = useMemo(() => {
    return branches.length > 0 ? branches : getStoredWorkshops();
  }, [branches]);

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

  // Cliente almacenado en TallerClient
  const storedClient = useMemo(() => {
    const all = getStoredClients();
    return all.find(
      (c) =>
        (profile.idNumber && c.idNumber === profile.idNumber) ||
        (profile.email && c.email.toLowerCase() === profile.email.toLowerCase())
    );
  }, [profile.idNumber, profile.email]);

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

  // --- Cambio de Contraseña Móvil ---
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);

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

  const handleSaveProfileAndMoto = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!formData.firstNames.trim() || !formData.idNumber.trim() || !formData.email.trim()) {
      setProfileErrorMsg('Complete los nombres, cédula y correo.');
      return;
    }

    if (!formData.motoBrand.trim() || !formData.motoModel.trim()) {
      setProfileErrorMsg('Complete la marca y modelo de su motocicleta.');
      return;
    }

    const fullName = `${formData.firstNames.trim()} ${formData.lastNames.trim()}`.trim();
    const selectedWorkshop = availableWorkshops.find((w) => w.id === formData.workshopId);

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
    setProfileSuccessMsg('¡Datos actualizados con éxito!');
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

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdCurrent.trim()) {
      setPwdError('Ingrese su clave actual.');
      return;
    }

    const expectedPwd = getExpectedCurrentPassword();
    if (pwdCurrent.trim() !== expectedPwd) {
      setPwdError('La clave actual es incorrecta.');
      return;
    }

    if (pwdNew.length < 8) {
      setPwdError('Mínimo 8 caracteres en la nueva clave.');
      return;
    }

    if (pwdNew !== pwdConfirm) {
      setPwdError('La confirmación de clave no coincide.');
      return;
    }

    if (pwdNew === pwdCurrent) {
      setPwdError('La nueva clave no puede ser igual a la actual.');
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

        setPwdSuccess('¡Contraseña actualizada con éxito!');
        setPwdCurrent('');
        setPwdNew('');
        setPwdConfirm('');
        setTimeout(() => setPwdSuccess(''), 4000);
      } catch (err) {
        console.error(err);
        setPwdError('Error al guardar contraseña.');
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
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Perfil del Cliente
          </h2>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Editar</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCancelEditing}
              className="p-1.5 rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-100 text-xs font-bold transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSaveProfileAndMoto}
              className="bg-emerald-600 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>Guardar</span>
            </button>
          </div>
        )}
      </div>

      {profileSuccessMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {profileErrorMsg && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5 font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{profileErrorMsg}</span>
        </div>
      )}

      {/* BLOQUE 1: INFORMACIÓN PERSONAL */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
            Bloque 1: Información Personal
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Nombres</label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.firstNames}
                  onChange={(e) => setFormData({ ...formData, firstNames: e.target.value })}
                  placeholder="Ej: Carlos"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                  {formData.firstNames || '—'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Apellidos</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastNames}
                  onChange={(e) => setFormData({ ...formData, lastNames: e.target.value })}
                  placeholder="Ej: Andrade"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                  {formData.lastNames || '—'}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Cédula / RUC</label>
              {isEditing ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="10 dígitos"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                  {formData.idNumber || '—'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Celular</label>
              {isEditing ? (
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0991234567"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                  {formData.phone || '—'}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Correo Electrónico</label>
            {isEditing ? (
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
              />
            ) : (
              <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                {formData.email || '—'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Sede Preferida</label>
            {isEditing ? (
              <select
                value={formData.workshopId}
                onChange={(e) => setFormData({ ...formData, workshopId: e.target.value })}
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
              >
                {availableWorkshops.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.city})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                {workshopNameDisplay}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Dirección / Ciudad</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle y número de casa"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
              />
            ) : (
              <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                {formData.address || 'No especificada'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOQUE 2: INFORMACIÓN DE LA MOTOCICLETA */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Bike className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
            Bloque 2: Información de la Motocicleta
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Marca Moto</label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.motoBrand}
                  onChange={(e) => setFormData({ ...formData, motoBrand: e.target.value })}
                  placeholder="Ej: Benelli"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                  {formData.motoBrand || '—'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Modelo</label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.motoModel}
                  onChange={(e) => setFormData({ ...formData, motoModel: e.target.value })}
                  placeholder="Ej: TRK 502X"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                  {formData.motoModel || '—'}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Placa</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.motoPlate}
                  onChange={(e) => setFormData({ ...formData, motoPlate: e.target.value.toUpperCase() })}
                  placeholder="Ej: PBX-1234"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 truncate">
                  {formData.motoPlate || 'EN TRÁMITE'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Color</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.motoColor}
                  onChange={(e) => setFormData({ ...formData, motoColor: e.target.value })}
                  placeholder="Ej: Rojo / Negro"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 truncate">
                  {formData.motoColor || 'Negro'}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">N° Chasis (VIN)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.motoVin}
                  onChange={(e) => setFormData({ ...formData, motoVin: e.target.value.toUpperCase() })}
                  placeholder="17 dígitos"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                  {formData.motoVin || 'S/N'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Kilometraje</label>
              {isEditing ? (
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.motoMileage}
                  onChange={(e) => setFormData({ ...formData, motoMileage: e.target.value })}
                  placeholder="Ej: 1500"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium outline-none"
                />
              ) : (
                <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                  {Number(formData.motoMileage).toLocaleString()} KM
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">N° Motor</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.motorNumber}
                onChange={(e) => setFormData({ ...formData, motorNumber: e.target.value.toUpperCase() })}
                placeholder="Número de motor grabado"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium outline-none"
              />
            ) : (
              <div className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 truncate">
                {formData.motorNumber || 'No registrado'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOQUE 3: SEGURIDAD Y CAMBIO DE CONTRASEÑA */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <KeyRound className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
            Bloque 3: Contraseña
          </h3>
        </div>

        {pwdError && (
          <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1 font-medium animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        {pwdSuccess && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1 font-bold animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{pwdSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSavePassword} className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Contraseña Actual *</label>
            <div className="relative">
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                required
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                placeholder="Clave actual"
                className="w-full bg-white border border-zinc-300 focus:border-purple-600 text-zinc-900 rounded-xl px-2.5 pr-8 py-1.5 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 p-1"
              >
                {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Nueva Contraseña *</label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                required
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-white border border-zinc-300 focus:border-purple-600 text-zinc-900 rounded-xl px-2.5 pr-8 py-1.5 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 p-1"
              >
                {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Confirmar Nueva Contraseña *</label>
            <div className="relative">
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                required
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                placeholder="Repetir clave"
                className="w-full bg-white border border-zinc-300 focus:border-purple-600 text-zinc-900 rounded-xl px-2.5 pr-8 py-1.5 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 p-1"
              >
                {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingPwd}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer mt-1 disabled:opacity-50"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isSavingPwd ? 'Guardando...' : 'Guardar Contraseña'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
