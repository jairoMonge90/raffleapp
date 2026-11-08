import React, { useState } from 'react';
import { getDefaultAvatar } from '../utils/avatars';
import { Gender } from '../types';

interface Props {
  photoUrl?: string;
  name: string;
  gender?: Gender;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showGenderBadge?: boolean;
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
};

export const UserAvatar: React.FC<Props> = ({
  photoUrl,
  name,
  gender = 'hombre',
  size = 'md',
  className = '',
  showGenderBadge = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const fallbackSrc = getDefaultAvatar(gender, name);
  const effectiveSrc = (!imgError && photoUrl && photoUrl.trim()) ? photoUrl : fallbackSrc;

  const isMale = gender === 'hombre';
  const gradientBorder = isMale
    ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 shadow-blue-500/20'
    : 'bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-400 shadow-pink-500/20';

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {/* Outer vibrant halo & border */}
      <div className={`p-0.5 rounded-full ${gradientBorder} shadow-md transition-transform hover:scale-105 duration-200`}>
        <div className="rounded-full bg-white dark:bg-slate-900 p-0.5 overflow-hidden">
          <img
            src={effectiveSrc}
            alt={name || 'Usuario'}
            onError={() => setImgError(true)}
            className={`${sizeMap[size]} rounded-full object-cover bg-slate-100 dark:bg-slate-800 select-none`}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {showGenderBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-[8px] font-bold text-white ${
            gender === 'mujer' ? 'bg-pink-500' : 'bg-blue-500'
          }`}
          title={gender === 'mujer' ? 'Mujer' : 'Hombre'}
        >
          {gender === 'mujer' ? '♀' : '♂'}
        </span>
      )}
    </div>
  );
};
