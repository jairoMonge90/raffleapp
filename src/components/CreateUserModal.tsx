import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Check, RefreshCw, Sparkles, SwitchCamera } from 'lucide-react';
import { AppUser, Gender } from '../types';
import { getDefaultAvatar } from '../utils/avatars';
import { UserAvatar } from './UserAvatar';
import { soundEffects } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: AppUser) => void;
}

export const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, onUserCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender>('hombre');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  // Fullscreen Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [flashAnimation, setFlashAnimation] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Por favor selecciona una imagen menor a 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          soundEffects.playSuccessChime();
          soundEffects.vibrate(30);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startLiveCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    // Stop any existing stream before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        galleryInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraFacing(facing);
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      console.warn('Camera access error, fallback to file input', err);
      galleryInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startLiveCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const startX = ((video.videoWidth || size) - size) / 2;
        const startY = ((video.videoHeight || size) - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Shutter feedback
        setFlashAnimation(true);
        soundEffects.playCameraClick();
        soundEffects.vibrate(60);

        setTimeout(() => {
          setPhotoUrl(dataUrl);
          setFlashAnimation(false);
          stopCamera();
        }, 150);
        return;
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalPhoto = photoUrl.trim() || getDefaultAvatar(gender, name.trim());

    const newUser: AppUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      gender,
      photoUrl: finalPhoto,
      createdAt: Date.now(),
    };

    onUserCreated(newUser);
    soundEffects.playSuccessChime();
    soundEffects.vibrate([50, 40, 50]);

    // Reset state
    setName('');
    setPhone('');
    setGender('hombre');
    setPhotoUrl('');
    stopCamera();
    onClose();
  };

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* FULLSCREEN CAMERA OVERLAY (PER USER REQUIREMENT)     */}
      {/* ---------------------------------------------------- */}
      {cameraActive && (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col justify-between animate-in fade-in select-none">
          {/* Flash animation on capture */}
          {flashAnimation && (
            <div className="fixed inset-0 bg-white z-[130] animate-out fade-out duration-200 pointer-events-none" />
          )}

          {/* Top Camera Bar */}
          <div
            className="flex items-center justify-between px-6 py-4 z-20 bg-gradient-to-b from-black/80 to-transparent"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
          >
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-white text-sm font-bold tracking-wide">
              Tomar Foto del Usuario
            </span>

            <button
              onClick={toggleCameraFacing}
              className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition"
              title="Voltear Cámara"
            >
              <SwitchCamera className="w-5 h-5 text-indigo-400" />
            </button>
          </div>

          {/* Center Viewfinder with Circular Portrait Guide */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Circular framing overlay */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center pointer-events-none">
                <div className="w-full h-full rounded-full ring-4 ring-indigo-500/40" />
              </div>
              <span className="text-white/90 text-xs font-semibold mt-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md">
                Centra el rostro dentro del círculo
              </span>
            </div>
          </div>

          {/* Bottom Shutter Action Bar */}
          <div
            className="px-8 py-6 z-20 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-around"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
          >
            {/* Gallery alternative button */}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                galleryInputRef.current?.click();
              }}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-pink-400" />
              </div>
              <span className="text-[10px] font-semibold">Galería</span>
            </button>

            {/* Native Large Shutter Button */}
            <button
              type="button"
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white p-1.5 flex items-center justify-center bg-white/20 active:scale-90 transition shadow-2xl"
              title="Capturar Foto"
            >
              <div className="w-full h-full bg-white rounded-full shadow-inner hover:scale-95 transition-transform" />
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={stopCamera}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <X className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-[10px] font-semibold">Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MAIN REGISTRATION FORM MODAL                         */}
      {/* ---------------------------------------------------- */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative my-8 transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold">Registrar Nuevo Usuario</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quedará disponible para todas las rifas</p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Photo & Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <UserAvatar
                  photoUrl={photoUrl || undefined}
                  name={name || (gender === 'hombre' ? 'Hombre' : 'Mujer')}
                  gender={gender}
                  size="xl"
                />
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-md text-[10px]"
                    title="Eliminar foto personalizada"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
                {photoUrl
                  ? 'Foto capturada con éxito'
                  : 'Sin foto: se usará el avatar predeterminado de género'}
              </p>

              {/* Photo Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => startLiveCamera('user')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold text-indigo-600 dark:text-indigo-300 transition shadow-sm"
                >
                  <Camera className="w-4 h-4 text-indigo-500" />
                  <span>Tomar Foto (Pantalla Completa)</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <ImageIcon className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                  <span>Galería</span>
                </button>

                {/* Hidden gallery file input */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Gender Radio Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Género (Avatar por defecto)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    gender === 'hombre'
                      ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="hombre"
                    checked={gender === 'hombre'}
                    onChange={() => setGender('hombre')}
                    className="sr-only"
                  />
                  <span className="text-sm">Hombre</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    gender === 'mujer'
                      ? 'border-pink-500 bg-pink-500/15 text-pink-600 dark:text-pink-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="mujer"
                    checked={gender === 'mujer'}
                    onChange={() => setGender('mujer')}
                    className="sr-only"
                  />
                  <span className="text-sm">Mujer</span>
                </label>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Sofía Hernández"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Teléfono / Contacto (Opcional)
              </label>
              <input
                type="tel"
                placeholder="Ej. +52 55 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-lg transition"
              >
                Guardar Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
