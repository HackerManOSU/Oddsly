import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../authorization/useAuth';
import { FC } from 'react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionCheckoutProps {
  onError?: (error: string) => void;
}

const SubscriptionCheckout: FC<SubscriptionCheckoutProps> = ({ onError }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCheckout = async () => {
    try {
      if (!user) {
        navigate('/login');
        throw new Error('Please log in to subscribe');
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          navigate('/login');
          throw new Error('Please log in to subscribe');
        }
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      if (!sessionId) {
        throw new Error('No session ID returned');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  };

  return (
    <button onClick={handleCheckout} className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-neon rounded-lg hover:bg-opacity-90 transition-all" >
      Subscribe
    </button>
  );
};

export { SubscriptionCheckout };