export const useAuthValidation = () => {
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePasswordMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };

  const validateName = (name) => {
    return name.length >= 2 && name.length <= 100;
  };

  return {
    validateEmail,
    validatePasswordMatch,
    validateName,
  };
};
