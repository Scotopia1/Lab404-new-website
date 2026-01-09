'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Shield } from 'lucide-react';
import type { PasswordStrengthResult } from '@/types/password-security';
import { PASSWORD_STRENGTH_LABELS, PASSWORD_STRENGTH_COLORS } from '@/types/password-security';

interface PasswordStrengthMeterProps {
  password: string;
  email?: string;
  customerId?: string;
  onStrengthChange?: (result: PasswordStrengthResult | null) => void;
}

export function PasswordStrengthMeter({
  password,
  email,
  customerId,
  onStrengthChange,
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<PasswordStrengthResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Don't check empty passwords
    if (!password || password.length === 0) {
      setStrength(null);
      onStrengthChange?.(null);
      return;
    }

    // Debounce password check
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const response = await fetch('/api/auth/password/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            email,
            customerId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setStrength(data.data);
          onStrengthChange?.(data.data);
        } else {
          // If check fails, don't show anything
          setStrength(null);
          onStrengthChange?.(null);
        }
      } catch (error) {
        console.error('Password strength check failed:', error);
        setStrength(null);
        onStrengthChange?.(null);
      } finally {
        setIsChecking(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [password, email, customerId, onStrengthChange]);

  if (!password || !strength) {
    return null;
  }

  const strengthLabel = PASSWORD_STRENGTH_LABELS[strength.score];
  const strengthColor = PASSWORD_STRENGTH_COLORS[strength.score];

  // Calculate progress bar width (0-100%)
  const progressWidth = (strength.score / 4) * 100;

  // Get color classes based on strength
  const getColorClasses = () => {
    switch (strength.score) {
      case 0:
      case 1:
        return 'bg-red-500 text-red-700 border-red-200';
      case 2:
        return 'bg-yellow-500 text-yellow-700 border-yellow-200';
      case 3:
        return 'bg-lime-500 text-lime-700 border-lime-200';
      case 4:
        return 'bg-green-500 text-green-700 border-green-200';
      default:
        return 'bg-gray-500 text-gray-700 border-gray-200';
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="mt-2 space-y-2 text-sm">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">
            Password Strength: <span className={`font-bold ${colorClasses.split(' ')[2]}`}>{strengthLabel}</span>
          </span>
          {isChecking && (
            <span className="text-xs text-gray-400">Checking...</span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${colorClasses.split(' ')[0]}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Breach Warning */}
      {strength.isBreached && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-800">
              Password Compromised
            </p>
            <p className="text-xs text-red-700">
              This password has been found in {strength.breachCount.toLocaleString()} data breach
              {strength.breachCount > 1 ? 'es' : ''}. Choose a different password.
            </p>
          </div>
        </div>
      )}

      {/* Reuse Warning */}
      {strength.isReused && (
        <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-orange-800">
              Password Reused
            </p>
            <p className="text-xs text-orange-700">
              You've used this password before. Please choose a new password.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Warning */}
      {strength.feedback.warning && !strength.isBreached && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            {strength.feedback.warning}
          </p>
        </div>
      )}

      {/* Suggestions */}
      {strength.feedback.suggestions.length > 0 && !strength.isBreached && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600">Suggestions:</p>
          <ul className="space-y-1">
            {strength.feedback.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-gray-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Crack Time (only for good passwords) */}
      {strength.score >= 3 && !strength.isBreached && (
        <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-800">
              Strong Password
            </p>
            <p className="text-xs text-green-700">
              Estimated crack time: {strength.crackTime}
            </p>
          </div>
        </div>
      )}

      {/* Password Requirements Checklist */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-1">Requirements:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <RequirementItem
            met={password.length >= 8}
            text="At least 8 characters"
          />
          <RequirementItem
            met={/[A-Z]/.test(password)}
            text="One uppercase letter"
          />
          <RequirementItem
            met={/[a-z]/.test(password)}
            text="One lowercase letter"
          />
          <RequirementItem
            met={/[0-9]/.test(password)}
            text="One number"
          />
          <RequirementItem
            met={!strength.isBreached}
            text="Not in data breaches"
          />
          <RequirementItem
            met={!strength.isReused}
            text="Not previously used"
          />
        </div>
      </div>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-green-700' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
}
