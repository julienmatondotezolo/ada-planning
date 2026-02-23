// Internationalization for ADA Design System
export type Locale = 'en' | 'fr' | 'nl';

export interface Translations {
  common: {
    loading: string;
    error: string;
    success: string;
    warning: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    confirm: string;
    search: string;
    clear: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    reset: string;
  };
  forms: {
    required: string;
    invalid: string;
    tooShort: string;
    tooLong: string;
    invalidEmail: string;
    passwordMismatch: string;
  };
  navigation: {
    home: string;
    dashboard: string;
    menu: string;
    settings: string;
    profile: string;
    logout: string;
  };
}

const translations: Record<Locale, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      confirm: 'Confirm',
      search: 'Search',
      clear: 'Clear',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
    },
    forms: {
      required: 'This field is required',
      invalid: 'Invalid value',
      tooShort: 'Too short',
      tooLong: 'Too long',
      invalidEmail: 'Invalid email address',
      passwordMismatch: 'Passwords do not match',
    },
    navigation: {
      home: 'Home',
      dashboard: 'Dashboard',
      menu: 'Menu',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
    },
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      warning: 'Attention',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      close: 'Fermer',
      confirm: 'Confirmer',
      search: 'Rechercher',
      clear: 'Effacer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      submit: 'Soumettre',
      reset: 'Réinitialiser',
    },
    forms: {
      required: 'Ce champ est obligatoire',
      invalid: 'Valeur invalide',
      tooShort: 'Trop court',
      tooLong: 'Trop long',
      invalidEmail: 'Adresse email invalide',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
    },
    navigation: {
      home: 'Accueil',
      dashboard: 'Tableau de bord',
      menu: 'Menu',
      settings: 'Paramètres',
      profile: 'Profil',
      logout: 'Déconnexion',
    },
  },
  nl: {
    common: {
      loading: 'Laden...',
      error: 'Fout',
      success: 'Succes',
      warning: 'Waarschuwing',
      cancel: 'Annuleren',
      save: 'Opslaan',
      delete: 'Verwijderen',
      edit: 'Bewerken',
      add: 'Toevoegen',
      close: 'Sluiten',
      confirm: 'Bevestigen',
      search: 'Zoeken',
      clear: 'Wissen',
      back: 'Terug',
      next: 'Volgende',
      previous: 'Vorige',
      submit: 'Verzenden',
      reset: 'Herstellen',
    },
    forms: {
      required: 'Dit veld is verplicht',
      invalid: 'Ongeldige waarde',
      tooShort: 'Te kort',
      tooLong: 'Te lang',
      invalidEmail: 'Ongeldig e-mailadres',
      passwordMismatch: 'Wachtwoorden komen niet overeen',
    },
    navigation: {
      home: 'Home',
      dashboard: 'Dashboard',
      menu: 'Menu',
      settings: 'Instellingen',
      profile: 'Profiel',
      logout: 'Uitloggen',
    },
  },
};

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

export function t(locale: Locale) {
  return (key: string) => getTranslation(locale, key);
}

// Default locale
export const DEFAULT_LOCALE: Locale = 'en';

// Utility function to detect browser locale
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'fr', 'nl'].includes(browserLang) ? browserLang as Locale : DEFAULT_LOCALE;
}