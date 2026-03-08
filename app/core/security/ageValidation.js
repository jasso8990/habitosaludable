export const parseBirthDate = (birthDate) => {
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoPattern.test(birthDate)) return null;

  const date = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const calculateAge = (birthDate, now = new Date()) => {
  const birth = typeof birthDate === 'string' ? parseBirthDate(birthDate) : birthDate;
  if (!birth) return null;

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = now.getUTCDate() - birth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

export const isAtLeastAge = (birthDate, minimumAge) => {
  const age = calculateAge(birthDate);
  if (age === null) return { validDate: false, age: null, allowed: false };

  return {
    validDate: true,
    age,
    allowed: age >= minimumAge,
  };
};
