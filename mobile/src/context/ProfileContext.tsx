import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

export interface ProfileFormData {
  // Step 0: Basics
  profile_registered_for: string;
  name: string;
  gender: 'M' | 'F' | '';
  date_of_birth: string;
  // Step 1: Education
  education: string;
  occupation: string;
  // Step 2: Height
  height_feet: string;
  height_inches: string;
  // Step 3: Lifestyle
  diet: string;
  family_values: string;
  career_goals: string;
  willing_to_relocate: string;
  // Step 4: Income
  income_range: string;
  manglik_status: string;
  // Step 5: Religion
  religion_id: string;
  caste_id: string;
  sub_religion: string;
  // Step 6: Astrology
  raasi_id: string;
  star_id: string;
  // Step 7: Location
  born_country_id: string;
  current_country_id: string;
  city_or_state: string;
  // Step 8: Media
  blur_photo: number;
  blur_horoscope: number;
  // Step 9: Bio
  about_me: string;
}

export const EMPTY_PROFILE: ProfileFormData = {
  profile_registered_for: 'Self',
  name: '',
  gender: '',
  date_of_birth: '',
  education: '',
  occupation: '',
  height_feet: '5',
  height_inches: '6',
  diet: 'any',
  family_values: 'moderate',
  career_goals: 'working',
  willing_to_relocate: 'open',
  income_range: '$50k - $100k',
  manglik_status: 'no',
  religion_id: '',
  caste_id: '',
  sub_religion: '',
  raasi_id: '',
  star_id: '',
  born_country_id: '',
  current_country_id: '',
  city_or_state: '',
  blur_photo: 0,
  blur_horoscope: 0,
  about_me: '',
};

interface ProfileContextType {
  form: ProfileFormData;
  setField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
  setForm: (partial: Partial<ProfileFormData>) => void;
  resetForm: () => void;
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  horoscopeUri: string | null;
  setHoroscopeUri: (uri: string | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [form, setFormState] = useState<ProfileFormData>(EMPTY_PROFILE);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [horoscopeUri, setHoroscopeUri] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const setField = useCallback(
    <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setForm = useCallback((partial: Partial<ProfileFormData>) => {
    setFormState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState(EMPTY_PROFILE);
    setPhotoUri(null);
    setHoroscopeUri(null);
    setCurrentStep(0);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        form,
        setField,
        setForm,
        resetForm,
        photoUri,
        setPhotoUri,
        horoscopeUri,
        setHoroscopeUri,
        currentStep,
        setCurrentStep,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
