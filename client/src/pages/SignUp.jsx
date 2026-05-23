import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md flex items-center justify-center flex-col">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Care Now</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <SignUp
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white rounded-xl border border-gray-100 shadow-none",
              headerTitle: "text-gray-800",
              headerSubtitle: "text-gray-500",
              formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white",
              footerActionLink: "text-teal-600 hover:text-teal-700",
            },
          }}
        />
      </div>
    </div>
  );
}
