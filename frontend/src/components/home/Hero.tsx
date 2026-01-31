export function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to ComSpace
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Discover amazing products with secure payments and worldwide delivery.
          Shop with confidence in multiple currencies.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/products"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Shop Now
          </a>
          <a
            href="/about"
            className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
