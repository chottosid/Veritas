import { Citizen, Police, Judge, Lawyer } from "../models/index.js";

/**
 * Check if email is already used across all user roles
 * @param {string} email - Email address to check
 * @param {string} excludeRole - Role to exclude from check (for updates)
 * @param {string} excludeId - User ID to exclude from check (for updates)
 * @returns {Promise<{isUnique: boolean, existingUser: object|null, role: string|null}>}
 */
export const checkEmailUniqueness = async (email, excludeRole = null, excludeId = null) => {
  try {
    // Check in Citizen collection
    if (excludeRole !== 'CITIZEN') {
      const existingCitizen = await Citizen.findOne({ email });
      if (existingCitizen && (!excludeId || existingCitizen._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingCitizen,
          role: 'CITIZEN'
        };
      }
    }

    // Check in Police collection
    if (excludeRole !== 'POLICE') {
      const existingPolice = await Police.findOne({ email });
      if (existingPolice && (!excludeId || existingPolice._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingPolice,
          role: 'POLICE'
        };
      }
    }

    // Check in Judge collection
    if (excludeRole !== 'JUDGE') {
      const existingJudge = await Judge.findOne({ email });
      if (existingJudge && (!excludeId || existingJudge._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingJudge,
          role: 'JUDGE'
        };
      }
    }

    // Check in Lawyer collection
    if (excludeRole !== 'LAWYER') {
      const existingLawyer = await Lawyer.findOne({ email });
      if (existingLawyer && (!excludeId || existingLawyer._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingLawyer,
          role: 'LAWYER'
        };
      }
    }

    return {
      isUnique: true,
      existingUser: null,
      role: null
    };
  } catch (error) {
    console.error('Error checking email uniqueness:', error);
    throw error;
  }
};

/**
 * Check if phone number is already used across all user roles
 * @param {string} phone - Phone number to check
 * @param {string} excludeRole - Role to exclude from check (for updates)
 * @param {string} excludeId - User ID to exclude from check (for updates)
 * @returns {Promise<{isUnique: boolean, existingUser: object|null, role: string|null}>}
 */
export const checkPhoneUniqueness = async (phone, excludeRole = null, excludeId = null) => {
  try {
    // Check in Citizen collection
    if (excludeRole !== 'CITIZEN') {
      const existingCitizen = await Citizen.findOne({ phone });
      if (existingCitizen && (!excludeId || existingCitizen._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingCitizen,
          role: 'CITIZEN'
        };
      }
    }

    // Check in Police collection
    if (excludeRole !== 'POLICE') {
      const existingPolice = await Police.findOne({ phone });
      if (existingPolice && (!excludeId || existingPolice._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingPolice,
          role: 'POLICE'
        };
      }
    }

    // Check in Judge collection
    if (excludeRole !== 'JUDGE') {
      const existingJudge = await Judge.findOne({ phone });
      if (existingJudge && (!excludeId || existingJudge._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingJudge,
          role: 'JUDGE'
        };
      }
    }

    // Check in Lawyer collection
    if (excludeRole !== 'LAWYER') {
      const existingLawyer = await Lawyer.findOne({ phone });
      if (existingLawyer && (!excludeId || existingLawyer._id.toString() !== excludeId)) {
        return {
          isUnique: false,
          existingUser: existingLawyer,
          role: 'LAWYER'
        };
      }
    }

    return {
      isUnique: true,
      existingUser: null,
      role: null
    };
  } catch (error) {
    console.error('Error checking phone uniqueness:', error);
    throw error;
  }
};

/**
 * Get role display name
 * @param {string} role - Role code
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    'CITIZEN': 'Citizen',
    'POLICE': 'Police Officer',
    'JUDGE': 'Judge',
    'LAWYER': 'Lawyer'
  };
  return roleNames[role] || role;
};

