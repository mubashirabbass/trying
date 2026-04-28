import { MainLayout } from "@/components/MainLayout";

export default function About() {
  return (
    <MainLayout>
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About Global College</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Empowering the next generation of digital professionals in Pakistan.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-4 text-lg">
              At Global College, we believe that high-quality tech education should be accessible to everyone. Our mission is to bridge the skills gap in Pakistan by providing industry-relevant training in Information Technology, Graphic Design, Freelancing, and Artificial Intelligence.
            </p>
            <p className="text-gray-600 text-lg">
              We focus on practical, hands-on learning that prepares our students for real-world challenges and helps them build successful careers in the global digital economy.
            </p>
          </div>
          <div className="bg-gray-200 aspect-video rounded-xl overflow-hidden relative">
            {/* Placeholder for an image */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              [Campus Image]
            </div>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold">Team Member {i}</h3>
                <p className="text-primary">Department Head</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
