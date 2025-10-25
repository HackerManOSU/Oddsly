import { Link } from 'react-router-dom';

const PaymentFailed = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          We were unable to process your payment. Please try again or contact support if the issue persists.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Return Home
          </Link>
          <Link
            to="/subscribe"
            className="px-6 py-2 bg-neon text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;