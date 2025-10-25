/* ++++++++++ AUTHORIZATION ++++++++++ */
import { signOut } from '../../authorization/AuthService';
import useAuth from '../../authorization/useAuth';

const Logout = () => {
  const { refreshAuth } = useAuth();

  // Handle logout
  const handleLogout = async () => {
    await signOut(); // Call the signOut function
    refreshAuth(); // Refresh the authentication context
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-neon rounded-md text-white px-4 py-2 hover:scale-[1.1] duration-[300ms]"
    >
      Logout
    </button>
  );
};

export default Logout;
