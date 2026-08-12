
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">About Us</h1>
          <p className="text-gray-600">About page content goes here.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;