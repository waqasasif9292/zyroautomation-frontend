import { ref, computed } from 'vue';

export const useAuthValidation = () => {
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePasswordStrength = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) return 'weak';
    const criteriaCount = [hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;
    if (criteriaCount === 3) return 'strong';
    if (criteriaCount >= 1) return 'fair';
    return 'weak';
  };

  const getPasswordStrengthColor = (strength) => {
    const colors = {
      weak: '#EF4444',
      fair: '#F59E0B',
      strong: '#22C55E',
    };
    return colors[strength] || '#EF4444';
  };

  const validatePasswordMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };

  const validateName = (name) => {
    return name.length >= 2 && name.length <= 100;
  };

  return {
    validateEmail,
    validatePasswordStrength,
    getPasswordStrengthColor,
    validatePasswordMatch,
    validateName,
  };
};
