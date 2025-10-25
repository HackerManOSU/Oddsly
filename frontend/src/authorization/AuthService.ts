/* ++++++++++++++++++++ AUTHENTICATION SERVICE ++++++++++++++++++++ */
// const API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

/* ++++++++++ SIGN UP ++++++++++ */
export const signUp = async (
  email: string,
  password: string,
  additionalData?: { fullName: string; dateOfBirth: string }
) => {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password, ...additionalData }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to sign up");
  }

  return data;
};


/* ++++++++++ SIGN IN ++++++++++ */

export const signIn = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/signin`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to sign in');

  }

  return data;
};

/* ++++++++++ SIGN OUT ++++++++++ */
export const signOut = async () => {
  const response = await fetch(`${API_BASE_URL}/signout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    }
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to sign out');
  }

  return data;
};

/* ++++++++++ FORGOT PASSWORD ++++++++++ */
export const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/forgotPassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send password reset email');
  }

  return data;
};

/* ++++++++++ GET USER PROFILE ++++++++++ */
export const getUserProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/userProfile`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch user profile');
  }

  return data.profile;
};

/* ++++++++++ UPDATE USER PROFILE ++++++++++ */
export const updateUserProfile = async (profileData: unknown) => {
  const response = await fetch(`${API_BASE_URL}/userProfile`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update user profile');
  }

  return data;
};