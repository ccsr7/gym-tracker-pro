/**
 * Input Validation Utilities
 *
 * Centralized validation functions for all user inputs
 * to prevent invalid data and improve data integrity
 */

// ============================================
// NUMERIC VALIDATIONS
// ============================================

interface NumericValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

/**
 * Validate weight input (0-999 kg, max 1 decimal place)
 */
export function validateWeight(input: string | number): NumericValidationResult {
  const value = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(value)) {
    return {
      isValid: false,
      value: 0,
      error: 'Peso debe ser un número'
    };
  }

  if (value < 0) {
    return {
      isValid: false,
      value: 0,
      error: 'Peso no puede ser negativo'
    };
  }

  if (value > 999) {
    return {
      isValid: false,
      value: 999,
      error: 'Peso máximo es 999 kg'
    };
  }

  // Check decimal places
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > 1) {
    return {
      isValid: false,
      value: Math.round(value * 10) / 10,
      error: 'Peso permite máximo 1 decimal'
    };
  }

  return {
    isValid: true,
    value: Math.round(value * 10) / 10 // Ensure 1 decimal max
  };
}

/**
 * Validate reps input (1-999, integers only)
 */
export function validateReps(input: string | number): NumericValidationResult {
  const value = typeof input === 'string' ? parseInt(input, 10) : Math.floor(input);

  if (isNaN(value)) {
    return {
      isValid: false,
      value: 0,
      error: 'Repeticiones debe ser un número'
    };
  }

  if (value < 1) {
    return {
      isValid: false,
      value: 1,
      error: 'Mínimo 1 repetición'
    };
  }

  if (value > 999) {
    return {
      isValid: false,
      value: 999,
      error: 'Máximo 999 repeticiones'
    };
  }

  return {
    isValid: true,
    value: Math.floor(value) // Ensure integer
  };
}

/**
 * Validate RPE (Rate of Perceived Exertion) input (1-10)
 */
export function validateRPE(input: string | number): NumericValidationResult {
  const value = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(value)) {
    return {
      isValid: false,
      value: 5,
      error: 'RPE debe ser un número'
    };
  }

  if (value < 1) {
    return {
      isValid: false,
      value: 1,
      error: 'RPE mínimo es 1'
    };
  }

  if (value > 10) {
    return {
      isValid: false,
      value: 10,
      error: 'RPE máximo es 10'
    };
  }

  return {
    isValid: true,
    value: Math.round(value * 10) / 10 // Allow 1 decimal
  };
}

/**
 * Validate body weight (20-300 kg, max 1 decimal)
 */
export function validateBodyWeight(input: string | number): NumericValidationResult {
  const value = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(value)) {
    return {
      isValid: false,
      value: 70,
      error: 'Peso corporal debe ser un número'
    };
  }

  if (value < 20) {
    return {
      isValid: false,
      value: 20,
      error: 'Peso mínimo es 20 kg'
    };
  }

  if (value > 300) {
    return {
      isValid: false,
      value: 300,
      error: 'Peso máximo es 300 kg'
    };
  }

  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > 1) {
    return {
      isValid: false,
      value: Math.round(value * 10) / 10,
      error: 'Peso permite máximo 1 decimal'
    };
  }

  return {
    isValid: true,
    value: Math.round(value * 10) / 10
  };
}

/**
 * Validate height (50-250 cm, integers only)
 */
export function validateHeight(input: string | number): NumericValidationResult {
  const value = typeof input === 'string' ? parseInt(input, 10) : Math.floor(input);

  if (isNaN(value)) {
    return {
      isValid: false,
      value: 170,
      error: 'Altura debe ser un número'
    };
  }

  if (value < 50) {
    return {
      isValid: false,
      value: 50,
      error: 'Altura mínima es 50 cm'
    };
  }

  if (value > 250) {
    return {
      isValid: false,
      value: 250,
      error: 'Altura máxima es 250 cm'
    };
  }

  return {
    isValid: true,
    value: Math.floor(value)
  };
}

// ============================================
// STRING VALIDATIONS
// ============================================

interface StringValidationResult {
  isValid: boolean;
  value: string;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): StringValidationResult {
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      value: '',
      error: 'Email es requerido'
    };
  }

  if (trimmed.length > 255) {
    return {
      isValid: false,
      value: trimmed.substring(0, 255),
      error: 'Email es demasiado largo'
    };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      value: trimmed,
      error: 'Email inválido'
    };
  }

  return {
    isValid: true,
    value: trimmed.toLowerCase()
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): StringValidationResult {
  if (password.length === 0) {
    return {
      isValid: false,
      value: '',
      error: 'Contraseña es requerida'
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      value: password,
      error: 'Contraseña debe tener al menos 6 caracteres'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      value: password.substring(0, 128),
      error: 'Contraseña es demasiado larga'
    };
  }

  return {
    isValid: true,
    value: password
  };
}

/**
 * Validate name (no special characters, max length)
 */
export function validateName(name: string): StringValidationResult {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      value: '',
      error: 'Nombre es requerido'
    };
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      value: trimmed,
      error: 'Nombre debe tener al menos 2 caracteres'
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      value: trimmed.substring(0, 50),
      error: 'Nombre es demasiado largo'
    };
  }

  // Allow letters, spaces, hyphens, and accented characters
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]+$/;

  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      value: trimmed,
      error: 'Nombre contiene caracteres inválidos'
    };
  }

  return {
    isValid: true,
    value: trimmed
  };
}

/**
 * Validate routine/exercise name
 */
export function validateRoutineName(name: string): StringValidationResult {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      value: '',
      error: 'Nombre es requerido'
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      value: trimmed,
      error: 'Nombre debe tener al menos 3 caracteres'
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      value: trimmed.substring(0, 100),
      error: 'Nombre es demasiado largo'
    };
  }

  return {
    isValid: true,
    value: trimmed
  };
}

/**
 * Validate notes/description
 */
export function validateNotes(notes: string): StringValidationResult {
  const trimmed = notes.trim();

  if (trimmed.length > 1000) {
    return {
      isValid: false,
      value: trimmed.substring(0, 1000),
      error: 'Notas son demasiado largas (máximo 1000 caracteres)'
    };
  }

  return {
    isValid: true,
    value: trimmed
  };
}

// ============================================
// SANITIZATION
// ============================================

/**
 * Sanitize HTML to prevent XSS
 * Basic implementation - for production use a library like DOMPurify
 */
export function sanitizeHTML(html: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return html.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(input: string): string {
  return sanitizeHTML(input.trim());
}

// ============================================
// COMPOSITE VALIDATIONS
// ============================================

/**
 * Validate workout set (weight + reps together)
 */
export function validateSet(weight: string | number, reps: string | number) {
  const weightResult = validateWeight(weight);
  const repsResult = validateReps(reps);

  return {
    isValid: weightResult.isValid && repsResult.isValid,
    weight: weightResult.value,
    reps: repsResult.value,
    errors: {
      weight: weightResult.error,
      reps: repsResult.error
    }
  };
}

/**
 * Validate profile data
 */
export function validateProfileData(data: {
  name?: string;
  email?: string;
  weight?: string | number;
  height?: string | number;
}) {
  const errors: Record<string, string> = {};
  const validated: Record<string, any> = {};

  if (data.name !== undefined) {
    const result = validateName(data.name);
    if (!result.isValid && result.error) {
      errors.name = result.error;
    }
    validated.name = result.value;
  }

  if (data.email !== undefined) {
    const result = validateEmail(data.email);
    if (!result.isValid && result.error) {
      errors.email = result.error;
    }
    validated.email = result.value;
  }

  if (data.weight !== undefined) {
    const result = validateBodyWeight(data.weight);
    if (!result.isValid && result.error) {
      errors.weight = result.error;
    }
    validated.weight = result.value;
  }

  if (data.height !== undefined) {
    const result = validateHeight(data.height);
    if (!result.isValid && result.error) {
      errors.height = result.error;
    }
    validated.height = result.value;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    validated,
    errors
  };
}

// ============================================
// EXPORTS
// ============================================

export type {
  NumericValidationResult,
  StringValidationResult
};
